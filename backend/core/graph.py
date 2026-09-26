"""
LangGraph Workflow — Adaptive Cognitive Voice Assistant Pipeline.

Graph nodes:
  1. detect_language
  2. analyze_confusion
  3. classify_intent
  4. retrieve_memory
  5. determine_next_step  (router)
  6. ask_one_question
  7. execute_tool
  8. simplify_response

Edges implement the confirmation-before-execution pattern.
"""
from __future__ import annotations

import json
import re
from datetime import datetime
from typing import TypedDict, Annotated, Any

from config import get_settings
from core.memory import SessionState
from core.language import detect_language, get_voice_tag
from core.agents.confusion import analyze_and_update, get_simplification_instructions
from core.skills import SKILLS, get_skill, all_skill_descriptions

settings = get_settings()

# ── LLM Initialisation ────────────────────────────────────────────────────────

def _build_llm():
    if settings.llm_provider == "gemini" and settings.google_api_key:
        from langchain_google_genai import ChatGoogleGenerativeAI
        return ChatGoogleGenerativeAI(
            model=settings.llm_model,
            google_api_key=settings.google_api_key,
            temperature=0.3,
        )
    elif settings.openai_api_key:
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(model="gpt-4o-mini", api_key=settings.openai_api_key, temperature=0.3)
    return None


def _classify_intent_locally(text: str) -> str:
    """Deterministic fallback when no hosted LLM is configured."""
    lowered = text.lower()
    keyword_map: dict[str, list[str]] = {
        "attendance": ["attendance", "present", "absent", "roll call"],
        "marks_entry": ["marks", "grade", "score", "result", "exam"],
        "homework": ["homework", "assignment", "assign", "due"],
        "schedule_reminder": ["reminder", "remind", "meeting", "calendar", "schedule"],
        "lesson_plan": ["lesson plan", "lesson", "teach", "topic plan"],
        "quiz": ["quiz", "test", "practice questions", "practice test"],
        "homework_help": ["doubt", "homework help", "explain", "understand", "help me with"],
        "student_lookup": ["student lookup", "student", "find student", "look up"],
        "voice_note": ["voice note", "note", "memo", "record this"],
        "class_summary": ["class summary", "summary", "summarize", "recap"],
    }

    for skill_name, keywords in keyword_map.items():
        if any(keyword in lowered for keyword in keywords):
            return skill_name

    return "general_chat"


def _general_response_locally(session: SessionState, user_text: str) -> str:
    """Simple offline response for demo environments without an LLM key."""
    lowered = user_text.strip().lower()
    if not lowered:
        return "I'm listening. Please say that again slowly."
    if any(word in lowered for word in ["hello", "hi", "hey", "namaste"]):
        return "Hello. I'm ready when you are."
    if any(word in lowered for word in ["thank", "thanks"]):
        return "You're welcome. I'm here whenever you need me."
    if session.simplified_mode:
        return "I'm here to help. Please say one small step at a time."
    return "I can help with attendance, homework, reminders, quizzes, and more."


# ── Graph State ───────────────────────────────────────────────────────────────

class GraphState(TypedDict):
    session: SessionState
    user_text: str
    detected_lang: str
    intent: str | None
    response: str
    next_question: str | None
    ready_to_execute: bool
    awaiting_confirmation: bool
    execution_result: dict | None
    voice_tag: str
    error: str | None


# ── Node Functions ────────────────────────────────────────────────────────────

def node_detect_language(state: GraphState) -> GraphState:
    lang = detect_language(state["user_text"])
    state["session"].language = lang
    state["detected_lang"] = lang
    state["voice_tag"] = get_voice_tag(lang)
    return state


def node_analyze_confusion(state: GraphState) -> GraphState:
    state["session"] = analyze_and_update(state["session"], state["user_text"])
    return state


