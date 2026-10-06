# Phase 2 — AI Extraction Pipeline Report

## 1. Objective

Implement an end-to-end AI extraction pipeline transforming unstructured meeting transcripts into structured, actionable project execution artifacts (summary, decisions, tasks with owners/deadlines/dependencies/priority, blockers, and risks) using local LLM inference via Ollama (`qwen2.5:latest`) and strong Pydantic validation.

## 2. AI Pipeline Architecture

```text
Meeting Transcript
        ↓
POST /meetings/{meeting_id}/analyze
        ↓
AIService (backend/app/services/ai_service.py)
        ↓
Ollama Local HTTP API (http://localhost:11434/api/chat)
        ↓
Qwen 2.5 LLM Inference
        ↓
JSON Response & Markdown Fence Stripping
        ↓
Pydantic Validation (AnalysisResult Schema)
        ↓
Database Persistence (Meeting.summary, Decision records, Task records)
        ↓
MeetingAnalysisResponse JSON Output
```

## 3. Ollama Integration

- **API Endpoint**: `POST {OLLAMA_BASE_URL}/api/chat`
- **Model**: `qwen2.5:latest`
- **Configuration Settings**:
  - `OLLAMA_BASE_URL`: `http://localhost:11434`
  - `OLLAMA_MODEL`: `qwen2.5:latest`
  - `OLLAMA_TIMEOUT`: `600` (Dynamic loading handling CPU inference)
- **Options**: `temperature = 0`, `num_predict = 512`
- **Client**: `httpx.Client` inside isolated `AIService` class.

## 4. Prompt Design

The system prompt explicitly configures the LLM as an **execution intelligence system**:

- **Strict Rules**:
  - Extract concise meeting summary, explicit decisions, actionable tasks, owners, deadlines, task priorities, dependencies, blockers, and risks.
  - DO NOT hallucinate. If owner, deadline, or dependency is unstated, return `null`.
  - Return empty arrays (`[]`) if decisions, tasks, blockers, or risks are absent.
  - Return strictly valid raw JSON without natural language chatter.

## 5. Extraction Schema

Defined in `app/schemas/ai_extraction.py`:

```python
class DecisionExtraction(BaseModel):
    content: str

class TaskExtraction(BaseModel):
    title: str
    owner: str | None = None
    deadline: str | None = None
    priority: TaskPriority = TaskPriority.MEDIUM
    dependency: str | None = None

class AnalysisResult(BaseModel):
    summary: str
    decisions: list[DecisionExtraction] = []
    tasks: list[TaskExtraction] = []
    blockers: list[str] = []
    risks: list[str] = []
```

## 6. Persistence Flow

1. The LLM NEVER directly accesses or writes to SQLite.
2. `AIService` receives raw LLM output and validates it against `AnalysisResult`.
3. Route handler receives validated `AnalysisResult`.
4. **Idempotency Strategy**: Any prior tasks or decisions tied to `meeting_id` are deleted before saving the new analysis, ensuring re-running analysis never produces duplicate records.
5. `Meeting.summary` is updated with `AnalysisResult.summary`.
6. New `Decision` entities are created linked to `meeting_id`.
7. New `Task` entities are created linked to `project_id = meeting.project_id` and `meeting_id = meeting.id`.
8. Transaction is committed.

## 7. API Endpoint

`POST /meetings/{meeting_id}/analyze`

- **Parameters**: `meeting_id` (path integer)
- **Status Codes**:
  - `200 OK`: Extraction successful and persisted.
  - `400 Bad Request`: Transcript is empty or missing.
  - `404 Not Found`: Meeting ID does not exist.
  - `502 Bad Gateway`: Ollama returned malformed or non-validating JSON output.
  - `503 Service Unavailable`: Ollama HTTP service unreachable.
  - `504 Gateway Timeout`: Ollama HTTP request timed out.

## 8. Error Handling

- Custom application-level exception classes (`AIServiceUnavailableException`, `AIServiceTimeoutException`, `AIInvalidOutputException`) in `app/services/ai_service.py`.
- Translated directly into clean FastAPI `HTTPException` responses.
- Python stack traces are suppressed from client API responses.

## 9. Automated Testing

