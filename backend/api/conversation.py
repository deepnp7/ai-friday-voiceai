"""
Conversation API — WebSocket + REST endpoints for voice interaction.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.auth import get_current_user
from config import get_settings
from core.graph import process_voice_input
from core.memory import memory_engine, SessionState
from db.database import get_db
from db.models import User, Session as DBSession, Message, Task, AnalyticsEvent

router = APIRouter(prefix="/conversation", tags=["conversation"])
settings = get_settings()


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class StartSessionRequest(BaseModel):
    language: str = "en"
    speaking_speed: str = "normal"


class StartSessionResponse(BaseModel):
    session_id: str
    greeting: str
    voice_tag: str


class ChatRequest(BaseModel):
    session_id: str
    text: str


class ChatResponse(BaseModel):
    response: str
    voice_tag: str
    skill: str | None
    step: int
    total_steps: int
    awaiting_confirmation: bool
    simplified_mode: bool
    confusion_score: float
    execution_result: dict | None
    session_id: str


class SessionHistoryResponse(BaseModel):
    session_id: str
    messages: list[dict]
    started_at: str
    skill: str | None
    completed: bool


# ── Helpers ───────────────────────────────────────────────────────────────────

GREETINGS: dict[str, str] = {
    "en": "Hello! I'm your voice assistant. How can I help you today?",
    "hi": "Namaste! Main aapka voice assistant hoon. Aaj main aapki kya madad kar sakta hoon?",
    "bn": "Namaskar! Ami apnar voice assistant. Aaj ami ki apnar sahe ki korte pari?",
    "ta": "Vanakkam! Nan ungal voice assistant. Inru nan ungalukku eppadip paduttuvathu?",
    "te": "Namaskaram! Nenu mee voice assistant. Nenu meeru ela sahayapadadam?",
    "kn": "Namaskara! Naanu nimage voice assistant. Indina nanu hege sahaya madabahudhu?",
    "ml": "Namaskaram! Njan ningalude voice assistant. Innu njan ningale enthu sahayikkam?",
    "mr": "Namaskar! Mi tumcha voice assistant aahe. Aaj mi tumchi kashi madad karu?",
}


async def _log_analytics(db: AsyncSession, user_id: str, session_id: str, event_type: str, meta: dict):
    if settings.enable_analytics:
        db.add(AnalyticsEvent(
            user_id=user_id, session_id=session_id,
            event_type=event_type, metadata_json=meta
        ))


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/start", response_model=StartSessionResponse)
async def start_session(
    req: StartSessionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new conversation session."""
    session_id = str(uuid.uuid4())

    # Long-term memory: preferred lang/speed
    saved_lang = await memory_engine.get_long_term(db, current_user.id, "preferred_lang")
    saved_speed = await memory_engine.get_long_term(db, current_user.id, "speaking_speed")
    lang = saved_lang or req.language
    speed = saved_speed or req.speaking_speed

    state = memory_engine.create_session(session_id, current_user.id, lang, speed)

    # Persist to DB
    db_session = DBSession(
        id=session_id,
        user_id=current_user.id,
        active_skill=None,
    )
    db.add(db_session)
    await memory_engine.set_long_term(db, current_user.id, "preferred_lang", lang)
    await memory_engine.set_long_term(db, current_user.id, "speaking_speed", speed)

    from core.language import get_voice_tag
    greeting = GREETINGS.get(lang, GREETINGS["en"])
    voice_tag = get_voice_tag(lang)

    return StartSessionResponse(session_id=session_id, greeting=greeting, voice_tag=voice_tag)


