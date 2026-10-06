from unittest.mock import patch
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models import Project, Meeting
from app.services.speech_service import (
    SpeechServiceUnavailableException,
    InvalidAudioException,
    SpeechServiceException,
)


def create_test_meeting(db: Session) -> Meeting:
    project = Project(name="Speech Test Project", description="Test")
    db.add(project)
    db.commit()

    meeting = Meeting(
        project_id=project.id,
        title="Speech Test Meeting",
        transcript="Old transcript",
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    return meeting


def test_transcribe_missing_meeting_404(client: TestClient):
    response = client.post(
        "/meetings/99999/transcribe",
        files={"file": ("test.wav", b"fake audio content", "audio/wav")},
    )
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_transcribe_missing_file_400(db_session: Session, client: TestClient):
    meeting = create_test_meeting(db_session)
    response = client.post(f"/meetings/{meeting.id}/transcribe")
    assert response.status_code == 422 or response.status_code == 400


def test_transcribe_unsupported_format_400(db_session: Session, client: TestClient):
    meeting = create_test_meeting(db_session)
    response = client.post(
        f"/meetings/{meeting.id}/transcribe",
        files={"file": ("script.exe", b"binary data", "application/octet-stream")},
    )
    assert response.status_code == 400
    assert "unsupported file format" in response.json()["detail"].lower()


def test_transcribe_empty_file_400(db_session: Session, client: TestClient):
    meeting = create_test_meeting(db_session)
    response = client.post(
        f"/meetings/{meeting.id}/transcribe",
        files={"file": ("empty.wav", b"", "audio/wav")},
    )
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()


def test_transcribe_speech_service_unavailable_503(db_session: Session, client: TestClient):
    meeting = create_test_meeting(db_session)
    with patch(
        "app.api.routes.meetings.speech_service.transcribe_audio",
        side_effect=SpeechServiceUnavailableException("Moonshine model not found"),
    ):
        response = client.post(
            f"/meetings/{meeting.id}/transcribe",
            files={"file": ("test.wav", b"dummy wav data header content", "audio/wav")},
        )
        assert response.status_code == 503
        assert "moonshine" in response.json()["detail"].lower()


def test_transcribe_invalid_audio_400(db_session: Session, client: TestClient):
    meeting = create_test_meeting(db_session)
    with patch(
        "app.api.routes.meetings.speech_service.transcribe_audio",
        side_effect=InvalidAudioException("Corrupt audio file"),
    ):
        response = client.post(
            f"/meetings/{meeting.id}/transcribe",
            files={"file": ("corrupt.wav", b"corrupt data header", "audio/wav")},
        )
        assert response.status_code == 400
        assert "corrupt" in response.json()["detail"].lower()


def test_transcribe_speech_service_failure_500(db_session: Session, client: TestClient):
    meeting = create_test_meeting(db_session)
    with patch(
        "app.api.routes.meetings.speech_service.transcribe_audio",
        side_effect=SpeechServiceException("Unexpected engine failure"),
    ):
        response = client.post(
            f"/meetings/{meeting.id}/transcribe",
            files={"file": ("test.wav", b"dummy audio bytes", "audio/wav")},
        )
        assert response.status_code == 500


def test_transcribe_successful_path(db_session: Session, client: TestClient):
    meeting = create_test_meeting(db_session)
    mocked_transcript = "The team decided to launch the payment gateway on Monday."

    with patch(
        "app.api.routes.meetings.speech_service.transcribe_audio",
        return_value=mocked_transcript,
    ):
        response = client.post(
            f"/meetings/{meeting.id}/transcribe",
            files={"file": ("sample.wav", b"valid wav audio content header bytes", "audio/wav")},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["meeting_id"] == meeting.id
        assert data["transcript"] == mocked_transcript
        assert data["status"] == "transcribed"

        # Verify database update
        db_session.refresh(meeting)
        assert meeting.transcript == mocked_transcript