def node_classify_intent(state: GraphState) -> GraphState:
    session = state["session"]
    user_text = state["user_text"]
    lowered = user_text.lower()

    # Let the user exit the current skill cleanly.
    if session.active_skill and any(kw in lowered for kw in ["stop", "cancel", "quit", "new", "different"]):
        session.active_skill = None
        session.awaiting_confirmation = False
        session.pending_action = {}
        session.collected_fields = {}
        session.step_index = 0
        state["session"] = session
        state["intent"] = "general_chat"
        return state

    # If already in a skill, keep using it.
    if session.active_skill:
        state["intent"] = session.active_skill
        return state

    llm = _build_llm()
    if llm is None:
        intent = _classify_intent_locally(user_text)
        state["intent"] = intent
        if intent != "general_chat":
            session.active_skill = intent
            state["session"] = session
        return state

    system = f"""You are an intent classifier for a voice assistant used by teachers and students.
Available skills:
{all_skill_descriptions()}

Respond with ONLY the skill name (e.g. "attendance") or "general_chat" if none match.
Do NOT add any explanation."""

    from langchain_core.messages import HumanMessage, SystemMessage
    messages = [SystemMessage(content=system), HumanMessage(content=user_text)]
    try:
        result = llm.invoke(messages)
        intent = result.content.strip().lower().split()[0]
        # Validate
        if intent not in SKILLS and intent != "general_chat":
            intent = "general_chat"
        state["intent"] = intent
        if intent != "general_chat":
            session.active_skill = intent
            state["session"] = session
    except Exception as e:
        intent = _classify_intent_locally(user_text)
        state["intent"] = intent
        if intent != "general_chat":
            session.active_skill = intent
            state["session"] = session
        else:
            state["error"] = str(e)

    return state


def node_retrieve_memory(state: GraphState) -> GraphState:
    session = state["session"]
    intent = state.get("intent", "general_chat")

    # If new intent, reset skill state
    if intent and intent != "general_chat" and intent != session.active_skill:
        session.reset_for_new_skill(intent)
    elif intent and intent != "general_chat":
        session.active_skill = intent

    state["session"] = session
    return state


def node_determine_next_step(state: GraphState) -> str:
    """Router — decides which node to go to next."""
    session = state["session"]
    intent = state.get("intent", "general_chat")

    if intent == "general_chat":
        return "general_response"

    skill = get_skill(intent)
    if not skill:
        return "general_response"

    # Check if awaiting confirmation answer
    if session.awaiting_confirmation:
        user_text_lower = state["user_text"].lower()
        confirmed_words = ["yes", "yeah", "correct", "right", "ok", "okay", "sure", "haan", "ha"]
        rejected_words = ["no", "nope", "wrong", "incorrect", "nahi", "na", "change", "different"]
        if any(w in user_text_lower for w in confirmed_words):
            return "execute_tool"
        elif any(w in user_text_lower for w in rejected_words):
            # User rejected — go back to collecting fields
            session.awaiting_confirmation = False
            session.step_index = 0
            session.collected_fields = {}
            state["session"] = session
            return "ask_question"
        else:
            return "ask_confirmation"

    # Check if we have all required fields
    required_steps = [s for s in skill.steps if not s.optional]
    collected = session.collected_fields
    missing = [s for s in required_steps if s.field_name not in collected or not collected[s.field_name]]

    if missing:
        return "ask_question"

    if skill.requires_confirmation and not session.awaiting_confirmation:
        return "ask_confirmation"

    return "execute_tool"


