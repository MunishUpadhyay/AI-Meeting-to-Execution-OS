import os
import shutil
import tempfile
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Project, Meeting
from app.schemas import MeetingCreate, MeetingUpdate, MeetingResponse, MeetingTranscribeResponse
from app.services.speech_service import (
    speech_service,
    SpeechServiceException,
    SpeechServiceUnavailableException,
    InvalidAudioException,
)

router = APIRouter(tags=["meetings"])

ALLOWED_EXTENSIONS = {".wav", ".mp3", ".m4a", ".ogg", ".webm", ".flac", ".aac", ".mp4"}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB


@router.post("/projects/{project_id}/meetings", response_model=MeetingResponse, status_code=status.HTTP_201_CREATED)
def create_meeting(project_id: int, meeting_in: MeetingCreate, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found"
        )
    meeting = Meeting(
        project_id=project_id,
        title=meeting_in.title,
        transcript=meeting_in.transcript,
        summary=meeting_in.summary
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    return meeting


@router.get("/projects/{project_id}/meetings", response_model=list[MeetingResponse])
def list_project_meetings(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found"
        )
    return db.query(Meeting).filter(Meeting.project_id == project_id).all()


@router.get("/meetings/{meeting_id}", response_model=MeetingResponse)
def get_meeting(meeting_id: int, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Meeting with ID {meeting_id} not found"
        )
    return meeting


@router.patch("/meetings/{meeting_id}", response_model=MeetingResponse)
def update_meeting(meeting_id: int, meeting_in: MeetingUpdate, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Meeting with ID {meeting_id} not found"
        )

    update_data = meeting_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(meeting, field, value)

    db.commit()
    db.refresh(meeting)
    return meeting



@router.post("/meetings/{meeting_id}/transcribe", response_model=MeetingTranscribeResponse, status_code=status.HTTP_200_OK)
def transcribe_meeting(
    meeting_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Meeting with ID {meeting_id} not found",
        )

    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No audio file was uploaded",
        )

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Allowed formats: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    temp_filename = f"audio_{uuid.uuid4().hex}{ext}"
    temp_path = os.path.join(tempfile.gettempdir(), temp_filename)

    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        file_size = os.path.getsize(temp_path)
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Audio file size ({file_size / (1024*1024):.1f}MB) exceeds 50MB limit",
            )

        if file_size == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded audio file is empty (0 bytes)",
            )

        transcript = speech_service.transcribe_audio(temp_path)

        meeting.transcript = transcript
        db.commit()
        db.refresh(meeting)

        return MeetingTranscribeResponse(
            meeting_id=meeting.id,
            transcript=transcript,
            status="transcribed",
        )
    except HTTPException:
        raise
    except InvalidAudioException as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except SpeechServiceUnavailableException as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except SpeechServiceException as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc
    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass
