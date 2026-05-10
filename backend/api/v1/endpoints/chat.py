from fastapi import APIRouter

from schemas.chat_schema import ChatRequest, ChatResponse
from services.gemini_service import ask_gemini, is_gemini_configured

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def create_chat_response(chat_request: ChatRequest):
    reply = await ask_gemini(chat_request.messages)
    return {"reply": reply}


@router.post("/gemini/chat", response_model=ChatResponse)
async def create_gemini_chat_response(chat_request: ChatRequest):
    reply = await ask_gemini(chat_request.messages)
    return {"reply": reply}


@router.get("/gemini/status")
async def get_gemini_status():
    return {"configured": is_gemini_configured()}
