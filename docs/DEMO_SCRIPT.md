# AI Meeting-to-Execution OS: 5-10 Minute Live Demonstration Script

This document provides a step-by-step walkthrough for performing a flawless live presentation of the **AI Meeting-to-Execution OS**.

---

## Live Demo Walkthrough

### Step 1: Open Dashboard
- **Action:** Open browser to `http://localhost:5173`.
- **Talking Point:** *"Welcome! This is the AI Meeting-to-Execution OS. Unlike standard meeting tools that only generate text notes, our system transforms unstructured conversations into actionable project execution workflows."*
- **Technical Concept:** React Single Page Application (SPA), RESTful API client state fetching (`GET /projects`).

---

### Step 2: Create Project Workspace
- **Action:** Click **Create New Project**. Enter Name: *"Payment Gateway Launch"* and Description: *"Integration of checkout service"*. Click **Create Project**.
- **Talking Point:** *"We begin by establishing a Project Workspace to group our team's meetings, tasks, and execution risk assessments."*
- **Technical Concept:** Pydantic schema validation (`ProjectCreate`), SQLite ORM persistence.

---

### Step 3: Create Meeting Entry
- **Action:** Click **Open Project** on *"Payment Gateway Launch"*. Click **Create Meeting**. Enter Title: *"API Architecture Discussion"*.
- **Talking Point:** *"We support two input options: direct text transcript input or audio recording upload."*
- **Technical Concept:** Relational foreign key binding (`Meeting.project_id`).

---

### Step 4: Audio Upload & Local Moonshine Speech-to-Text
- **Action:** Upload a short `.wav` audio file (or click **Record Audio** using browser mic). Click **Transcribe Audio**.
- **Talking Point:** *"We are using Useful Sensors' Moonshine model running 100% locally on CPU to transcribe audio without sending voice data to any cloud service."*
- **Technical Concept:** On-device speech recognition via `useful-moonshine`, `POST /meetings/{id}/transcribe` multipart audio upload.

---

### Step 5: Inspect & Refine Transcript
- **Action:** View the generated transcript text. Click **Edit Transcript**, tweak a line if desired, and click **Save Transcript**.
- **Talking Point:** *"Notice that speech transcription is strictly decoupled from AI analysis. The user inspects and refines the transcript before sending it to the LLM."*
- **Technical Concept:** Safe workflow separation, transcript persistence via `PATCH /meetings/{id}`.

---

### Step 6: Trigger AI Extraction (Ollama + Qwen 2.5)
- **Action:** Click **Analyze Meeting with AI**.
- **Talking Point:** *"We are now triggering our local Large Language Model pipeline. Ollama invokes Qwen 2.5 locally to parse tasks, assignees, deadlines, and dependencies."*
- **Technical Concept:** Local LLM inference, system prompt JSON schema enforcement, `temperature=0.0`.

---

### Step 7: Review AI Executive Summary & Decisions
- **Action:** Scroll to **AI Executive Summary** and **Extracted Decisions**.
- **Talking Point:** *"Qwen has generated a concise executive summary and extracted key technical decisions."*
- **Technical Concept:** Structured JSON parsing (`AnalysisResult`), relational persistence into `Decision` table.

---

### Step 8: Review Extracted Actionable Tasks
- **Action:** Scroll to **Extracted Tasks**. Point out Task Title, Owner (Assignee), Normalized Deadline (`YYYY-MM-DD`), Priority, and Dependency.
- **Talking Point:** *"The LLM identified actionable tasks, normalized dates to standard ISO format, mapped task assignees, and extracted explicit dependencies."*
- **Technical Concept:** Pydantic regex date normalization, self-dependency validation.

---

### Step 9: Inspect Execution Risk Panel
- **Action:** Point out the **Execution Intelligence & Risk Engine** panel at the top of Project Details.
- **Talking Point:** *"This is where our system becomes an Execution OS. Our deterministic Risk Engine evaluates tasks dynamically against 5 execution rules."*
- **Technical Concept:** Dynamic risk evaluation (`GET /projects/{id}/risks`), zero risk persistence required.

---

### Step 10: Interactive Kanban Task Board
- **Action:** Click **Open Task Board**. Drag or update task status from `TODO` → `IN_PROGRESS` → `DONE`.
- **Talking Point:** *"Team members manage work using our interactive Kanban board. Updating task status triggers immediate execution state updates."*
- **Technical Concept:** RESTful task update (`PATCH /tasks/{id}`), Kanban state propagation.

---

### Step 11: Demonstrate Dynamic Risk Resolution
- **Action:** Return to Project Details workspace. Show that completed tasks automatically cleared associated overdue and dependency risks.
- **Talking Point:** *"As tasks are completed, the Risk Engine automatically recalculates project execution health in real time."*
- **Technical Concept:** Dynamic risk state recalculation from SQLite task records.

---

## Technical Summary for Q&A Wrap-Up

1. **Privacy:** 100% local processing (Ollama + Qwen 2.5 + Moonshine STT).
2. **Determinism:** Rule-based Risk Engine eliminates LLM risk hallucinations.
3. **Execution Focus:** Bridges the gap between meeting discussions and post-meeting task delivery.