- Unit and integration tests added in `backend/tests/test_analysis.py`.
- Mocked AI service response using `unittest.mock.patch` to guarantee fast, deterministic test runs without requiring a live Ollama server.
- Test coverage includes:
  1. Valid extraction and schema validation.
  2. Meeting not found (404).
  3. Empty transcript (400).
  4. Ollama unavailable (503).
  5. Ollama timeout (504).
  6. Invalid AI JSON output (502).
  7. Successful persistence to SQLite database.
  8. Correct foreign key assignment for tasks (`project_id`, `meeting_id`) and decisions (`meeting_id`).
  9. Idempotent re-analysis execution without record duplication.
- **Test Result**: **34 passed**, 0 failed (All 27 Phase 1 tests + 7 Phase 2 tests).

## 10. Live Ollama Verification

Tested live against local `qwen2.5:latest` model on local Ollama service.

### 11. Example Input Transcript

> "Today the team discussed the payment gateway launch.
> Rahul will implement the payment API by October 8.
> The database schema needs to be completed before the API integration.
> The team decided to use FastAPI for the backend.
> Testing must be completed before deployment."

### 12. Example Output JSON Response

```json
{
  "meeting_id": 6,
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
    },
    {
      "title": "Complete the database schema",
      "owner": null,
      "deadline": null,
      "priority": "MEDIUM",
      "dependency": null
    },
    {
      "title": "Testing",
      "owner": null,
      "deadline": null,
      "priority": "MEDIUM",
      "dependency": "Implement the payment API"
    }
  ],
  "blockers": [],
  "risks": []
}
```

Database verification confirmed 100% matching record persistence in SQLite.

## 13. Problems Encountered

1. **Ollama Schema Grammar Enforcement Slowdown**: Passing `"format": "json"` inside Ollama payload caused high CPU overhead and timeouts during structured decoding.
2. **Dynamic Settings Initialization**: `AIService` instance loaded default timeout value at module import time instead of dynamically fetching updated settings.

## 14. Solutions

1. Rely on system prompt JSON instructions, Markdown fence stripper `sanitize_json_response()`, and Pydantic `AnalysisResult.model_validate()` for validation, removing `"format": "json"` from Ollama payload and adding `"num_predict": 512` for speed.
2. Implemented dynamic `@property` methods in `AIService` to evaluate `settings.OLLAMA_TIMEOUT` at runtime.

## 15. AI Extraction Quality Refinements

Following initial live Ollama testing, two semantic quality issues were identified and refined:

1. **Deadline Normalization**:
   - Natural language deadlines (e.g. `"October 8"`, `"Oct 8th"`) are automatically parsed and normalized to standard `YYYY-MM-DD` date format (`"2026-10-08"`) via Pydantic field validator using `datetime.strptime` and year context (`2026`).
   - ISO formatted dates remain unchanged, missing deadlines remain `null` (no hallucinated fallback), and invalid dates raise validation errors.
2. **Dependency Extraction Semantics & Strict Relationship Rules**:
   - Updated system prompt rules and Pydantic `@model_validator` to enforce strict dependency semantics:
     - A task MUST NEVER list itself, a restatement of itself, or a sentence describing itself as a dependency.
     - Dependencies MUST be explicitly stated between identified tasks in the transcript. Never infer or assume dependencies between tasks merely because they seem related.
     - "Task A must happen before Task B" means Task B may depend on Task A ONLY when BOTH Task A and Task B are explicitly identifiable tasks. If Task B (e.g. "deployment") is absent, Task A's dependency is set to `null` rather than inventing a task or inferring a dependency on another implementation task.
     - Self-referential dependencies are automatically sanitized to `null`.
3. **Automated Regression Testing**:
   - Added unit tests covering natural language date normalization, ISO preservation, null handling, self-dependency prevention, and dependency sanitization (`test_task_extraction_deadline_normalization`, `test_task_extraction_dependency_sanitization`).
   - Total test suite count increased to **36 passed** tests.
4. **Live Ollama Re-Verification**:
   - Executed live extraction against `qwen2.5:latest` using the standard transcript.
   - Verified `deadline="2026-10-08"`, proper prerequisite assignment (`Complete the database schema` assigned as dependency for downstream `Implement the payment API`), clean null dependencies for upstream tasks, owner `"Rahul"` preserved, and SQLite database persistence.

## 16. Phase 2 Outcome

Phase 2 is 100% complete. The AI extraction pipeline is operational, type-safe, tested, verified live against Ollama with quality refinements, and persisted to SQLite.

## 17. Next Phase

**Phase 3 — Frontend Dashboard** (Building the React + Vite + Tailwind CSS Execution Dashboard).

