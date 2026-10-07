# AI Meeting-to-Execution OS

## Project Description

**AI Meeting-to-Execution OS** is an AI-powered full-stack platform designed to transform unstructured meeting conversations into structured, actionable project execution artifacts. It automatically extracts tasks, decisions, assignees/owners, deadlines, dependencies, and project risks from meeting transcripts and audio recordings.

## Problem Statement

During team meetings, valuable decisions and actionable commitments are frequently lost, miscommunicated, or forgotten. Manually converting meeting discussions into formal project management tasks is time-consuming, prone to human error, and lacks real-time risk or dependency tracking. 

## Proposed Solution

The **Meeting → AI → Execution** pipeline automates the complete workflow:
1. Ingestion of meeting transcripts or audio.
2. Local AI extraction using Large Language Models to structure raw conversations.
3. Automated task assignment, deadline identification, and dependency linking.
4. Continuous project risk and blocker detection.
5. Direct visualization and management via a React-based Execution Dashboard.

## Initial Architecture

```text
Meeting / Transcript
        ↓
FastAPI Backend
        ↓
Ollama + Local LLM
        ↓
Structured AI Extraction
        ↓
Validation / Business Logic
        ↓
SQLite
        ↓
React Dashboard
        ↓
Tasks + Decisions + Dependencies
        ↓
Risk Engine
```

### Future Speech-to-Text Pipeline (Moonshine Integration)

```text
Microphone / Audio
        ↓
Moonshine Speech-to-Text
        ↓
Transcript
        ↓
AI Analysis
```

## Planned Technology Stack

- **Backend:** Python, FastAPI, SQLAlchemy, Pydantic
- **Database:** SQLite (MVP)
- **AI Engine:** Ollama, Local LLM
- **Speech Processing:** Moonshine (On-device Speech-to-Text)
- **Frontend:** React, Vite, Tailwind CSS
- **Future Capabilities:**
  - RAG (Retrieval-Augmented Generation)
  - Vector Database for historical meeting search
  - ML-based Project Delay Prediction
  - WebSockets for real-time updates
  - Integrations (Calendar, Slack, Microsoft Teams)

## Current Status

`Phase 6 — Final Integration & Demo Hardening (Complete MVP)`

## Roadmap

- [x] **Phase 0 — Project Initialization**
- [x] **Phase 1 — Backend Foundation**
- [x] **Phase 2 — AI Extraction Pipeline**
- [x] **Phase 3 — Frontend Dashboard**
- [x] **Phase 4 — Execution & Risk Intelligence**
- [x] **Phase 5 — Local Speech-to-Text Integration**
- [x] **Phase 6 — Final Integration & Demo Hardening**
- [ ] **Phase 7 — Future Scope (RAG, Vector DB, ML Delay Prediction)**

## Live Demonstration Sequence

1. **Dashboard Overview:** Open `http://localhost:5173`. Inspect active projects, statistics, and lightweight risk badges.
2. **Create Project Workspace:** Click **Create New Project** (e.g., *"Payment Gateway Launch"*).
3. **Create Meeting:** Click **Create Meeting**, provide a meeting title, and choose input method:
   - **Path A (Text):** Paste raw text transcript directly into the form.
   - **Path B (Audio):** Upload a short `.wav`/`.mp3` file or click **Record Audio** using browser microphone.
4. **Transcribe Audio (Path B):** Click **Transcribe Audio** with Moonshine. Review the generated transcript locally.
5. **Inspect / Edit Transcript:** Click **Edit Transcript** to fine-tune transcript text prior to AI extraction.
6. **Trigger AI Analysis:** Click **Analyze Meeting with AI**. Local Qwen 2.5 processes transcript via Ollama.
7. **Inspect Extracted Artifacts:** Review AI Executive Summary, Extracted Decisions, Blockers, Risks, and Tasks (with assignees, deadlines, priorities & dependencies).
8. **View Execution Risks:** Return to Project Details to view the **RiskPanel** displaying dynamic risk cards (`OVERDUE_TASK`, `BLOCKED_TASK`, `DEPENDENCY_RISK`, `APPROACHING_DEADLINE`, `HIGH_PRIORITY_INCOMPLETE`).
9. **Interactive Task Board:** Open Task Board. Update task status (e.g. `TODO` → `IN_PROGRESS` → `DONE`).
10. **Dynamic Risk Update:** Return to Project Details to verify completed tasks automatically clear corresponding execution risks.

## Speech-to-Text Integration (Phase 5)

A local, privacy-focused speech recognition pipeline powered by Useful Sensors' **Moonshine** engine:
- **`POST /meetings/{id}/transcribe`**: Accepts uploaded audio files (`.wav`, `.mp3`, `.m4a`, `.ogg`, `.webm`) or live browser mic recordings.
- **Transcript Generation**: Converts speech to text locally on CPU without external cloud APIs.
- **Seamless Convergence**: The generated transcript updates `Meeting.transcript`, allowing users to review/edit before running Qwen 2.5 AI extraction.

