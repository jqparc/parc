import os

from dotenv import load_dotenv
from fastapi import HTTPException

from core.config import settings
from schemas.chat_schema import ChatMessage

load_dotenv()

GEMINI_SYSTEM_PROMPT = """
당신은 경제 뉴스 AI 비서입니다.
역할:
- 경제 뉴스, 거시 지표, 금리, 환율, 주식시장 흐름을 사용자가 이해하기 쉽게 설명합니다.
- 단정적인 매수/매도 조언은 하지 않고, 핵심 요인과 리스크, 반대 시나리오를 함께 제시합니다.
- 최신 사실을 확신할 수 없으면 추측하지 말고 확인이 필요하다고 말합니다.
- 한국어로 간결하지만 충분한 맥락을 담아 답합니다.
"""


def get_gemini_api_key() -> str | None:
    return settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY")


def build_messages(messages: list[ChatMessage]) -> list[dict]:
    return [
        {"role": "system", "content": GEMINI_SYSTEM_PROMPT.strip()},
        *[
            {"role": message.role, "content": message.content}
            for message in messages
        ],
    ]


def parse_gemini_error(error: Exception) -> tuple[int, str]:
    status_code = getattr(error, "status_code", None) or 502
    body = getattr(error, "body", None)

    if isinstance(body, dict):
        detail = body.get("error", body)
        if isinstance(detail, dict):
            message = detail.get("message") or str(detail)
            code = detail.get("code")
        else:
            message = str(detail)
            code = None
    else:
        message = str(error)
        code = None

    lower_message = message.lower()
    if status_code in {401, 403}:
        return status_code, "Gemini API key is invalid or not allowed. Check GEMINI_API_KEY."
    if code in {"quota_exceeded", "insufficient_quota"} or "quota" in lower_message:
        return 429, "Gemini API quota exceeded. Check Google AI Studio API usage limits."
    if status_code == 404 or "model" in lower_message:
        return 400, "Gemini model is not available. Check GEMINI_MODEL."

    return 502, f"Gemini API error: {message}"


async def ask_gemini(messages: list[ChatMessage]) -> str:
    api_key = get_gemini_api_key()
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not configured.")

    try:
        from openai import AsyncOpenAI
    except ModuleNotFoundError as exc:
        raise HTTPException(
            status_code=500,
            detail="openai package is not installed. Install it with: pip install openai",
        ) from exc

    client = AsyncOpenAI(
        api_key=api_key,
        base_url=settings.GEMINI_BASE_URL,
    )

    try:
        response = await client.chat.completions.create(
            model=settings.GEMINI_MODEL,
            messages=build_messages(messages),
        )
    except Exception as exc:
        status_code, message = parse_gemini_error(exc)
        raise HTTPException(status_code=status_code, detail=message) from exc

    reply = response.choices[0].message.content if response.choices else None
    if not reply:
        raise HTTPException(status_code=502, detail="Gemini API returned an empty response.")

    return reply
