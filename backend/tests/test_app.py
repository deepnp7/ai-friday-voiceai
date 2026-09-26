from __future__ import annotations

from uuid import uuid4

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from main import app
from db.database import init_db


@pytest_asyncio.fixture
async def client():
    await init_db()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


async def _register_user(client: AsyncClient, role: str = "teacher") -> dict:
    suffix = uuid4().hex[:8]
    response = await client.post(
        "/auth/register",
        json={
            "name": f"Test User {suffix}",
            "email": f"test-{suffix}@example.com",
            "password": "password123",
            "role": role,
        },
    )
    assert response.status_code == 201
    return response.json()


@pytest.mark.anyio
async def test_health_and_skills(client: AsyncClient):
    health = await client.get("/health")
    assert health.status_code == 200
    assert health.json()["status"] == "healthy"

    skills = await client.get("/skills")
    assert skills.status_code == 200
    skill_names = {skill["name"] for skill in skills.json()}
    assert "attendance" in skill_names
    assert "homework_help" in skill_names


@pytest.mark.anyio
async def test_auth_and_voice_flow(client: AsyncClient):
    token_payload = await _register_user(client)
    token = token_payload["access_token"]

    me = await client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["name"].startswith("Test User")

    start = await client.post(
        "/conversation/start",
        headers={"Authorization": f"Bearer {token}"},
        json={"language": "en", "speaking_speed": "normal"},
    )
    assert start.status_code == 200
    session_id = start.json()["session_id"]

    first = await client.post(
        "/conversation/chat",
        headers={"Authorization": f"Bearer {token}"},
        json={"session_id": session_id, "text": "Help me take attendance for Class 8 A mathematics period 2"},
    )
    assert first.status_code == 200
    first_body = first.json()
    assert first_body["skill"] == "attendance"
    assert first_body["step"] >= 1
    assert first_body["total_steps"] >= first_body["step"]
    assert first_body["awaiting_confirmation"] is False

    second = await client.post(
        "/conversation/chat",
        headers={"Authorization": f"Bearer {token}"},
        json={"session_id": session_id, "text": "Class 8"},
    )
    assert second.status_code == 200
    assert "section" in second.json()["response"].lower()