def node_ask_question(state: GraphState) -> GraphState:
    session = state["session"]
    intent = state.get("intent", "")
    skill = get_skill(intent)

    if skill:
        session.active_skill = intent

    if not skill:
        state["response"] = "I'm not sure what you need. Could you please tell me again?"
        return state

    # Store the previous answer if there was a last question
    if session.last_question and state["user_text"]:
        # Find which step the last question was for
        for step in skill.steps:
            if step.question.lower() in (session.last_question or "").lower():
                if step.field_name not in session.collected_fields:
                    session.collected_fields[step.field_name] = state["user_text"]
                break
        # Also try by step index
        if session.step_index > 0 and session.step_index <= len(skill.steps):
            prev_step = skill.steps[session.step_index - 1]
            if prev_step.field_name not in session.collected_fields:
                session.collected_fields[prev_step.field_name] = state["user_text"]

    # Find next unanswered step
    next_step = None
    for i, step in enumerate(skill.steps):
        if step.field_name not in session.collected_fields or not session.collected_fields.get(step.field_name):
            next_step = step
            session.step_index = i + 1
            break

    if not next_step:
        # All collected — this shouldn't normally be reached
        state["response"] = "Got everything. Let me confirm with you."
        return state

    question = next_step.question
    if session.simplified_mode and next_step.examples:
        question = f"{question} ({next_step.examples})"

    session.last_question = question
    state["session"] = session
    state["response"] = question
    state["next_question"] = question
    return state


def node_ask_confirmation(state: GraphState) -> GraphState:
    session = state["session"]
    intent = state.get("intent", "")
    skill = get_skill(intent)

    if skill:
        session.active_skill = intent

    if not skill:
        state["response"] = "Should I go ahead?"
        session.awaiting_confirmation = True
        return state

    # Format confirmation template
    template = skill.confirmation_template
    try:
        confirmation = template.format(**session.collected_fields)
    except KeyError:
        fields_summary = ", ".join(f"{k}: {v}" for k, v in session.collected_fields.items())
        confirmation = f"I'm going to {skill.display_name} with: {fields_summary}. Is that correct?"

    session.awaiting_confirmation = True
    session.pending_action = {"skill": intent, "fields": session.collected_fields.copy()}
    state["session"] = session
    state["response"] = confirmation
    return state


def node_execute_tool(state: GraphState) -> GraphState:
    session = state["session"]
    pending = session.pending_action or {"skill": state.get("intent", ""), "fields": session.collected_fields}
    skill_name = pending.get("skill", "")
    fields = pending.get("fields", {})

    # Mock execution (in production, call real APIs)
    result = _mock_execute_skill(skill_name, fields)

    session.awaiting_confirmation = False
    session.active_skill = None
    session.pending_action = {}
    session.collected_fields = {}
    session.step_index = 0

    state["session"] = session
    state["execution_result"] = result
    state["response"] = result.get("message", "Done!")
    return state


def _mock_execute_skill(skill_name: str, fields: dict) -> dict:
    """Simulates executing a skill. Replace with real API calls."""
    today = datetime.now().strftime("%Y-%m-%d")

    if skill_name == "attendance":
        return {
            "success": True,
            "message": f"✅ Attendance marked for {fields.get('class_name', '')} {fields.get('section', '')} — {fields.get('subject', '')} on {fields.get('date', today)}. All students counted.",
            "data": {"class": fields.get("class_name"), "section": fields.get("section"), "date": today}
        }
    elif skill_name == "homework":
        return {
            "success": True,
            "message": f"📚 Homework assigned for {fields.get('class_name', '')} {fields.get('subject', '')}: {fields.get('description', '')}. Students will be notified.",
            "data": fields
        }
    elif skill_name == "marks_entry":
        return {
            "success": True,
            "message": f"📝 Marks entry opened for {fields.get('class_name', '')} — {fields.get('subject', '')} — {fields.get('exam_type', '')}. Ready for input.",
            "data": fields
        }
    elif skill_name == "schedule_reminder":
        return {
            "success": True,
            "message": f"🔔 Reminder set: '{fields.get('reminder_text', '')}' at {fields.get('reminder_time', '')}.",
            "data": fields
        }
    elif skill_name == "voice_note":
        return {
            "success": True,
            "message": f"🎤 Note saved: '{fields.get('note_content', '')}'",
            "data": fields
        }
    else:
        return {
            "success": True,
            "message": f"✅ Task completed: {skill_name}. Fields: {json.dumps(fields)}",
            "data": fields
        }


