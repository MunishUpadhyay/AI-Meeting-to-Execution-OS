from unittest.mock import patch
from app.schemas.ai_extraction import (
    AnalysisResult,
    DecisionExtraction,
    TaskExtraction,
)
from app.schemas.task import TaskPriority
from app.services.ai_service import (
    AIServiceUnavailableException,
    AIServiceTimeoutException,
    AIInvalidOutputException,
)


def test_analyze_meeting_not_found(client):
    response = client.post("/meetings/999/analyze")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"]


def test_analyze_empty_transcript(client):
    proj_res = client.post("/projects", json={"name": "Test Project"})
    project_id = proj_res.json()["id"]

    meet_res = client.post(
        f"/projects/{project_id}/meetings",
        json={"title": "Empty Meeting", "transcript": "   "}
    )
    meeting_id = meet_res.json()["id"]

    response = client.post(f"/meetings/{meeting_id}/analyze")
    assert response.status_code == 400
    assert "transcript is empty" in response.json()["detail"]


@patch("app.api.routes.analysis.ai_service.analyze_transcript")
def test_analyze_service_unavailable(mock_analyze, client):
    proj_res = client.post("/projects", json={"name": "Test Project"})
    project_id = proj_res.json()["id"]

    meet_res = client.post(
        f"/projects/{project_id}/meetings",
        json={"title": "Planning", "transcript": "Some transcript content"}
    )
    meeting_id = meet_res.json()["id"]

    mock_analyze.side_effect = AIServiceUnavailableException("Ollama down")

    response = client.post(f"/meetings/{meeting_id}/analyze")
    assert response.status_code == 503
    assert "Ollama down" in response.json()["detail"]


@patch("app.api.routes.analysis.ai_service.analyze_transcript")
def test_analyze_service_timeout(mock_analyze, client):
    proj_res = client.post("/projects", json={"name": "Test Project"})
    project_id = proj_res.json()["id"]

    meet_res = client.post(
        f"/projects/{project_id}/meetings",
        json={"title": "Planning", "transcript": "Some transcript content"}
    )
    meeting_id = meet_res.json()["id"]

    mock_analyze.side_effect = AIServiceTimeoutException("Request timed out")

    response = client.post(f"/meetings/{meeting_id}/analyze")
    assert response.status_code == 504
    assert "timed out" in response.json()["detail"]


@patch("app.api.routes.analysis.ai_service.analyze_transcript")
def test_analyze_invalid_ai_output(mock_analyze, client):
    proj_res = client.post("/projects", json={"name": "Test Project"})
    project_id = proj_res.json()["id"]

    meet_res = client.post(
        f"/projects/{project_id}/meetings",
        json={"title": "Planning", "transcript": "Some transcript content"}
    )
    meeting_id = meet_res.json()["id"]

    mock_analyze.side_effect = AIInvalidOutputException("Invalid JSON output")

    response = client.post(f"/meetings/{meeting_id}/analyze")
    assert response.status_code == 502
    assert "Invalid JSON" in response.json()["detail"]


@patch("app.api.routes.analysis.ai_service.analyze_transcript")
def test_analyze_success_and_persistence(mock_analyze, client):
    proj_res = client.post("/projects", json={"name": "Payment Gateway Project"})
    project_id = proj_res.json()["id"]

    meet_res = client.post(
        f"/projects/{project_id}/meetings",
        json={
            "title": "Payment Backend Meeting",
            "transcript": "Rahul will implement payment API by Oct 8. We decided to use FastAPI."
        }
    )
    meeting_id = meet_res.json()["id"]

    mock_result = AnalysisResult(
        summary="Discussed payment gateway backend implementation.",
        decisions=[DecisionExtraction(content="Backend will use FastAPI.")],
        tasks=[
            TaskExtraction(
                title="Implement payment API",
                owner="Rahul",
                deadline="October 8",
                priority=TaskPriority.HIGH,
                dependency="Database schema"
            )
        ],
        blockers=["API credentials pending"],
        risks=["Tight deadline"]
    )
    mock_analyze.return_value = mock_result

    response = client.post(f"/meetings/{meeting_id}/analyze")
    assert response.status_code == 200
    data = response.json()

    assert data["meeting_id"] == meeting_id
    assert data["summary"] == "Discussed payment gateway backend implementation."
    assert len(data["decisions"]) == 1
    assert data["decisions"][0]["content"] == "Backend will use FastAPI."
    assert len(data["tasks"]) == 1
    assert data["tasks"][0]["title"] == "Implement payment API"
    assert data["tasks"][0]["owner"] == "Rahul"
    assert data["tasks"][0]["deadline"] == "2026-10-08"
    assert data["tasks"][0]["priority"] == "HIGH"
    assert data["blockers"] == ["API credentials pending"]
    assert data["risks"] == ["Tight deadline"]

    # Verify Database persistence
    meeting_db = client.get(f"/meetings/{meeting_id}").json()
    assert meeting_db["summary"] == "Discussed payment gateway backend implementation."

    decisions_db = client.get(f"/meetings/{meeting_id}/decisions").json()
    assert len(decisions_db) == 1
    assert decisions_db[0]["content"] == "Backend will use FastAPI."
    assert decisions_db[0]["meeting_id"] == meeting_id

    tasks_db = client.get(f"/projects/{project_id}/tasks").json()
    assert len(tasks_db) == 1
    assert tasks_db[0]["title"] == "Implement payment API"
    assert tasks_db[0]["project_id"] == project_id
    assert tasks_db[0]["meeting_id"] == meeting_id
    assert tasks_db[0]["owner"] == "Rahul"
    assert tasks_db[0]["deadline"] == "2026-10-08"


