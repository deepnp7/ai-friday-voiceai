"""
SQLAlchemy ORM models for all database tables.
"""
import uuid
from datetime import datetime
from sqlalchemy import (
    String, Integer, Float, Boolean, DateTime, Text, ForeignKey, JSON
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from db.database import Base


def gen_id() -> str:
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_id)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String)
    role: Mapped[str] = mapped_column(String(20), default="teacher")  # teacher|student|admin
    preferred_lang: Mapped[str] = mapped_column(String(5), default="en")
    speaking_speed: Mapped[str] = mapped_column(String(10), default="normal")  # slow|normal|fast
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    sessions: Mapped[list["Session"]] = relationship(back_populates="user")
    memory_items: Mapped[list["UserMemory"]] = relationship(back_populates="user")


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_id)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    task_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    active_skill: Mapped[str | None] = mapped_column(String(50), nullable=True)
    confusion_events: Mapped[int] = mapped_column(Integer, default=0)
    repeat_count: Mapped[int] = mapped_column(Integer, default=0)

    user: Mapped[User] = relationship(back_populates="sessions")
    messages: Mapped[list["Message"]] = relationship(back_populates="session")
    tasks: Mapped[list["Task"]] = relationship(back_populates="session")


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_id)
    session_id: Mapped[str] = mapped_column(ForeignKey("sessions.id"), index=True)
    role: Mapped[str] = mapped_column(String(10))  # user|assistant
    content: Mapped[str] = mapped_column(Text)
    language: Mapped[str] = mapped_column(String(5), default="en")
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    confidence: Mapped[float] = mapped_column(Float, default=1.0)

    session: Mapped[Session] = relationship(back_populates="messages")


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_id)
    session_id: Mapped[str] = mapped_column(ForeignKey("sessions.id"), index=True)
    skill_name: Mapped[str] = mapped_column(String(50))
    status: Mapped[str] = mapped_column(String(20), default="in_progress")  # in_progress|confirmed|completed|cancelled
    fields_json: Mapped[dict] = mapped_column(JSON, default=dict)
    step_index: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    session: Mapped[Session] = relationship(back_populates="tasks")


class AttendanceRecord(Base):
    __tablename__ = "attendance"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_id)
    teacher_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    class_name: Mapped[str] = mapped_column(String(20))
    section: Mapped[str] = mapped_column(String(5))
    subject: Mapped[str] = mapped_column(String(100))
    date: Mapped[str] = mapped_column(String(12))  # YYYY-MM-DD
    period: Mapped[str] = mapped_column(String(10))
    data_json: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class UserMemory(Base):
    __tablename__ = "user_memory"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_id)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    key: Mapped[str] = mapped_column(String(100))
    value: Mapped[str] = mapped_column(Text)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user: Mapped[User] = relationship(back_populates="memory_items")


class AnalyticsEvent(Base):
    __tablename__ = "analytics"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_id)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True, nullable=True)
    session_id: Mapped[str] = mapped_column(ForeignKey("sessions.id"), index=True, nullable=True)
    event_type: Mapped[str] = mapped_column(String(50))  # confusion|completion|repeat|skill_used
    metadata_json: Mapped[dict] = mapped_column(JSON, default=dict)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
