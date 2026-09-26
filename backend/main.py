"""
FastAPI Application Entry Point.

Registers all routers, middleware, CORS, rate limiting,
and initialises the database on startup.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from config import get_settings
from db.database import init_db
from api.auth import router as auth_router
from api.conversation import router as conversation_router
from api.analytics import router as analytics_router

settings = get_settings()
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    await init_db()
    yield
    # Cleanup if needed


app = FastAPI(
    title="Adaptive Cognitive Voice Assistant",
    description="Production-grade Voice AI Platform for users with cognitive challenges",
    version="1.0.0",
    lifespan=lifespan,
)

# ──────────────────────────────────────────────────────────────────────────────
# Middleware
# ──────────────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ──────────────────────────────────────────────────────────────────────────────
# Routers
# ──────────────────────────────────────────────────────────────────────────────

app.include_router(auth_router)
app.include_router(conversation_router)
app.include_router(analytics_router)

# ──────────────────────────────────────────────────────────────────────────────
# Root Endpoint
# ──────────────────────────────────────────────────────────────────────────────

@app.get("/", tags=["System"])
async def root():
    """Root endpoint."""
    return {
        "application": app.title,
        "version": app.version,
        "status": "running",
        "documentation": "/docs",
        "health": "/health",
        "available_endpoints": {
            "authentication": "/auth",
            "conversation": "/conversation",
            "analytics": "/analytics",
            "skills": "/skills",
        },
    }

# ──────────────────────────────────────────────────────────────────────────────
# Health Check
# ──────────────────────────────────────────────────────────────────────────────

@app.get("/health", tags=["System"])
async def health():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "version": app.version,
        "provider": settings.llm_provider,
    }


# ──────────────────────────────────────────────────────────────────────────────
# Skills
# ──────────────────────────────────────────────────────────────────────────────

@app.get("/skills", tags=["System"])
async def get_skills():
    """Return available skills for the frontend."""
    from core.skills import SKILLS

    return [
        {
            "name": s.name,
            "display_name": s.display_name,
            "description": s.description,
            "icon": s.icon,
            "step_count": len(s.steps),
        }
        for s in SKILLS.values()
    ]


# ──────────────────────────────────────────────────────────────────────────────
# Global Exception Handler
# ──────────────────────────────────────────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An unexpected error occurred. Please try again."
        },
    )