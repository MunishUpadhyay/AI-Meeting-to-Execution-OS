from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Meeting, Task, Decision
from app.schemas.ai_extraction import MeetingAnalysisResponse
from app.services.ai_service import (
    ai_service,
    AIServiceUnavailableException,
    AIServiceTimeoutException,
    AIInvalidOutputException,
)

router = APIRouter(tags=["analysis"])


@router.post("/meetings/{meeting_id}/analyze", response_model=MeetingAnalysisResponse, status_code=status.HTTP_200_OK)
def analyze_meeting(meeting_id: int, db: Session = Depends(get_db)):
    # 1. Fetch meeting
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Meeting with ID {meeting_id} not found"
        )

    # 2. Check transcript
    if not meeting.transcript or not meeting.transcript.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Meeting transcript is empty or missing"
        )

    # 3. Call AI Service
    try:
        analysis = ai_service.analyze_transcript(meeting.transcript)
    except AIServiceUnavailableException as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc)
        ) from exc
    except AIServiceTimeoutException as exc:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail=str(exc)
        ) from exc
    except AIInvalidOutputException as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc)
        ) from exc

    # 4. Idempotency: clear prior decisions & tasks associated with this meeting
    db.query(Task).filter(Task.meeting_id == meeting.id).delete(synchronize_session=False)
    db.query(Decision).filter(Decision.meeting_id == meeting.id).delete(synchronize_session=False)

    # 5. Update Meeting Summary
    meeting.summary = analysis.summary

    # 6. Persist Decisions
    for dec_in in analysis.decisions:
        decision = Decision(
            meeting_id=meeting.id,
            content=dec_in.content
        )
        db.add(decision)

    # 7. Persist Tasks
    for task_in in analysis.tasks:
        task = Task(
            project_id=meeting.project_id,
            meeting_id=meeting.id,
            title=task_in.title,
            owner=task_in.owner,
            deadline=task_in.deadline,
            status="TODO",
            priority=task_in.priority.value if hasattr(task_in.priority, "value") else str(task_in.priority),
            dependency=task_in.dependency
        )
        db.add(task)

    db.commit()

    return MeetingAnalysisResponse(
        meeting_id=meeting.id,
        summary=analysis.summary,
        decisions=analysis.decisions,
        tasks=analysis.tasks,
        blockers=analysis.blockers,
        risks=analysis.risks,
    )