def node_general_response(state: GraphState) -> GraphState:
    """Handle general conversation / questions."""
    session = state["session"]
    simplification = get_simplification_instructions(session)
    llm = _build_llm()

    if llm is None:
        state["response"] = _general_response_locally(session, state["user_text"])
        return state

    system = f"""You are a helpful, friendly voice assistant for teachers and students.
You speak {session.language} (respond in the same language as the user).
{simplification}
Keep responses SHORT — maximum 2 sentences.
Be warm, encouraging, and patient."""

    from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
    # Build message history
    msgs = [SystemMessage(content=system)]
    for m in session.messages[-6:]:  # last 6 messages for context
        if m["role"] == "user":
            msgs.append(HumanMessage(content=m["content"]))
        else:
            msgs.append(AIMessage(content=m["content"]))
    msgs.append(HumanMessage(content=state["user_text"]))

    try:
        result = llm.invoke(msgs)
        state["response"] = result.content
    except Exception as e:
        state["response"] = "I'm here to help. Could you please repeat that?"
        state["error"] = str(e)

    return state


def node_simplify_response(state: GraphState) -> GraphState:
    """Post-process: ensure response is short and clear for simplified mode."""
    session = state["session"]
    response = state["response"]

    if not response:
        state["response"] = "I didn't catch that. Could you please say it again?"
        return state

    # In simplified mode, truncate and simplify
    if session.simplified_mode:
        sentences = re.split(r'(?<=[.!?])\s+', response)
        if len(sentences) > 2:
            state["response"] = " ".join(sentences[:2])

    return state


class SimpleVoiceGraph:
    """Minimal in-process pipeline runner used instead of LangGraph."""

    def invoke(self, initial_state: GraphState) -> GraphState:
        state = node_detect_language(initial_state)
        state = node_analyze_confusion(state)
        state = node_classify_intent(state)
        state = node_retrieve_memory(state)

        route = node_determine_next_step(state)
        if route == "ask_question":
            state = node_ask_question(state)
        elif route == "ask_confirmation":
            state = node_ask_confirmation(state)
        elif route == "execute_tool":
            state = node_execute_tool(state)
        else:
            state = node_general_response(state)

        state = node_simplify_response(state)
        return state


voice_graph = SimpleVoiceGraph()


async def process_voice_input(session: SessionState, user_text: str) -> dict:
    """
    Main entry point: feed user text into the LangGraph pipeline.
    Returns a dict with 'response', 'session', 'voice_tag', 'skill', 'step', 'total_steps'.
    """
    initial_state: GraphState = {
        "session": session,
        "user_text": user_text,
        "detected_lang": session.language,
        "intent": session.active_skill,
        "response": "",
        "next_question": None,
        "ready_to_execute": False,
        "awaiting_confirmation": session.awaiting_confirmation,
        "execution_result": None,
        "voice_tag": get_voice_tag(session.language),
        "error": None,
    }

    result_state = voice_graph.invoke(initial_state)

    updated_session: SessionState = result_state["session"]
    updated_session.add_message("user", user_text)
    updated_session.add_message("assistant", result_state["response"])

    skill = get_skill(updated_session.active_skill or "")
    total_steps = len(skill.steps) if skill else 0

    return {
        "response": result_state["response"],
        "session": updated_session,
        "voice_tag": result_state["voice_tag"],
        "skill": updated_session.active_skill,
        "step": updated_session.step_index,
        "total_steps": total_steps,
        "awaiting_confirmation": updated_session.awaiting_confirmation,
        "simplified_mode": updated_session.simplified_mode,
        "confusion_score": updated_session.confusion_score,
        "execution_result": result_state.get("execution_result"),
        "error": result_state.get("error"),
    }
