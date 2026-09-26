from __future__ import annotations

import os
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
TEST_DB = ROOT / "data" / "test_voice_assistant.db"

os.environ.setdefault("DATABASE_URL", f"sqlite+aiosqlite:///{TEST_DB}")
os.environ.setdefault("APP_ENV", "test")
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key")
os.environ.setdefault("GOOGLE_API_KEY", "")
os.environ.setdefault("OPENAI_API_KEY", "")
os.environ.setdefault("ENABLE_ANALYTICS", "true")

TEST_DB.parent.mkdir(parents=True, exist_ok=True)
TEST_DB.unlink(missing_ok=True)


@pytest.fixture(scope="session")
def anyio_backend() -> str:
    return "asyncio"