## Execution & Risk Engine (Phase 4)

A deterministic, explainable rule engine evaluates project task state dynamically on demand (`GET /projects/{id}/risks`) without needing LLM inference:
- **`BLOCKED_TASK`** (HIGH): Tasks marked as `BLOCKED`.
- **`OVERDUE_TASK`** (HIGH): Incomplete tasks past their deadline.
- **`DEPENDENCY_RISK`** (HIGH) / **`UNRESOLVED_DEPENDENCY_REFERENCE`** (MEDIUM): Dependency evaluation against project task titles.
- **`APPROACHING_DEADLINE`** (MEDIUM): Deadlines approaching within 2 days.
- **`HIGH_PRIORITY_INCOMPLETE`** (MEDIUM): High priority tasks still incomplete.



## Frontend Setup & Execution

### 1. Installation & Environment

Navigate to the `frontend` directory:

```bash
cd frontend
npm install
```

Ensure environment variables in `frontend/.env` (or `.env.example`) are configured:

```env
VITE_API_BASE_URL=http://localhost:8000
```

### 2. Starting the Frontend Dev Server

```bash
npm run dev
```

The React dashboard will start at: [http://localhost:5173](http://localhost:5173).

### 3. Frontend Routes & Views

- `/` — **Dashboard**: Project list, statistics, project creation modal.
- `/projects/:projectId` — **Project Details**: Project overview, meeting cards, tasks preview.
- `/projects/:projectId/meetings/:meetingId` — **Meeting Details**: Transcript, AI executive summary, extracted decisions, tasks & risk indicators, live AI analysis trigger.
- `/projects/:projectId/tasks` — **Task Board**: Interactive Kanban board (TODO, IN_PROGRESS, BLOCKED, DONE) with inline status updates.

### 4. Meeting Analysis Workflow

1. Open a project on the Dashboard.
2. Click **Create Meeting**, provide a title, and paste the meeting transcript text.
3. Open the created meeting and click **Analyze Meeting with AI**.
4. The frontend triggers `POST /meetings/{id}/analyze` against FastAPI and local Ollama (`qwen2.5`).
5. After analysis finishes, extracted tasks, decisions, summary, blockers, and risks update live in the UI.

## Backend & AI Setup

### 1. Virtual Environment & Environment Variables

Navigate to the `backend` directory and activate the project virtual environment:

```bash
cd backend
.\.venv\Scripts\activate
```

Ensure environment variables in `backend/.env` (or `.env.example`) are configured:

```env
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="qwen2.5:latest"
OLLAMA_TIMEOUT=600
```

### 2. Ollama Local Setup

Ensure Ollama is installed and running locally with the `qwen2.5` model:

```bash
ollama serve
ollama run qwen2.5
```

### 3. Starting the Backend Server

```bash
uvicorn app.main:app --reload
```

### 4. Interactive API Documentation

- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

### 5. Analyzing a Meeting Transcript

Trigger AI extraction on any meeting with a transcript:

```bash
POST http://localhost:8000/meetings/1/analyze
```

Example JSON Response:

```json
{
  "meeting_id": 1,
  "summary": "The team discussed the payment gateway launch and decided to use FastAPI for the backend.",
  "decisions": [
    {
      "content": "The team decided to use FastAPI for the backend."
    }
  ],
  "tasks": [
    {
      "title": "Implement the payment API",
      "owner": "Rahul",
      "deadline": "2026-10-08",
      "priority": "MEDIUM",
      "dependency": "Complete the database schema"
    }
  ],
  "blockers": [],
  "risks": []
}
```

### 6. Running Tests

```bash
# Backend Pytest Suite
pytest

# Frontend Production Build Check
cd frontend && npm run build
```

## Repository Structure

```text
AI-Meeting-to-Execution-OS/
│
├── backend/            # FastAPI core application, API routes, database models, schemas, AI services
│   ├── .venv/          # Isolated Python virtual environment
│   ├── app/
│   │   ├── api/        # REST API endpoints & route handlers
│   │   ├── models/     # SQLAlchemy ORM models
│   │   ├── schemas/    # Pydantic data validation schemas
│   │   ├── services/   # Business logic & LLM extraction services
│   │   ├── core/       # App configuration, security & logging settings
│   │   ├── database/   # DB session setup & migrations
│   │   └── main.py     # FastAPI entry point
│   ├── tests/          # Pytest backend test suite
│   ├── requirements.txt# Python dependencies
│   └── .env.example    # Backend environment template
│
├── frontend/           # React dashboard UI (Vite + Tailwind CSS)
│
├── docs/               # System documentation
│   ├── architecture/   # System architecture specifications & diagrams
│   ├── reports/        # Phase completion reports & benchmarks
│   └── diagrams/       # Flowcharts and design diagrams
│
├── scripts/            # Helper & automation scripts
│
├── .gitignore          # Git ignore rules
├── README.md           # Project documentation
└── LICENSE             # Open-source license
```

## Team

- [Team Member 1]
- [Team Member 2]
- [Team Member 3]
- [Team Member 4]
