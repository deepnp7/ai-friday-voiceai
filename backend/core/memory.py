"""
Memory Engine — short-term (in-session) and long-term (persistent) memory.

Short-term: Python dict keyed by session_id (can swap to Redis).
Long-term: SQLite user_memory table via UserMemory ORM model.
"""
from __future__ import annotations

import json
from dataclasses import dataclass, field, asdict
from datetime import datetime
from typing import Any

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from db.models import UserMemory

# ── Session State (in-memory) ─────────────────────────────────────────────────

@dataclass
class SessionState:
    session_id: str
    user_id: str
    language: str = "en"
    speaking_speed: str = "normal"
    active_skill: str | None = None
    step_index: int = 0
    collected_fields: dict = field(default_factory=dict)
    confusion_score: float = 0.0
    repeat_count: int = 0
    last_question: str | None = None
    awaiting_confirmation: bool = False
    pending_action: dict = field(default_factory=dict)
    messages: list[dict] = field(default_factory=list)
    simplified_mode: bool = False
    started_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())

    def to_dict(self) -> dict:
        return asdict(self)

    def add_message(self, role: str, content: str):
        self.messages.append({"role": role, "content": content, "ts": datetime.utcnow().isoformat()})

    def increment_confusion(self, delta: float = 0.2):
        self.confusion_score = min(1.0, self.confusion_score + delta)
        if self.confusion_score >= 0.6:
            self.simplified_mode = True

    def reset_for_new_skill(self, skill: str):
        self.active_skill = skill
        self.step_index = 0
        self.collected_fields = {}
        self.confusion_score = max(0.0, self.confusion_score - 0.3)
        self.awaiting_confirmation = False
        self.pending_action = {}


# ── In-Memory Store (Redis-shaped interface) ──────────────────────────────────

_session_store: dict[str, SessionState] = {}


class MemoryEngine:
    """Manages conversation memory for all active sessions."""

    # ── Short-term ────────────────────────────────────────────────────────────

    def get_session(self, session_id: str) -> SessionState | None:
        return _session_store.get(session_id)

    def create_session(self, session_id: str, user_id: str, lang: str = "en", speed: str = "normal") -> SessionState:
        state = SessionState(session_id=session_id, user_id=user_id, language=lang, speaking_speed=speed)
        _session_store[session_id] = state
        return state

    def update_session(self, state: SessionState) -> None:
        _session_store[state.session_id] = state

    def end_session(self, session_id: str) -> None:
        _session_store.pop(session_id, None)

    # ── Long-term (DB) ────────────────────────────────────────────────────────

    async def get_long_term(self, db: AsyncSession, user_id: str, key: str) -> Any | None:
        result = await db.execute(
            select(UserMemory).where(UserMemory.user_id == user_id, UserMemory.key == key)
        )
        item = result.scalar_one_or_none()
        if item is None:
            return None
        try:
            return json.loads(item.value)
        except json.JSONDecodeError:
            return item.value

    async def set_long_term(self, db: AsyncSession, user_id: str, key: str, value: Any) -> None:
        serialized = json.dumps(value) if not isinstance(value, str) else value
        result = await db.execute(
            select(UserMemory).where(UserMemory.user_id == user_id, UserMemory.key == key)
        )
        existing = result.scalar_one_or_none()
        if existing:
            await db.execute(
                update(UserMemory)
                .where(UserMemory.user_id == user_id, UserMemory.key == key)
                .values(value=serialized, updated_at=datetime.utcnow())
            )
        else:
            db.add(UserMemory(user_id=user_id, key=key, value=serialized))

    async def get_user_profile(self, db: AsyncSession, user_id: str) -> dict:
        """Retrieve all memory keys for a user as a dict."""
        result = await db.execute(select(UserMemory).where(UserMemory.user_id == user_id))
        items = result.scalars().all()
        profile = {}
        for item in items:
            try:
                profile[item.key] = json.loads(item.value)
            except Exception:
                profile[item.key] = item.value
        return profile


# Global singleton
memory_engine = MemoryEngine()
