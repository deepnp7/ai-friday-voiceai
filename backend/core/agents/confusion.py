"""
Cognitive Load / Confusion Detector.

Scores incoming user text for signs of cognitive overload, confusion,
hesitation, and repeated queries. Updates session state accordingly.
"""
from __future__ import annotations

import re
from core.memory import SessionState
from core.language import is_confusion_signal

# Confusion patterns (English, extendable)
_CONFUSION_PATTERNS = [
    r"\b(what|huh|confused|unclear|don'?t\s+understand|don'?t\s+get|not\s+sure)\b",
    r"\b(again|repeat|say\s+again|come\s+again|pardon)\b",
    r"\b(help|stuck|lost|forget|forgot)\b",
    r"^\s*\?+\s*$",          # Only question marks
    r"^(um+|uh+|err+|hmm+)\s*$",   # Filler sounds
]

_COMPILED = [re.compile(p, re.IGNORECASE) for p in _CONFUSION_PATTERNS]


def compute_confusion_delta(text: str, lang: str = "en") -> float:
    """
    Returns a confusion delta 0.0–0.4 based on text content.
    Called once per user turn; accumulated in SessionState.confusion_score.
    """
    if not text or len(text.strip()) < 2:
        return 0.15   # very short response = possibly confused

    score = 0.0

    # Language-aware confusion signals
    if is_confusion_signal(text, lang):
        score += 0.25

    # Pattern matching (English)
    for pattern in _COMPILED:
        if pattern.search(text):
            score += 0.1
            break  # one match is enough

    # Very short utterance
    if len(text.split()) <= 2:
        score += 0.05

    return min(score, 0.4)


def analyze_and_update(state: SessionState, user_text: str) -> SessionState:
    """
    Analyze user_text for confusion signals and update SessionState.
    Also handles repeat detection: if user said the same thing as last turn, increment repeat_count.
    Returns updated state.
    """
    lang = state.language
    delta = compute_confusion_delta(user_text, lang)

    # Detect repetition
    if state.messages:
        last_user_msgs = [m for m in state.messages[-4:] if m["role"] == "user"]
        if last_user_msgs and last_user_msgs[-1]["content"].strip().lower() == user_text.strip().lower():
            state.repeat_count += 1
            delta += 0.15  # repeated same input → more confused

    if delta > 0:
        state.increment_confusion(delta)

    return state


def get_simplification_instructions(state: SessionState) -> str:
    """
    Returns a prompt snippet telling the LLM how simplified to be,
    based on current confusion score.
    """
    if state.confusion_score >= 0.8 or state.simplified_mode:
        return (
            "CRITICAL: The user is very confused. Use extremely simple words. "
            "Maximum 1 short sentence. Speak like explaining to a 6-year-old. "
            "No jargon. Offer to repeat or restart."
        )
    elif state.confusion_score >= 0.5:
        return (
            "The user seems confused. Keep response under 2 short sentences. "
            "Use simple, everyday words. Avoid technical terms."
        )
    elif state.confusion_score >= 0.2:
        return "Keep response clear and concise. Prefer simple words."
    else:
        return "Respond naturally and helpfully."
