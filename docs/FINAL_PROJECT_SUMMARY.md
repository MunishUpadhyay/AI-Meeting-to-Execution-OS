# AI Meeting-to-Execution OS: One-Page Executive Summary

---

## Project Title
**AI Meeting-to-Execution OS**

## One-Line Description
An AI-powered full-stack platform that transforms unstructured meeting conversations and audio into actionable tasks, decisions, dependencies, and real-time execution risk intelligence.

---

## Problem & Solution
- **Problem:** During engineering and product meetings, action items, assignees, deadlines, and dependencies are lost in verbal conversation or generic paragraph summaries, leading to missed deliverables and unmanaged project risks.
- **Solution:** A **Meeting → AI → Execution** system that ingests speech or transcripts, extracts structured task artifacts using local LLMs, tracks task lifecycles via an interactive Kanban board, and dynamically calculates execution risks using a deterministic rule engine.

---

## Core Features
1. **Dual Ingestion:** Ingest raw transcript text or local audio recordings/microphone inputs.
2. **Local Speech Recognition:** On-device audio-to-text transcription powered by Useful Sensors' **Moonshine** engine.
3. **AI Task & Decision Extraction:** Parses summaries, decisions, action items, owners, normalized ISO deadlines (`YYYY-MM-DD`), and task dependencies using local **Qwen 2.5** via **Ollama**.
4. **Editable Transcript Workflow:** Inspect and refine transcript text prior to AI extraction.
5. **Interactive Kanban Task Board:** Drag and update task execution status (`TODO`, `IN_PROGRESS`, `BLOCKED`, `DONE`).
6. **Execution Risk Engine:** Deterministically calculates project risks (`OVERDUE_TASK`, `BLOCKED_TASK`, `DEPENDENCY_RISK`, `APPROACHING_DEADLINE`, `HIGH_PRIORITY_INCOMPLETE`) dynamically on demand.

---

## High-Level Architecture & Tech Stack

```text
Audio / Text → Moonshine STT → Transcript → Ollama + Qwen 2.5 → Pydantic → SQLite → Risk Engine → React Dashboard
```

- **Backend:** Python 3.10, FastAPI, SQLAlchemy ORM, Pydantic v2
- **Database:** SQLite (`meeting_execution.db`)
- **AI Engine:** Ollama (`qwen2.5:latest` 7B)
- **Speech Engine:** Useful Sensors Moonshine (`useful-moonshine`)
- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS
- **Testing:** Pytest (57 automated tests, 100% pass rate)

---

## Current Status & Limitations
- **Current Status:** Completed MVP (Phases 0–6 complete, fully verified, build clean).
- **Limitations:** Dependency matching uses normalized title string matching; speech recognition runs single-threaded on CPU.

---

## Future Scope (Phase 7+)
- Vector Database (ChromaDB) for RAG historical meeting search.
- Statistical ML model for task delay prediction.
- Enterprise integrations (Slack, Microsoft Teams, Google Calendar).
