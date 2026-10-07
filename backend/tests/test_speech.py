import sys
from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models import Project, Meeting
from app.services.speech_service import (
    SpeechService,
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


# Unit tests for SpeechService direct implementation

def test_speech_service_lazy_import_and_transcribe(tmp_path):
    """Test SpeechService lazily imports moonshine_onnx and calls transcribe()."""
    test_audio = tmp_path / "test.wav"
    test_audio.write_bytes(b"RIFF dummy audio content")

    mock_onnx = MagicMock()
    mock_onnx.transcribe.return_value = "Test transcription output from ONNX engine."

    service = SpeechService(model_name="moonshine/tiny")
    assert service._model_loaded is False
    assert service._moonshine is None

    with patch.dict(sys.modules, {"moonshine_onnx": mock_onnx}):
        result = service.transcribe_audio(test_audio)

    assert result == "Test transcription output from ONNX engine."
    assert service._model_loaded is True
    assert service._moonshine == mock_onnx
    mock_onnx.transcribe.assert_called_once_with(str(test_audio), "moonshine/tiny")


def test_speech_service_list_tuple_result_normalization(tmp_path):
    """Test SpeechService normalizes list/tuple results from moonshine_onnx."""
    test_audio = tmp_path / "test.wav"
    test_audio.write_bytes(b"RIFF dummy audio content")

    mock_onnx = MagicMock()
    mock_onnx.transcribe.return_value = ["Hello", "world", "this is", "a test."]

    service = SpeechService()
    with patch.dict(sys.modules, {"moonshine_onnx": mock_onnx}):
        result = service.transcribe_audio(test_audio)

    assert result == "Hello world this is a test."


def test_speech_service_import_failure(tmp_path):
    """Test SpeechService raises SpeechServiceUnavailableException when moonshine_onnx import fails."""
    test_audio = tmp_path / "test.wav"
    test_audio.write_bytes(b"RIFF dummy audio content")

    service = SpeechService()
    with patch.dict(sys.modules, {"moonshine_onnx": None}):
        with pytest.raises(SpeechServiceUnavailableException) as exc_info:
            service.transcribe_audio(test_audio)
    assert "unavailable" in str(exc_info.value).lower()


def test_speech_service_onnx_import_error(tmp_path):
    """Test SpeechService raises SpeechServiceUnavailableException if import fails on valid audio."""
    test_audio = tmp_path / "test.wav"
    test_audio.write_bytes(b"RIFF dummy audio content")

    service = SpeechService()

    def raise_import_error(name, *args, **kwargs):
        if name == "moonshine_onnx":
            raise ImportError("No module named 'moonshine_onnx'")
        return __import__(name, *args, **kwargs)

    with patch("builtins.__import__", side_effect=raise_import_error):
        with pytest.raises(SpeechServiceUnavailableException) as exc_info:
            service.transcribe_audio(test_audio)

    assert "unavailable" in str(exc_info.value).lower()


def test_speech_service_nonexistent_audio():
    """Test SpeechService rejects non-existent audio files."""
    service = SpeechService()
    with pytest.raises(InvalidAudioException) as exc_info:
        service.transcribe_audio("non_existent_path_12345.wav")
    assert "not found" in str(exc_info.value).lower()


def test_speech_service_empty_audio_file(tmp_path):
    """Test SpeechService rejects 0-byte audio files."""
    test_audio = tmp_path / "empty.wav"
    test_audio.write_bytes(b"")

    service = SpeechService()
    with pytest.raises(InvalidAudioException) as exc_info:
        service.transcribe_audio(test_audio)
    assert "empty (0 bytes)" in str(exc_info.value).lower()


def test_speech_service_empty_transcription_rejection(tmp_path):
    """Test SpeechService rejects empty transcription results."""
    test_audio = tmp_path / "test.wav"
    test_audio.write_bytes(b"RIFF dummy audio content")

    mock_onnx = MagicMock()
    mock_onnx.transcribe.return_value = "   "

    service = SpeechService()
    with patch.dict(sys.modules, {"moonshine_onnx": mock_onnx}):
        with pytest.raises(InvalidAudioException) as exc_info:
            service.transcribe_audio(test_audio)
    assert "empty transcript" in str(exc_info.value).lower()


# API Endpoint tests

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
    assert response.status_code in (400, 422)


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
        side_effect=SpeechServiceUnavailableException("Moonshine ONNX model not found"),
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
