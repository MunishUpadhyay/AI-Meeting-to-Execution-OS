import os
import logging
from pathlib import Path

logger = logging.getLogger(__name__)


class SpeechServiceException(Exception):
    """Base exception for speech-to-text service errors."""

    pass


class SpeechServiceUnavailableException(SpeechServiceException):
    """Raised when Moonshine model cannot be loaded or initialized."""

    pass


class InvalidAudioException(SpeechServiceException):
    """Raised when the provided audio file is invalid, unsupported, or unreadable."""

    pass


class SpeechService:
    def __init__(self, model_name: str = "moonshine/tiny"):
        self.model_name = model_name
        self._model_loaded = False

    def _load_model(self):
        if self._model_loaded:
            return
        try:
            import moonshine  # useful-moonshine package

            self._model_loaded = True
            logger.info("Moonshine speech-to-text engine initialized successfully.")
        except ImportError:
            try:
                import moonshine_onnx as moonshine

                self._model_loaded = True
                logger.info("Moonshine ONNX engine initialized successfully.")
            except ImportError as exc:
                logger.error("Failed to import Moonshine speech engine: %s", exc)
                raise SpeechServiceUnavailableException(
                    "Moonshine speech-to-text package is not installed or unavailable."
                ) from exc
        except Exception as exc:
            logger.error("Failed to initialize Moonshine speech engine: %s", exc)
            raise SpeechServiceUnavailableException(
                f"Speech service initialization failed: {exc}"
            ) from exc

    def transcribe_audio(self, audio_path: str | Path) -> str:
        audio_path_str = str(audio_path)
        if not os.path.exists(audio_path_str):
            raise InvalidAudioException(f"Audio file not found at path: {audio_path_str}")

        if os.path.getsize(audio_path_str) == 0:
            raise InvalidAudioException("Uploaded audio file is empty (0 bytes).")

        self._load_model()

        try:
            import moonshine

            # Perform local speech-to-text transcription
            result = moonshine.transcribe(audio_path_str, self.model_name)

            if isinstance(result, (list, tuple)):
                transcript = " ".join(str(item).strip() for item in result if str(item).strip()).strip()
            else:
                transcript = str(result).strip()

            if not transcript:
                raise InvalidAudioException("Audio transcription yielded an empty transcript.")

            return transcript
        except InvalidAudioException:
            raise
        except Exception as exc:
            logger.error("Transcription error on file '%s': %s", audio_path_str, exc)
            raise SpeechServiceException(
                f"Failed to transcribe audio file: {exc}"
            ) from exc


speech_service = SpeechService()
