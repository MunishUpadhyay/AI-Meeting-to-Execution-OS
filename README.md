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

`Phase 1 — Backend Foundation`

## Roadmap

- [x] **Phase 0 — Project Initialization**
- [x] **Phase 1 — Backend Foundation**
- [ ] **Phase 2 — AI Extraction Pipeline**
- [ ] **Phase 3 — Frontend Dashboard**
- [ ] **Phase 4 — Execution & Risk Intelligence**
- [ ] **Phase 5 — Moonshine Speech Integration**
- [ ] **Phase 6 — RAG / Historical Meeting Intelligence**
- [ ] **Phase 7 — ML-based Delay Prediction**
- [ ] **Phase 8 — Final Integration / Testing / Deployment**

## Backend Setup & Execution

### 1. Virtual Environment & Dependencies

Navigate to the `backend` directory and activate the project virtual environment:

```bash
# Windows
cd backend
.\.venv\Scripts\activate

# Install / update dependencies if needed
pip install -r requirements.txt
```

### 2. Database

The backend uses SQLite (`meeting_execution.db`) by default. Tables (`projects`, `meetings`, `tasks`, `decisions`) are initialized automatically when the FastAPI application starts. The database file is ignored by Git.

### 3. Starting the Backend Server

```bash
uvicorn app.main:app --reload
```

### 4. Interactive API Documentation

- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

### 5. Running Tests

```bash
pytest
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