@router.post("/chat", response_model=ChatResponse)
async def chat(
    req: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Process a voice transcript and return the assistant response."""
    state = memory_engine.get_session(req.session_id)
    if not state:
        # Session expired or server restarted — recreate
        state = memory_engine.create_session(req.session_id, current_user.id)

    result = await process_voice_input(state, req.text)

    # Update in-memory state
    memory_engine.update_session(result["session"])

    # Persist message to DB
    db.add(Message(
        session_id=req.session_id,
        role="user",
        content=req.text,
        language=result["session"].language,
    ))
    db.add(Message(
        session_id=req.session_id,
        role="assistant",
        content=result["response"],
        language=result["session"].language,
    ))

    # Analytics
    if result["simplified_mode"]:
        await _log_analytics(db, current_user.id, req.session_id, "simplified_mode_triggered", {})
    if result.get("execution_result"):
        await _log_analytics(db, current_user.id, req.session_id, "skill_executed", {
            "skill": result.get("skill"), "success": result["execution_result"].get("success")
        })

    # Persist current session state for reporting and history.
    db_result = await db.execute(select(DBSession).where(DBSession.id == req.session_id))
    db_session = db_result.scalar_one_or_none()
    if db_session:
        db_session.active_skill = result.get("skill")
        execution_result = result.get("execution_result") or {}
        if execution_result.get("success"):
            db_session.task_completed = True

    # Save preferred lang to long-term memory
    await memory_engine.set_long_term(db, current_user.id, "preferred_lang", result["session"].language)
    await memory_engine.set_long_term(db, current_user.id, "speaking_speed", result["session"].speaking_speed)

    return ChatResponse(
        response=result["response"],
        voice_tag=result["voice_tag"],
        skill=result.get("skill"),
        step=result.get("step", 0),
        total_steps=result.get("total_steps", 0),
        awaiting_confirmation=result.get("awaiting_confirmation", False),
        simplified_mode=result.get("simplified_mode", False),
        confusion_score=result.get("confusion_score", 0.0),
        execution_result=result.get("execution_result"),
        session_id=req.session_id,
    )


@router.post("/end/{session_id}")
async def end_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """End a conversation session."""
    memory_engine.end_session(session_id)

    result = await db.execute(select(DBSession).where(DBSession.id == session_id))
    db_session = result.scalar_one_or_none()
    if db_session:
        db_session.ended_at = datetime.utcnow()
        db_session.task_completed = True

    return {"status": "ended", "session_id": session_id}


@router.get("/history", response_model=list[SessionHistoryResponse])
async def get_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = 20,
):
    """Get conversation history for the current user."""
    result = await db.execute(
        select(DBSession)
        .where(DBSession.user_id == current_user.id)
        .order_by(DBSession.started_at.desc())
        .limit(limit)
    )
    sessions = result.scalars().all()

    history = []
    for s in sessions:
        msgs_result = await db.execute(
            select(Message).where(Message.session_id == s.id).order_by(Message.timestamp)
        )
        msgs = msgs_result.scalars().all()
        history.append(SessionHistoryResponse(
            session_id=s.id,
            messages=[{"role": m.role, "content": m.content, "timestamp": m.timestamp.isoformat()} for m in msgs],
            started_at=s.started_at.isoformat(),
            skill=s.active_skill,
            completed=s.task_completed,
        ))

    return history


# ── WebSocket ─────────────────────────────────────────────────────────────────

@router.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """Real-time WebSocket for low-latency voice chat."""
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_json()
            user_text = data.get("text", "")
            user_id = data.get("user_id", "anonymous")

            state = memory_engine.get_session(session_id)
            if not state:
                state = memory_engine.create_session(session_id, user_id)

            result = await process_voice_input(state, user_text)
            memory_engine.update_session(result["session"])

            await websocket.send_json({
                "response": result["response"],
                "voice_tag": result["voice_tag"],
                "skill": result.get("skill"),
                "step": result.get("step", 0),
                "total_steps": result.get("total_steps", 0),
                "awaiting_confirmation": result.get("awaiting_confirmation", False),
                "simplified_mode": result.get("simplified_mode", False),
            })
    except WebSocketDisconnect:
        memory_engine.end_session(session_id)
