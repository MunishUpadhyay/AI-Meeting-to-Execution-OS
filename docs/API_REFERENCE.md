# AI Meeting-to-Execution OS: API Reference Guide

This document provides a comprehensive REST API reference for the **AI Meeting-to-Execution OS** backend (`FastAPI`).

---

## Overview

- **Base URL:** `http://localhost:8000`
- **Content-Type:** `application/json` (except `multipart/form-data` for audio file uploads)
- **Authentication:** None (MVP focus on local single-tenant execution)
- **OpenAPI Specs:** Available at `http://localhost:8000/docs` (Swagger) and `http://localhost:8000/redoc`

---

## 1. System Health

### `GET /health`
- **Purpose:** Verifies that the FastAPI application is running and healthy.
- **Parameters:** None
- **Request Body:** None
- **Response:** `200 OK`
  ```json
  {
    "status": "healthy"
  }
  ```

---

## 2. Project Management

### `POST /projects`
- **Purpose:** Creates a new project workspace.
- **Request Body:** `application/json`
  ```json
  {
    "name": "Payment Gateway Launch",
    "description": "Integration of Stripe and PayPal APIs for checkout service."
  }
  ```
- **Response:** `201 Created`
  ```json
  {
    "id": 1,
    "name": "Payment Gateway Launch",
    "description": "Integration of Stripe and PayPal APIs for checkout service.",
    "created_at": "2026-10-07T10:00:00.000Z"
  }
  ```
- **Status Codes:** `201 Created`, `422 Unprocessable Entity`

### `GET /projects`
- **Purpose:** Lists all active project workspaces.
- **Response:** `200 OK`
  ```json
  [
    {
      "id": 1,
      "name": "Payment Gateway Launch",
      "description": "Integration of Stripe and PayPal APIs for checkout service.",
      "created_at": "2026-10-07T10:00:00.000Z"
    }
  ]
  ```

### `GET /projects/{project_id}`
- **Purpose:** Retrieves project details by ID.
- **Path Parameters:** `project_id` (integer)
- **Response:** `200 OK`
  ```json
  {
    "id": 1,
    "name": "Payment Gateway Launch",
    "description": "Integration of Stripe and PayPal APIs for checkout service.",
    "created_at": "2026-10-07T10:00:00.000Z"
  }
  ```
- **Status Codes:** `200 OK`, `404 Not Found`

### `DELETE /projects/{project_id}`
- **Purpose:** Deletes a project workspace and all associated meetings, tasks, and decisions (cascade delete).
- **Path Parameters:** `project_id` (integer)
- **Response:** `200 OK`
  ```json
  {
    "detail": "Project 1 deleted successfully"
  }
  ```
- **Status Codes:** `200 OK`, `404 Not Found`

---

## 3. Meetings & Speech-to-Text

### `POST /projects/{project_id}/meetings`
- **Purpose:** Creates a new meeting entry under a project.
- **Path Parameters:** `project_id` (integer)
- **Request Body:**
  ```json
  {
    "title": "API Architecture Discussion",
    "transcript": "Rahul will implement the payment API before October 8th."
  }
  ```
- **Response:** `201 Created`
  ```json
  {
    "id": 5,
    "project_id": 1,
    "title": "API Architecture Discussion",
    "transcript": "Rahul will implement the payment API before October 8th.",
    "summary": null,
    "created_at": "2026-10-07T10:15:00.000Z"
  }
  ```
- **Status Codes:** `201 Created`, `404 Not Found`, `422 Unprocessable Entity`

### `GET /projects/{project_id}/meetings`
- **Purpose:** Lists all meetings for a given project.
- **Path Parameters:** `project_id` (integer)
- **Response:** `200 OK`

### `GET /meetings/{meeting_id}`
- **Purpose:** Fetches a meeting by ID.
- **Path Parameters:** `meeting_id` (integer)
- **Response:** `200 OK`
- **Status Codes:** `200 OK`, `404 Not Found`

### `PATCH /meetings/{meeting_id}`
- **Purpose:** Updates meeting metadata or transcript text.
- **Path Parameters:** `meeting_id` (integer)
- **Request Body:**
  ```json
  {
    "transcript": "Updated transcript content for manual refinement."
  }
  ```
- **Response:** `200 OK`
- **Status Codes:** `200 OK`, `404 Not Found`

