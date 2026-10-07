# AI Meeting-to-Execution OS: Comprehensive Viva & Interview Q&A

This document contains likely viva examination and technical interview questions along with concise, technically precise answers.

---

## 1. Project Questions

### Q1: What is the AI Meeting-to-Execution OS?
**Answer:** It is a full-stack platform that ingests unstructured meeting audio or transcripts and automatically converts them into structured, actionable project artifacts—specifically tasks with assignees, deadlines, and dependencies, decisions, and real-time execution risk assessments.

### Q2: How does this differ from standard meeting summarizers?
**Answer:** Standard summarizers produce passive text summaries. The Execution OS extracts formal task objects, establishes dependency linkages, tracks task completion across a Kanban lifecycle (`TODO` → `DONE`), and runs a rule engine to calculate project execution risks in real time.

### Q3: Why is local AI processing important for this system?
**Answer:** Organizations often discuss sensitive strategy, revenue targets, and proprietary code in internal meetings. Local processing via Ollama and Moonshine guarantees 100% data privacy, eliminates cloud API costs, and allows offline operation.

---

## 2. Architecture Questions

### Q4: Can you walk through the system architecture?
**Answer:** Audio or text inputs pass into FastAPI. Audio is transcribed locally using Useful Sensors' **Moonshine** engine. The transcript is sent to **Ollama** running **Qwen 2.5** to extract structured JSON. **Pydantic** validates the output, **SQLAlchemy** persists it to **SQLite**, and the **Risk Engine** dynamically evaluates execution risks for rendering on the **React** dashboard.

### Q5: Why did you choose FastAPI over Flask or Django?
**Answer:** FastAPI offers high performance through Python `asyncio`, native integration with Pydantic for request/response validation, automatic OpenAPI/Swagger documentation, and minimal boilerplate overhead.

### Q6: Why SQLite for the database?
**Answer:** SQLite is a zero-configuration, serverless relational database embedded directly in Python. It provides ACID compliance and fast local reads, making it perfect for a single-tenant Capstone project MVP.

---

## 3. AI & LLM Questions

### Q7: What is the role of Ollama in your project?
**Answer:** Ollama acts as a local model management server and REST API wrapper around open-weights LLMs, handling local GPU/CPU inference without needing cloud API keys.

### Q8: Why Qwen 2.5 over other open models like Llama 3?
**Answer:** Qwen 2.5 demonstrates superior instruction-following capabilities for structured JSON generation, precise date normalization, and accurate relational dependency extraction in benchmark tests.

### Q9: How do you guarantee structured JSON output from the LLM?
**Answer:** We set `temperature=0.0` for deterministic generation, provide an explicit JSON system prompt schema, enforce Pydantic parsing at runtime, and implement regex fallback repair logic if minor syntax errors occur.

### Q10: What happens if Ollama is offline or unavailable?
**Answer:** FastAPI catches connection exceptions and returns an HTTP `503 Service Unavailable` with a user-friendly error message (`"Ollama is unavailable. Please make sure Ollama is running."`).

---

## 4. Speech Recognition Questions

### Q11: What is Moonshine and why did you select it?
**Answer:** Moonshine is a fast, lightweight on-device speech-to-text model developed by Useful Sensors. It is optimized for edge CPU execution and transcribes audio directly without sending voice data to external cloud services.

### Q12: Why separate speech transcription from LLM analysis?
**Answer:** Decoupling STT from LLM extraction allows users to inspect, verify, and manually edit the generated transcript in the UI before triggering expensive LLM analysis, preventing invalid data from entering the task pipeline.

---

## 5. Execution Risk Engine Questions

### Q13: How does the Risk Engine work?
**Answer:** The Risk Engine is a deterministic Python service (`RiskEngine`) that inspects task statuses, deadlines, and dependencies dynamically on request (`GET /projects/{id}/risks`). It evaluates 5 rules (`OVERDUE_TASK`, `BLOCKED_TASK`, `DEPENDENCY_RISK`, `APPROACHING_DEADLINE`, `HIGH_PRIORITY_INCOMPLETE`).

### Q14: Why is the current Risk Engine rule-based rather than ML-based?
**Answer:** A rule-based engine is 100% deterministic, explainable, instant, and transparent for capstone evaluation. ML models require large historical training datasets that are unavailable during initial project startup.

### Q15: How are task dependencies resolved?
**Answer:** Dependencies are stored as text references. The engine performs normalized, case-insensitive string matching against existing task titles in the same project workspace. If a dependent task exists and is not `DONE`, a `DEPENDENCY_RISK` (HIGH severity) is raised.

---

## 6. Engineering & Operations Questions

### Q16: How do you test the backend application?
**Answer:** We use **Pytest** with FastAPI `TestClient` and an in-memory SQLite database (`sqlite:///:memory:`). The test suite includes 57 automated tests covering routes, Pydantic schemas, speech mocking, and risk rules.

### Q17: What happens if a meeting is analyzed twice?
**Answer:** Analysis is idempotent. Before storing new tasks and decisions, previous tasks and decisions linked to that specific `meeting_id` are cleared from SQLite to prevent duplicate records.

---

## 7. Future Scope Questions

### Q18: How would you scale this system for production enterprise use?
**Answer:** 
1. Replace SQLite with **PostgreSQL**.
2. Deploy backend onto Kubernetes with horizontal pod autoscaling.
3. Use **Celery + Redis** for asynchronous background transcription queues.
4. Add **ChromaDB / Qdrant** vector store for cross-meeting RAG search.
5. Integrate OAuth2 authentication and Slack/Teams webhooks.
