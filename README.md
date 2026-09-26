# CogniVoice

**CogniVoice** is an adaptive, voice-first assistant designed to make everyday education workflows calmer and more accessible. Teachers and students can speak naturally to complete tasks such as taking attendance, entering marks, planning lessons, getting homework help, and setting reminders. The assistant guides each workflow one clear step at a time, adjusts its language when it detects confusion, and asks for confirmation before completing an action.

> This repository contains a Next.js frontend and a FastAPI backend. It can be run locally or as a four-service Docker Compose stack.

## Contents

- [What it does](#what-it-does)
- [Technology](#technology)
- [Project structure](#project-structure)
- [Quick start with Docker](#quick-start-with-docker)
- [Local development](#local-development)
- [Configuration](#configuration)
- [Using the application](#using-the-application)
- [API overview](#api-overview)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## What it does

### Accessible, voice-led interaction

- Uses the browser's Web Speech API for voice input and spoken responses by default.
- Provides an interactive voice workspace with a live transcript, keyboard access, and adjustable presentation settings.
- Supports English, Hindi, Bengali, Tamil, Telugu, Kannada, Malayalam, and Marathi greetings and voice tags.
- Lets users choose a language and speaking speed, which are remembered for later sessions.

### Adaptive cognitive support

CogniVoice models each task as a short, structured sequence. The dialogue engine extracts a user's intent, asks only for the missing information, and reports progress as it goes. It can switch to a simplified response style when its confusion detector identifies repeated uncertainty or difficulty. Destructive or state-changing task actions require an explicit confirmation before execution.

### Education workflows

The included skill catalogue supports:

| Skill | Typical use |
| --- | --- |
| Attendance | Record class, section, subject, period, date, and absences |
| Marks entry | Enter assessment marks for a class or student |
| Homework assignment | Create and communicate homework |
| Schedule reminder | Set a reminder with date and time |
| Lesson planning | Build a structured lesson plan |
| Quiz | Start an interactive learning quiz |
| Homework helper | Guide a student through homework support |
| Student lookup | Find student information |
| Voice note | Capture a note through speech |
| Class summary | Generate a class-session summary |

### Accounts, history, and reporting

- JWT-based registration and sign-in for teacher, student, and admin roles.
- Persistent users, sessions, messages, tasks, preferences, attendance records, and analytics events in SQLite by default.
- Conversation history per signed-in user.
- Dashboard metrics for sessions, messages, completed tasks, simplified-mode events, languages, and skills used.

## Technology

| Area | Implementation |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript, Framer Motion, Radix UI, Tailwind utilities |
| Backend | FastAPI, Uvicorn, Pydantic Settings, SQLAlchemy async, SQLite/aiosqlite |
| AI orchestration | LangGraph, LangChain, Google Gemini or OpenAI |
| Authentication | OAuth2 password flow, JWT, Passlib password hashing |
| Supporting services | Redis and Qdrant (provided in Docker Compose) |
| Speech | Browser Web Speech API by default; optional ElevenLabs, Deepgram, and Azure credentials are configurable |
| Containers | Docker and Docker Compose |

## Project structure

```text
.
├── backend/
│   ├── api/               # Authentication, conversation, and analytics routes
│   ├── core/              # Dialogue graph, skill definitions, language and memory logic
│   ├── db/                # Async database setup and SQLAlchemy models
│   ├── tests/             # Backend API tests
│   ├── main.py            # FastAPI application entry point
│   └── requirements.txt
├── frontend/
│   ├── app/               # Landing, login, dashboards, voice, history, and settings pages
│   ├── components/        # Voice and layout UI components
│   ├── hooks/             # Voice, conversation, and accessibility hooks
│   ├── lib/api.ts         # Typed backend client
│   └── package.json
├── .env.example           # Configuration template
└── docker-compose.yml     # Full local stack
```

## Prerequisites

Choose one setup method:

- **Docker:** Docker Desktop (or Docker Engine) with Docker Compose.
- **Local development:** Python 3.11 or newer, Node.js 20 or newer, and npm.

For real AI-generated responses, create a Google Gemini API key or OpenAI API key. The application can still start without one, but conversational intelligence will be limited by the backend configuration.

## Quick start with Docker

This is the easiest way to run every service together.

1. Clone the repository and enter it:

   ```bash
   git clone https://github.com/deepnp7/ai-friday-voiceai.git
   cd ai-friday-voiceai
   ```

2. Create your private environment file:

   ```bash
   cp .env.example .env
   ```

3. Edit `.env` and set at least one AI provider key. Also replace the development JWT secret before sharing the app:

   ```env
   GOOGLE_API_KEY=your_gemini_api_key
   # Or use OpenAI instead:
   # OPENAI_API_KEY=your_openai_api_key
   # LLM_PROVIDER=openai
   # LLM_MODEL=gpt-4o-mini

   JWT_SECRET_KEY=replace-with-a-long-random-secret
   ```

4. Build and start the stack:

   ```bash
   docker compose up --build
   ```

5. Open the application:

   - Frontend: <http://localhost:3000>
   - Backend health check: <http://localhost:8000/health>
   - Interactive API docs: <http://localhost:8000/docs>
   - Qdrant dashboard/API: <http://localhost:6333/dashboard>

To stop it, press `Ctrl+C`. To run it in the background, use `docker compose up --build -d`; use `docker compose logs -f` to view logs and `docker compose down` to stop the stack.

> The Docker frontend runs with `npm run start`, so it is a production-style Next.js server. For hot reload while developing the UI, use the local-development workflow below.

## Local development

Run the backend and frontend in two separate terminals.

### 1. Configure the backend

The backend reads `.env` from its own working directory during local development.

```bash
cd backend
cp ../.env.example .env
```

Edit `backend/.env` and set your API key and JWT secret. The default SQLite location (`./data/voice_assistant.db`) works without any database installation.

### 2. Start the backend

From `backend/`:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Verify it at <http://localhost:8000/health>. FastAPI's interactive documentation is available at <http://localhost:8000/docs>.

### 3. Start the frontend

In a second terminal, from the repository root:

```bash
cd frontend
npm ci
npm run dev
```

Then open <http://localhost:3000>.

The frontend defaults to `http://localhost:8000` as its API URL. To use a different backend URL, create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 4. Build the frontend for production (optional)

```bash
cd frontend
npm run build
npm run start
```

## Configuration

Start from `.env.example`. Never commit a real `.env` file; it is ignored by Git.

| Variable | Purpose | Default |
| --- | --- | --- |
| `GOOGLE_API_KEY` | Google Gemini API key | empty |
| `OPENAI_API_KEY` | Optional OpenAI API key | empty |
| `LLM_PROVIDER` | `gemini` or `openai` | `gemini` |
| `LLM_MODEL` | Model name for the selected provider | `gemini-1.5-flash` |
| `JWT_SECRET_KEY` | Secret used to sign access tokens | development placeholder |
| `JWT_EXPIRE_MINUTES` | Access-token lifetime | `1440` |
| `DATABASE_URL` | Async SQLAlchemy database URL | local SQLite database |
| `REDIS_URL` | Optional Redis URL | empty locally |
| `QDRANT_URL` | Optional Qdrant URL | empty locally |
| `CORS_ORIGINS` | Comma-separated permitted frontend origins | `http://localhost:3000` |
| `ENABLE_ANALYTICS` | Enable analytics-event logging | `true` |
| `ELEVENLABS_API_KEY`, `DEEPGRAM_API_KEY`, `AZURE_SPEECH_KEY` | Optional future speech-provider credentials | empty |

When using Docker Compose, service URLs are injected for the backend: Redis at `redis://redis:6379` and Qdrant at `http://qdrant:6333`.

## Using the application

1. Open <http://localhost:3000>.
2. Choose **Get started** and register an account. Select `teacher`, `student`, or `admin` as the role.
3. On the dashboard, select the voice assistant.
4. Allow microphone access when the browser asks. Chrome or Edge is recommended because browser speech-recognition support varies.
5. Speak a request, for example: `Take attendance for Class 8A` or `Help me with homework`.
6. Answer the focused follow-up prompts. CogniVoice shows task progress and a transcript.
7. Review the summary and explicitly confirm it before the action is completed.

You can also press the **Spacebar** on the voice page to begin or stop listening, provided the page background is focused.

## API overview

All protected HTTP endpoints use `Authorization: Bearer <access_token>`. A token is returned from registration and login.

| Area | Endpoint | Description |
| --- | --- | --- |
| System | `GET /health` | Health and provider status |
| System | `GET /skills` | Available voice workflows |
| Auth | `POST /auth/register` | Create an account and return a JWT |
| Auth | `POST /auth/token` | Sign in with OAuth2 form fields (`username`, `password`) |
| Auth | `GET /auth/me` | Get the signed-in profile |
| Conversation | `POST /conversation/start` | Create a voice session |
| Conversation | `POST /conversation/chat` | Send a transcript and receive the next assistant response |
| Conversation | `POST /conversation/end/{session_id}` | End a session |
| Conversation | `GET /conversation/history` | Retrieve the user's previous sessions |
| Conversation | `WS /conversation/ws/{session_id}` | Low-latency text-message conversation channel |
| Analytics | `GET /analytics/dashboard` | Usage metrics for the signed-in user |
| Analytics | `GET /analytics/attendance` | Recent attendance records for a teacher |

For request and response schemas, use the live OpenAPI UI at `/docs` after starting the backend.

## Testing

Run backend tests from the `backend/` directory after installing the Python dependencies:

```bash
cd backend
source .venv/bin/activate
pytest
```

The tests use an isolated SQLite test database in `backend/data/` and cover health, skill discovery, registration, authentication, and a basic voice-flow progression.

## Troubleshooting

### The frontend cannot reach the API

- Confirm the backend is running at <http://localhost:8000/health>.
- Ensure `NEXT_PUBLIC_API_URL` points to the backend URL if it is not running on port 8000.
- Ensure that URL is included in `CORS_ORIGINS` in the backend environment configuration.

### Voice input does not work

- Use Chrome or Edge over `localhost` or HTTPS.
- Allow the browser's microphone permission.
- If the browser reports that speech recognition is unavailable, switch to a supported browser or use the API directly for text-based integration.

### Docker image build fails on a dependency

- Update Docker Desktop, then rebuild without cached layers: `docker compose build --no-cache`.
- Ensure `.env` exists at the repository root before starting Compose.

### Authentication fails after changing `JWT_SECRET_KEY`

Existing tokens become invalid when the signing secret changes. Sign in again to receive a fresh token.

## Security notes

- Keep API keys and JWT secrets only in local or deployment-managed environment variables.
- Replace the sample JWT secret outside local development.
- The WebSocket conversation endpoint is currently intended for trusted/local use; production deployments should add the same authentication and authorization controls used by the REST endpoints.
- Set explicit production CORS origins instead of using broad origins.

## License

No license file is currently included. Add a license before distributing or accepting external contributions.
