import json
import logging
import httpx
from pydantic import ValidationError
from app.core.config import settings
from app.schemas.ai_extraction import AnalysisResult

logger = logging.getLogger(__name__)


class AIServiceException(Exception):
    """Base exception for AI Service errors"""
    pass


class AIServiceUnavailableException(AIServiceException):
    """Raised when Ollama server cannot be reached"""
    pass


class AIServiceTimeoutException(AIServiceException):
    """Raised when Ollama request times out"""
    pass


class AIInvalidOutputException(AIServiceException):
    """Raised when Ollama output cannot be parsed or validated"""
    pass


SYSTEM_PROMPT = """You are an execution intelligence extraction system.
Your task is to extract structured project execution artifacts from a meeting transcript.
Do NOT perform generic conversational summarization.
Extract ONLY information that is explicitly supported by the transcript.

Return a SINGLE valid JSON object with the following structure:
{
  "summary": "Concise summary of what occurred in the meeting.",
  "decisions": [
    {
      "content": "Explicit decision agreed upon by the team."
    }
  ],
  "tasks": [
    {
      "title": "Actionable task title.",
      "owner": "Person explicitly assigned (or null if unassigned)",
      "deadline": "Explicit date/deadline mentioned (or null)",
      "priority": "LOW" | "MEDIUM" | "HIGH",
      "dependency": "Prerequisite task or resource explicitly mentioned (or null)"
    }
  ],
  "blockers": [
    "Explicit blocker or impediment mentioned"
  ],
  "risks": [
    "Explicit project or execution risk identified"
  ]
}

CRITICAL RULES:
- DO NOT hallucinate or invent information not present in the transcript.
- If an owner is not explicitly stated, set "owner": null.
- If a deadline is not explicitly stated, set "deadline": null. Whenever a deadline is mentioned, format it as YYYY-MM-DD (e.g., "2026-10-08").
- DEPENDENCY RULES:
  1. Set "dependency": null by default for ALL tasks.
  2. ONLY set a non-null dependency when the transcript explicitly states a prerequisite relationship between two tasks present in the extracted tasks list (e.g., "Task X must be completed before Task Y").
  3. NEVER infer or assume a dependency between tasks merely because they seem related (for example, NEVER infer that testing depends on implementation unless the transcript explicitly says "Testing depends on implementation").
  4. If the transcript states "A must happen before B", but B is NOT present as an extracted task (e.g. "Testing must be completed before deployment", but deployment is not a task), set dependency to null. Never assign the dependency to a different task.
  5. A task must NEVER list itself, a restatement of itself, or a sentence describing itself as its own dependency.
- If no decisions were made, set "decisions": [].
- If no tasks were assigned, set "tasks": [].
- If no blockers were mentioned, set "blockers": [].
- If no risks were identified, set "risks": [].
- Priority MUST be one of "LOW", "MEDIUM", or "HIGH". Default to "MEDIUM" if unclear.
- Output ONLY the raw JSON object. Do NOT add any extra text or conversational chatter.
"""


def sanitize_json_response(raw_text: str) -> str:
    """Removes markdown code block formatting (```json ... ```) if present."""
    text = raw_text.strip()
    if text.startswith("```"):
        # Find start of content after first line
        lines = text.splitlines()
        if len(lines) >= 2:
            # Drop the opening ``` or ```json line and closing ``` line
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            text = "\n".join(lines).strip()
    return text


class AIService:
    def __init__(
        self,
        base_url: str | None = None,
        model: str | None = None,
        timeout: int | None = None,
    ):
        self._base_url = base_url
        self._model = model
        self._timeout = timeout

    @property
    def base_url(self) -> str:
        url = self._base_url or settings.OLLAMA_BASE_URL
        return url.rstrip("/")

    @property
    def model(self) -> str:
        return self._model or settings.OLLAMA_MODEL

    @property
    def timeout(self) -> int:
        return self._timeout or settings.OLLAMA_TIMEOUT

    def analyze_transcript(self, transcript: str) -> AnalysisResult:
        """Communicates with local Ollama API to extract structured execution artifacts."""
        endpoint = f"{self.base_url}/api/chat"
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Meeting Transcript:\n{transcript}"},
            ],
            "stream": False,
            "options": {
                "temperature": 0,
                "num_predict": 512,
            },
        }

        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.post(endpoint, json=payload)
                response.raise_for_status()
                res_data = response.json()

        except httpx.ConnectError as exc:
            logger.error(f"Failed to connect to Ollama at {endpoint}: {exc}")
            raise AIServiceUnavailableException("Ollama service is unavailable") from exc
        except httpx.TimeoutException as exc:
            logger.error(f"Ollama request timed out after {self.timeout}s: {exc}")
            raise AIServiceTimeoutException("Ollama service request timed out") from exc
        except httpx.HTTPError as exc:
            logger.error(f"Ollama HTTP error: {exc}")
            raise AIServiceUnavailableException(f"Ollama service error: {exc}") from exc

        try:
            raw_content = res_data.get("message", {}).get("content", "")
            cleaned_content = sanitize_json_response(raw_content)
            parsed_json = json.loads(cleaned_content)
            validated_result = AnalysisResult.model_validate(parsed_json)
            return validated_result

        except (json.JSONDecodeError, ValidationError, AttributeError, KeyError) as exc:
            logger.error(f"Failed to parse or validate Ollama JSON response: {exc}")
            raise AIInvalidOutputException(f"Invalid AI extraction output: {exc}") from exc


ai_service = AIService()
