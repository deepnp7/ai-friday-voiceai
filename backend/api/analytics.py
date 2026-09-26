"""
Analytics API — usage metrics for admin dashboard.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from api.auth import get_current_user
from db.database import get_db
from db.models import User, Session as DBSession, Message, AnalyticsEvent, AttendanceRecord

router = APIRouter(prefix="/analytics", tags=["analytics"])


class DashboardMetrics(BaseModel):
    total_sessions: int
    total_messages: int
    completed_sessions: int
    confusion_events: int
    skills_used: dict[str, int]
    avg_steps_per_session: float
    languages_used: dict[str, int]


@router.get("/dashboard", response_model=DashboardMetrics)
async def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Total sessions
    total_sess = await db.execute(
        select(func.count(DBSession.id)).where(DBSession.user_id == current_user.id)
    )
    total_sessions = total_sess.scalar() or 0

    # Completed sessions
    comp_sess = await db.execute(
        select(func.count(DBSession.id))
        .where(DBSession.user_id == current_user.id, DBSession.task_completed == True)
    )
    completed = comp_sess.scalar() or 0

    # Total messages
    total_msgs_q = await db.execute(
        select(func.count(Message.id))
        .join(DBSession, Message.session_id == DBSession.id)
        .where(DBSession.user_id == current_user.id)
    )
    total_msgs = total_msgs_q.scalar() or 0

    # Confusion events
    conf_q = await db.execute(
        select(func.count(AnalyticsEvent.id))
        .where(AnalyticsEvent.user_id == current_user.id, AnalyticsEvent.event_type == "simplified_mode_triggered")
    )
    confusion_events = conf_q.scalar() or 0

    # Skills used
    skills_q = await db.execute(
        select(AnalyticsEvent.metadata_json)
        .where(AnalyticsEvent.user_id == current_user.id, AnalyticsEvent.event_type == "skill_executed")
    )
    skills_used: dict[str, int] = {}
    for row in skills_q.scalars().all():
        if isinstance(row, dict):
            skill = row.get("skill", "unknown")
            skills_used[skill] = skills_used.get(skill, 0) + 1

    # Language usage
    lang_q = await db.execute(
        select(Message.language, func.count(Message.id))
        .join(DBSession, Message.session_id == DBSession.id)
        .where(DBSession.user_id == current_user.id)
        .group_by(Message.language)
    )
    languages_used = {row[0]: row[1] for row in lang_q.all()}

    avg_steps = round(total_msgs / max(total_sessions, 1), 1)

    return DashboardMetrics(
        total_sessions=total_sessions,
        total_messages=total_msgs,
        completed_sessions=completed,
        confusion_events=confusion_events,
        skills_used=skills_used,
        avg_steps_per_session=avg_steps,
        languages_used=languages_used,
    )


@router.get("/attendance")
async def get_attendance_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = 30,
):
    result = await db.execute(
        select(AttendanceRecord)
        .where(AttendanceRecord.teacher_id == current_user.id)
        .order_by(AttendanceRecord.created_at.desc())
        .limit(limit)
    )
    records = result.scalars().all()
    return [
        {
            "class": r.class_name,
            "section": r.section,
            "subject": r.subject,
            "date": r.date,
            "period": r.period,
        }
        for r in records
    ]
