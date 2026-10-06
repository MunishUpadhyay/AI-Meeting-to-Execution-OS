from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Meeting, Decision
from app.schemas import DecisionCreate, DecisionResponse

router = APIRouter(tags=["decisions"])


@router.post("/meetings/{meeting_id}/decisions", response_model=DecisionResponse, status_code=status.HTTP_201_CREATED)
def create_decision(meeting_id: int, decision_in: DecisionCreate, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Meeting with ID {meeting_id} not found"
        )
    decision = Decision(
        meeting_id=meeting_id,
        content=decision_in.content
    )
    db.add(decision)
    db.commit()
    db.refresh(decision)
    return decision


@router.get("/meetings/{meeting_id}/decisions", response_model=list[DecisionResponse])
def list_meeting_decisions(meeting_id: int, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Meeting with ID {meeting_id} not found"
        )
    return db.query(Decision).filter(Decision.meeting_id == meeting_id).all()