### `POST /meetings/{meeting_id}/transcribe`
- **Purpose:** Uploads an audio file and transcribes it locally using the Moonshine Speech-to-Text engine, updating `Meeting.transcript`.
- **Path Parameters:** `meeting_id` (integer)
- **Content-Type:** `multipart/form-data`
- **Form Field:** `file` (Binary audio file: `.wav`, `.mp3`, `.m4a`, `.ogg`, `.webm`, `.flac`, `.aac`)
- **Response:** `200 OK`
  ```json
  {
    "meeting_id": 5,
    "transcript": "Rahul will implement the payment API before October 8th.",
    "status": "transcribed"
  }
  ```
- **Status Codes:** `200 OK`, `400 Bad Request`, `404 Not Found`, `413 Payload Too Large`, `503 Service Unavailable`

---

## 4. AI Meeting Analysis

### `POST /meetings/{meeting_id}/analyze`
- **Purpose:** Triggers local LLM extraction (`Qwen 2.5` via `Ollama`) on `Meeting.transcript`. Stores extracted tasks and decisions into SQLite.
- **Path Parameters:** `meeting_id` (integer)
- **Response:** `200 OK`
  ```json
  {
    "meeting_id": 5,
    "summary": "The team discussed the payment gateway launch and assigned backend implementation tasks.",
    "decisions": [
      {
        "content": "FastAPI will be used as the core REST backend."
      }
    ],
    "tasks": [
      {
        "title": "Implement the payment API",
        "owner": "Rahul",
        "deadline": "2026-10-08",
        "priority": "HIGH",
        "dependency": "Complete database schema"
      }
    ],
    "blockers": [],
    "risks": [
      "Payment gateway launch deadline is tight."
    ]
  }
  ```
- **Status Codes:** `200 OK`, `400 Bad Request`, `404 Not Found`, `502 Bad Gateway`, `503 Service Unavailable`, `504 Gateway Timeout`

---

## 5. Task & Decision Management

### `GET /projects/{project_id}/tasks`
- **Purpose:** Retrieves all tasks assigned to a project workspace.
- **Path Parameters:** `project_id` (integer)
- **Response:** `200 OK`

### `POST /projects/{project_id}/tasks`
- **Purpose:** Manually creates a task under a project.
- **Path Parameters:** `project_id` (integer)
- **Request Body:**
  ```json
  {
    "meeting_id": 5,
    "title": "Complete database schema",
    "owner": "Priya",
    "deadline": "2026-10-06",
    "status": "TODO",
    "priority": "HIGH",
    "dependency": null
  }
  ```
- **Response:** `201 Created`

### `GET /tasks/{task_id}`
- **Purpose:** Fetches a task by ID.

### `PATCH /tasks/{task_id}`
- **Purpose:** Updates task status, owner, deadline, priority, or dependency.
- **Path Parameters:** `task_id` (integer)
- **Request Body:**
  ```json
  {
    "status": "DONE"
  }
  ```
- **Response:** `200 OK`

### `GET /meetings/{meeting_id}/decisions`
- **Purpose:** Retrieves decisions extracted from a specific meeting.

---

## 6. Execution Risk Engine

### `GET /projects/{project_id}/risks`
- **Purpose:** Dynamically computes execution risks for a project workspace based on current task statuses, deadlines, and dependencies.
- **Path Parameters:** `project_id` (integer)
- **Response:** `200 OK`
  ```json
  {
    "project_id": 1,
    "summary": {
      "total_tasks": 2,
      "completed_tasks": 0,
      "in_progress_tasks": 1,
      "blocked_tasks": 0,
      "overdue_tasks": 1,
      "risk_count": 2,
      "high_risk_count": 1,
      "medium_risk_count": 1
    },
    "risks": [
      {
        "type": "OVERDUE_TASK",
        "severity": "HIGH",
        "title": "Overdue task",
        "description": "Task 'Complete database schema' was due on 2026-10-06 and is past due.",
        "related_task_id": 2,
        "related_task_title": "Complete database schema",
        "dependency_task_id": null,
        "dependency_task_title": null
      },
      {
        "type": "DEPENDENCY_RISK",
        "severity": "HIGH",
        "title": "Unresolved dependency",
        "description": "Task 'Implement the payment API' depends on 'Complete database schema' which is currently TODO.",
        "related_task_id": 1,
        "related_task_title": "Implement the payment API",
        "dependency_task_id": 2,
        "dependency_task_title": "Complete database schema"
      }
    ]
  }
  ```
- **Status Codes:** `200 OK`, `404 Not Found`