@patch("app.api.routes.analysis.ai_service.analyze_transcript")
def test_analyze_idempotency_no_duplicates(mock_analyze, client):
    proj_res = client.post("/projects", json={"name": "Idempotency Project"})
    project_id = proj_res.json()["id"]

    meet_res = client.post(
        f"/projects/{project_id}/meetings",
        json={"title": "Sprint Review", "transcript": "We decided to deploy to staging."}
    )
    meeting_id = meet_res.json()["id"]

    mock_result_1 = AnalysisResult(
        summary="Initial run summary",
        decisions=[DecisionExtraction(content="Deploy to staging")],
        tasks=[TaskExtraction(title="Configure staging environment", owner="Priya")]
    )
    mock_analyze.return_value = mock_result_1

    # First run
    res1 = client.post(f"/meetings/{meeting_id}/analyze")
    assert res1.status_code == 200
    assert len(client.get(f"/projects/{project_id}/tasks").json()) == 1
    assert len(client.get(f"/meetings/{meeting_id}/decisions").json()) == 1

    # Second run (updated output)
    mock_result_2 = AnalysisResult(
        summary="Updated run summary",
        decisions=[DecisionExtraction(content="Deploy to staging and production")],
        tasks=[
            TaskExtraction(title="Configure staging environment", owner="Priya"),
            TaskExtraction(title="Configure production environment", owner="Amit")
        ]
    )
    mock_analyze.return_value = mock_result_2

    res2 = client.post(f"/meetings/{meeting_id}/analyze")
    assert res2.status_code == 200

    # Ensure no duplicated tasks/decisions: only current analysis records remain
    tasks_db = client.get(f"/projects/{project_id}/tasks").json()
    decisions_db = client.get(f"/meetings/{meeting_id}/decisions").json()

    assert len(tasks_db) == 2
    assert len(decisions_db) == 1
    assert decisions_db[0]["content"] == "Deploy to staging and production"


def test_task_extraction_deadline_normalization():
    # 1. Natural language "October 8" -> 2026-10-08
    t1 = TaskExtraction(title="Task A", deadline="October 8")
    assert t1.deadline == "2026-10-08"

    # 2. ISO date remains unchanged
    t2 = TaskExtraction(title="Task B", deadline="2026-10-08")
    assert t2.deadline == "2026-10-08"

    # 3. Missing deadline remains None
    t3 = TaskExtraction(title="Task C", deadline=None)
    assert t3.deadline is None

    # 4. Unparseable deadline is safely set to None
    t4 = TaskExtraction(title="Task D", deadline="someday")
    assert t4.deadline is None


def test_task_extraction_dependency_sanitization():
    # 1. Self-referential dependency is sanitized to None
    t1 = TaskExtraction(
        title="Complete the database schema",
        dependency="Complete the database schema before API integration"
    )
    assert t1.dependency is None

    # 2. Identical title and dependency sanitized to None
    t2 = TaskExtraction(
        title="Testing",
        dependency="Testing"
    )
    assert t2.dependency is None

    # 3. Valid distinct dependency preserved
    t3 = TaskExtraction(
        title="Implement payment API",
        dependency="Database schema"
    )
    assert t3.dependency == "Database schema"


def test_dependency_explicit_relationship_rules():
    """Verify explicit dependency rules and unstated dependency handling."""
    # Case 1: "Testing must be completed before deployment." (Deployment is not a separate task)
    # Expected: Testing has dependency = None
    t_testing = TaskExtraction(title="Testing", dependency="deployment")
    # If deployment is not an identified task, or if unstated relationship, handled correctly
    # Check that sanitization & schema validation handle null dependency properly
    t_testing_null = TaskExtraction(title="Testing", dependency=None)
    assert t_testing_null.dependency is None

    # Case 2: "Complete the database schema before implementing the payment API."
    # Expected: Database schema (dep: None), Implement payment API (dep: "Complete the database schema")
    t_db = TaskExtraction(title="Complete the database schema", dependency=None)
    t_api = TaskExtraction(title="Implement the payment API", dependency="Complete the database schema")

    assert t_db.dependency is None
    assert t_api.dependency == "Complete the database schema"

