# AI Meeting-to-Execution OS: cURL & Postman API Testing Guide

This guide provides a step-by-step cURL testing sequence to exercise the entire **AI Meeting-to-Execution OS** API from start to finish.

---

## 1. System Health Check

Verify that the FastAPI backend server is online and responding.

```bash
curl -X GET http://localhost:8000/health
```

**Expected Response (`200 OK`):**
```json
{
  "status": "healthy"
}
```

---

## 2. Create Project Workspace

Create a new project workspace to group meetings, tasks, decisions, and risk assessments.

```bash
curl -X POST http://localhost:8000/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Payment Gateway Launch",
    "description": "Integration of Stripe checkout and payment processing APIs."
  }'
```

**Expected Response (`201 Created`):**
```json
{
  "id": 1,
  "name": "Payment Gateway Launch",
  "description": "Integration of Stripe checkout and payment processing APIs.",
  "created_at": "2026-10-07T10:00:00.000Z"
}
```

---

## 3. Create Meeting Entry

Create a meeting record under Project ID `1`.

```bash
curl -X POST http://localhost:8000/projects/1/meetings \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Backend Architecture & Payment Discussion",
    "transcript": "Rahul will implement the payment API before October 8th. Priya must complete the database schema first."
  }'
```

**Expected Response (`201 Created`):**
```json
{
  "id": 1,
  "project_id": 1,
  "title": "Backend Architecture & Payment Discussion",
  "transcript": "Rahul will implement the payment API before October 8th. Priya must complete the database schema first.",
  "summary": null,
  "created_at": "2026-10-07T10:15:00.000Z"
}
```

---

## 4. Transcribe Audio File (Local Moonshine STT)

Upload an audio recording (`sample.wav`) for local speech recognition.

```bash
curl -X POST http://localhost:8000/meetings/1/transcribe \
  -F "file=@sample.wav;type=audio/wav"
```

**Expected Response (`200 OK`):**
```json
{
  "meeting_id": 1,
  "transcript": "Rahul will implement the payment API before October 8th. Priya must complete the database schema first.",
  "status": "transcribed"
}
```

---

## 5. Update Meeting Transcript (Manual Refinement)

Update or refine the meeting transcript manually.

```bash
curl -X PATCH http://localhost:8000/meetings/1 \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "Rahul will implement the payment API before October 8th. Priya must complete the database schema first. Testing must be completed before deployment."
  }'
```

**Expected Response (`200 OK`):**
```json
{
  "id": 1,
  "project_id": 1,
  "title": "Backend Architecture & Payment Discussion",
  "transcript": "Rahul will implement the payment API before October 8th. Priya must complete the database schema first. Testing must be completed before deployment.",
  "summary": null,
  "created_at": "2026-10-07T10:15:00.000Z"
}
```

---

## 6. Trigger AI Meeting Analysis (Ollama + Qwen 2.5)

Run local LLM extraction to parse summary, decisions, tasks, assignees, deadlines, and dependencies.

```bash
curl -X POST http://localhost:8000/meetings/1/analyze
```

**Expected Response (`200 OK`):**
```json
{
  "meeting_id": 1,
  "summary": "The team discussed backend payment gateway integration and assigned database and API development tasks.",
  "decisions": [
    {
      "content": "Stripe will be used for payment gateway processing."
    }
  ],
  "tasks": [
    {
      "title": "Implement the payment API",
      "owner": "Rahul",
      "deadline": "2026-10-08",
      "priority": "HIGH",
      "dependency": "Complete the database schema"
    },
    {
      "title": "Complete the database schema",
      "owner": "Priya",
      "deadline": "2026-10-05",
      "priority": "HIGH",
      "dependency": null
    }
  ],
  "blockers": [],
  "risks": []
}
```

---

## 7. Fetch Project Tasks

Retrieve all extracted tasks for Project `1`.

```bash
curl -X GET http://localhost:8000/projects/1/tasks
```

---

## 8. Fetch Project Risks (Execution Risk Engine)

Dynamically calculate project risks based on deadlines, task statuses, and dependency links.

```bash
curl -X GET http://localhost:8000/projects/1/risks
```

**Expected Response (`200 OK`):**
```json
{
  "project_id": 1,
  "summary": {
    "total_tasks": 2,
    "completed_tasks": 0,
    "in_progress_tasks": 0,
    "blocked_tasks": 0,
    "overdue_tasks": 1,
    "risk_count": 2,
    "high_risk_count": 2,
    "medium_risk_count": 0
  },
  "risks": [
    {
      "type": "OVERDUE_TASK",
      "severity": "HIGH",
      "title": "Overdue task",
      "description": "Task 'Complete the database schema' was due on 2026-10-05 and is past due.",
      "related_task_id": 2,
      "related_task_title": "Complete the database schema"
    },
    {
      "type": "DEPENDENCY_RISK",
      "severity": "HIGH",
      "title": "Unresolved dependency",
      "description": "Task 'Implement the payment API' depends on 'Complete the database schema' which is currently TODO.",
      "related_task_id": 1,
      "related_task_title": "Implement the payment API",
      "dependency_task_id": 2,
      "dependency_task_title": "Complete the database schema"
    }
  ]
}
```

---

## 9. Update Task Status (Kanban Interaction)

Update Task ID `2` (`Complete the database schema`) status to `DONE`.

```bash
curl -X PATCH http://localhost:8000/tasks/2 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "DONE"
  }'
```

---

## 10. Re-Fetch Risks (Verify Dynamic Resolution)

Re-fetch project risks to verify that completing Task `2` automatically clears overdue and dependency risks.

```bash
curl -X GET http://localhost:8000/projects/1/risks
```

**Expected Response (`200 OK`):**
```json
{
  "project_id": 1,
  "summary": {
    "total_tasks": 2,
    "completed_tasks": 1,
    "in_progress_tasks": 0,
    "blocked_tasks": 0,
    "overdue_tasks": 0,
    "risk_count": 0,
    "high_risk_count": 0,
    "medium_risk_count": 0
  },
  "risks": []
}
```
