from fastapi import APIRouter

from src.core.dependencies import Agent
from src.modules.chat.schemas import ChatRequest, ChatResponse
from src.modules.session.schemas import MessageCreate
from src.modules.session.service import send_message
from src.share.database import Database

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
async def chat(payload: ChatRequest, db: Database, agent: Agent) -> ChatResponse:
    """Reply with Gemini; create a session if no session_id is provided."""
    result = await send_message(
        db,
        str(payload.session_id) if payload.session_id else None,
        MessageCreate(content=payload.message, research=payload.research),
        agent,
    )
    return ChatResponse(
        session_id=result.session_id,
        reply=result.assistant_message.content,
        research=result.research,
    )
