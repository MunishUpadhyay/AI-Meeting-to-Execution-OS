from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Project, Task
from app.schemas.risk import ProjectRisksResponse
from app.services.risk_engine import RiskEngine

router = APIRouter(prefix="/projects", tags=["risks"])


@router.get("/{project_id}/risks", response_model=ProjectRisksResponse)
def get_project_risks(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found",
        )

    tasks = db.query(Task).filter(Task.project_id == project_id).all()
    return RiskEngine.evaluate_project_risks(project_id, tasks)
