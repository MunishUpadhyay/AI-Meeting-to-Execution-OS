from datetime import date, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models import Project, Task
from app.services.risk_engine import RiskEngine
from app.schemas.risk import RiskType, RiskSeverity


def create_test_project(db: Session, name: str = "Test Project") -> Project:
    project = Project(name=name, description="Test description")
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


FIXED_TODAY = date(2026, 10, 7)


def test_no_tasks_no_risks(db_session: Session, client: TestClient):
    project = create_test_project(db_session)
    response = client.get(f"/projects/{project.id}/risks")
    assert response.status_code == 200
    data = response.json()
    assert data["project_id"] == project.id
    assert data["summary"]["total_tasks"] == 0
    assert data["summary"]["risk_count"] == 0
    assert data["risks"] == []


def test_done_task_no_risks(db_session: Session):
    project = create_test_project(db_session)
    yesterday = (FIXED_TODAY - timedelta(days=1)).strftime("%Y-%m-%d")
    task = Task(
        project_id=project.id,
        title="Completed Task",
        status="DONE",
        priority="HIGH",
        deadline=yesterday,
        dependency="Some Dep",
    )
    db_session.add(task)
    db_session.commit()

    res = RiskEngine.evaluate_project_risks(project.id, [task], today_date=FIXED_TODAY)
    assert res.summary.total_tasks == 1
    assert res.summary.completed_tasks == 1
    assert res.summary.risk_count == 0
    assert res.risks == []


def test_blocked_task_risk(db_session: Session):
    project = create_test_project(db_session)
    task = Task(
        project_id=project.id,
        title="Blocked Feature",
        status="BLOCKED",
        priority="MEDIUM",
    )
    db_session.add(task)
    db_session.commit()

    res = RiskEngine.evaluate_project_risks(project.id, [task], today_date=FIXED_TODAY)
    assert res.summary.blocked_tasks == 1
    assert res.summary.risk_count == 1
    assert res.risks[0].type == RiskType.BLOCKED_TASK
    assert res.risks[0].severity == RiskSeverity.HIGH


def test_overdue_task_risk(db_session: Session):
    project = create_test_project(db_session)
    past_date = (FIXED_TODAY - timedelta(days=3)).strftime("%Y-%m-%d")
    task = Task(
        project_id=project.id,
        title="Late Task",
        status="TODO",
        priority="MEDIUM",
        deadline=past_date,
    )
    db_session.add(task)
    db_session.commit()

    res = RiskEngine.evaluate_project_risks(project.id, [task], today_date=FIXED_TODAY)
    assert res.summary.overdue_tasks == 1
    assert res.summary.risk_count == 1
    assert res.risks[0].type == RiskType.OVERDUE_TASK
    assert res.risks[0].severity == RiskSeverity.HIGH


def test_approaching_deadline_risk(db_session: Session):
    project = create_test_project(db_session)
    tomorrow = (FIXED_TODAY + timedelta(days=1)).strftime("%Y-%m-%d")
    task = Task(
        project_id=project.id,
        title="Soon Task",
        status="IN_PROGRESS",
        priority="MEDIUM",
        deadline=tomorrow,
    )
    db_session.add(task)
    db_session.commit()

    res = RiskEngine.evaluate_project_risks(project.id, [task], today_date=FIXED_TODAY)
    assert res.summary.in_progress_tasks == 1
    assert res.summary.risk_count == 1
    assert res.risks[0].type == RiskType.APPROACHING_DEADLINE
    assert res.risks[0].severity == RiskSeverity.MEDIUM


def test_completed_dependency(db_session: Session):
    project = create_test_project(db_session)
    dep_task = Task(
        project_id=project.id,
        title="Setup DB",
        status="DONE",
        priority="HIGH",
    )
    db_session.add(dep_task)
    db_session.commit()

    dependent_task = Task(
        project_id=project.id,
        title="Run Migrations",
        status="TODO",
        priority="LOW",
        dependency="Setup DB",
    )
    db_session.add(dependent_task)
    db_session.commit()

    res = RiskEngine.evaluate_project_risks(
        project.id, [dep_task, dependent_task], today_date=FIXED_TODAY
    )
    assert res.summary.risk_count == 0


