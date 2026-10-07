# AI Meeting-to-Execution OS: System Architecture & Design Explanation

This document provides a viva-ready technical architectural explanation of the **AI Meeting-to-Execution OS**.

---

## 1. Problem & Core Value Proposition

### A. Problem Statement
During software engineering and product team meetings, actionable commitments, decisions, and deadlines are frequently lost in unstructured conversation. Traditional note-taking is manual, prone to human bias, and disconnected from execution tools.

### B. Why Ordinary Meeting Summarizers Fail
Standard AI meeting summarizers generate generic paragraph summaries (e.g., *"The team talked about payments"*). They do **not**:
- Assign formal tasks with deadlines and owners.
- Establish relational dependencies between tasks.
- Track post-meeting task status updates.
- Reason about project execution risks (overdue tasks, blocked dependencies).

### C. Why This is an "Execution OS"
The **AI Meeting-to-Execution OS** bridges the gap between conversation and delivery:
1. **Conversation Ingestion:** Accepts transcripts or raw audio recordings.
2. **Local AI Structuring:** Converts raw dialog into validated JSON artifacts (Tasks, Decisions, Blockers, Risks).
3. **Execution Tracking:** Provides an interactive Kanban task board (`TODO` → `IN_PROGRESS` → `BLOCKED` → `DONE`).
4. **Deterministic Risk Reasoning:** Runs a rule engine that continuously evaluates task state, deadlines, and dependencies to flag project risks.

---

## 2. High-Level Architecture & End-to-End Flow

```text
                 ┌─────────────────────┐
                 │ Meeting Input       │
                 └──────────┬──────────┘
                            │
               ┌────────────┴────────────┐
               │                         │
               ▼                         ▼
       Pasted Transcript           Audio Recording
               │                         │
               │                     Moonshine STT
               │                         │
               └────────────┬────────────┘
                            ▼
                    Meeting.transcript
                            │
                            ▼
                     Ollama + Qwen 2.5
                            │
                            ▼
              Tasks / Decisions / Blockers
                            │
                            ▼
                         SQLite
                            │
                            ▼
                    Execution Risk Engine
                            │
                            ▼
                  React Execution Dashboard
```

---

## 3. Subsystem Architecture Breakdown

### F. Backend Architecture (FastAPI + SQLAlchemy)
- Built using **Python 3.10** and **FastAPI**.
- RESTful router structure divided into modular domains:
  - `health_router` (`/health`)
  - `projects_router` (`/projects`)
  - `meetings_router` (`/meetings`, `/meetings/{id}/transcribe`)
  - `analysis_router` (`/meetings/{id}/analyze`)
  - `tasks_router` (`/tasks`)
  - `decisions_router` (`/decisions`)
  - `risks_router` (`/projects/{id}/risks`)

### G. Frontend Architecture (React + Vite + TypeScript + Tailwind CSS)
- Single-page application built with **React 18** and **TypeScript**.
- Styled using **Tailwind CSS** for dark slate themes.
- Client API layer (`frontend/src/services/api.ts`) communicates with FastAPI endpoints via async `fetch`.

### H. Database Architecture (SQLite + SQLAlchemy ORM)
- Relational SQLite database (`meeting_execution.db`).
- **Entity Relationship Model:**
  - `Project` (1) ─── (N) `Meeting`
  - `Project` (1) ─── (N) `Task`
  - `Meeting` (1) ─── (N) `Decision`
  - `Meeting` (1) ─── (N) `Task` (optional relation)

---

## 4. AI & Speech Pipelines

### I. AI Extraction Pipeline
- **Server:** Ollama (running locally at `http://localhost:11434`).
- **Model:** `Qwen 2.5` (`qwen2.5:latest`, 7B parameters).
- **Prompt Strategy:** Structured JSON schema enforced via strict system prompts and `temperature=0.0`.
- **Normalization & Validation:**
  - Pydantic models validate extracted JSON.
  - Dates normalized to ISO `YYYY-MM-DD`.
  - Self-dependencies automatically removed.

### J. Moonshine Speech-to-Text Pipeline
- **Engine:** Useful Sensors' **Moonshine** (`useful-moonshine`).
- **Execution:** Runs 100% locally on CPU without external cloud APIs.
- **Workflow:** Audio uploaded via `POST /meetings/{id}/transcribe` → Moonshine transcribes to text → `Meeting.transcript` updated in database.

---

## 5. Execution Risk Engine Logic

Risks are **dynamically computed** on demand (`GET /projects/{id}/risks`) without needing persistent risk tables:

1. **`BLOCKED_TASK` (HIGH):** `task.status == "BLOCKED"`
2. **`OVERDUE_TASK` (HIGH):** `task.deadline < today` AND `task.status != "DONE"`
3. **`DEPENDENCY_RISK` (HIGH):** Task depends on another task in the project whose status is not `DONE`.
4. **`UNRESOLVED_DEPENDENCY_REFERENCE` (MEDIUM):** Task references a dependency title that cannot be resolved in the project.
5. **`APPROACHING_DEADLINE` (MEDIUM):** Task deadline is within the next 2 days AND `task.status != "DONE"`.
6. **`HIGH_PRIORITY_INCOMPLETE` (MEDIUM):** Task has `priority == "HIGH"`, `status != "DONE"`, and no higher-severity risk assigned.

---

## 6. Technology Rationale (Viva Q&A Essentials)

| Technology | Selection Rationale |
| :--- | :--- |
| **FastAPI** | High performance, native async support, automatic Pydantic schema validation, automatic OpenAPI doc generation. |
| **Ollama** | Local LLM server manager providing lightweight REST API wrapper over GGUF/llama.cpp models. |
| **Qwen 2.5** | State-of-the-art open model for structured JSON extraction, instruction following, and reasoning. |
| **Moonshine** | Fast, lightweight on-device speech-to-text model designed specifically for edge execution. |
| **SQLite** | Zero-configuration relational database ideal for single-tenant Capstone MVP. |
| **Why Local over Cloud APIs?** | Privacy, zero per-token cloud costs, offline operation, data security. |

---

## 7. Current Limitations & Future Improvements

### Limitations
- Dependency resolution relies on string title matching.
- Speech transcription runs single-threaded on CPU.

### Future Scope (Phase 7+)
- Vector Database (ChromaDB / Qdrant) for RAG historical meeting queries.
- ML-based delay prediction model trained on historical task completion velocity.
- Integrations with Slack, Microsoft Teams, and Google Calendar.
