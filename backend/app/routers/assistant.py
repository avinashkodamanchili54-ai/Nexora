from fastapi import APIRouter

from app.models.schemas import AssistantChatRequest, AssistantChatResponse
from app.services.assistant_service import assistant_service

router = APIRouter(prefix="/api/assistant", tags=["Krishi Sakhi Assistant"])


@router.post("/chat", response_model=AssistantChatResponse)
def chat_with_assistant(payload: AssistantChatRequest):
    return assistant_service.reply(payload)