def test_incomplete_dependency_risk(db_session: Session):
    project = create_test_project(db_session)
    dep_task = Task(
        project_id=project.id,
        title="Payment API",
        status="IN_PROGRESS",
        priority="HIGH",
    )
    db_session.add(dep_task)
    db_session.commit()

    dependent_task = Task(
        project_id=project.id,
        title="Integration Testing",
        status="TODO",
        priority="MEDIUM",
        dependency="Payment API",
    )
    db_session.add(dependent_task)
    db_session.commit()

    res = RiskEngine.evaluate_project_risks(
        project.id, [dep_task, dependent_task], today_date=FIXED_TODAY
    )
    dep_risks = [r for r in res.risks if r.type == RiskType.DEPENDENCY_RISK]
    assert len(dep_risks) == 1
    assert dep_risks[0].severity == RiskSeverity.HIGH
    assert dep_risks[0].related_task_id == dependent_task.id
    assert dep_risks[0].dependency_task_id == dep_task.id


def test_unresolved_dependency_reference(db_session: Session):
    project = create_test_project(db_session)
    task = Task(
        project_id=project.id,
        title="Deploy App",
        status="TODO",
        priority="MEDIUM",
        dependency="Nonexistent Core Module",
    )
    db_session.add(task)
    db_session.commit()

    res = RiskEngine.evaluate_project_risks(project.id, [task], today_date=FIXED_TODAY)
    assert res.summary.risk_count == 1
    assert res.risks[0].type == RiskType.UNRESOLVED_DEPENDENCY_REFERENCE
    assert res.risks[0].severity == RiskSeverity.MEDIUM


def test_high_priority_incomplete_risk(db_session: Session):
    project = create_test_project(db_session)
    task = Task(
        project_id=project.id,
        title="Critical Security Audit",
        status="TODO",
        priority="HIGH",
    )
    db_session.add(task)
    db_session.commit()

    res = RiskEngine.evaluate_project_risks(project.id, [task], today_date=FIXED_TODAY)
    assert res.summary.risk_count == 1
    assert res.risks[0].type == RiskType.HIGH_PRIORITY_INCOMPLETE
    assert res.risks[0].severity == RiskSeverity.MEDIUM


def test_project_mixed_tasks_summary(db_session: Session, client: TestClient):
    project = create_test_project(db_session)
    t1 = Task(project_id=project.id, title="Task 1", status="DONE", priority="LOW")
    t2 = Task(project_id=project.id, title="Task 2", status="IN_PROGRESS", priority="MEDIUM")
    t3 = Task(project_id=project.id, title="Task 3", status="BLOCKED", priority="HIGH")
    t4 = Task(
        project_id=project.id,
        title="Task 4",
        status="TODO",
        priority="MEDIUM",
        deadline="2020-01-01",
    )
    db_session.add_all([t1, t2, t3, t4])
    db_session.commit()

    response = client.get(f"/projects/{project.id}/risks")
    assert response.status_code == 200
    data = response.json()

    assert data["summary"]["total_tasks"] == 4
    assert data["summary"]["completed_tasks"] == 1
    assert data["summary"]["in_progress_tasks"] == 1
    assert data["summary"]["blocked_tasks"] == 1
    assert data["summary"]["overdue_tasks"] == 1
    assert data["summary"]["risk_count"] >= 2


def test_nonexistent_project_404(client: TestClient):
    response = client.get("/projects/99999/risks")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_no_deadline_no_deadline_risk(db_session: Session):
    project = create_test_project(db_session)
    task = Task(
        project_id=project.id,
        title="No Deadline Task",
        status="TODO",
        priority="LOW",
        deadline=None,
    )
    db_session.add(task)
    db_session.commit()

    res = RiskEngine.evaluate_project_risks(project.id, [task], today_date=FIXED_TODAY)
    deadline_risks = [
        r for r in res.risks if r.type in (RiskType.OVERDUE_TASK, RiskType.APPROACHING_DEADLINE)
    ]
    assert len(deadline_risks) == 0
