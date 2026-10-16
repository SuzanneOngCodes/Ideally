from uuid import UUID

from fastapi import APIRouter
from src.core.dependencies import Agent
from src.modules.chat.schemas import ChatRequest, ChatResponse
from src.modules.session.schemas import MessageCreate
from src.modules.session.repository import get_session
from src.modules.session.service import send_message
from src.share.database import Database

router = APIRouter(tags=["chat"])


@router.post("/{session_id}/chat", response_model=ChatResponse)
async def chat(session_id: UUID, payload: ChatRequest, db: Database, agent: Agent) -> ChatResponse:
    """Reply in the client-selected session, creating it on the first message."""
    result = await send_message(
        db,
        str(session_id),
        MessageCreate(content=payload.message, research=payload.research),
        agent,
    )
    return ChatResponse(
        session_id=result.session_id,
        reply=result.assistant_message.content,
        research=result.research,
    )


@router.post("/chat", response_model=ChatResponse)
async def legacy_chat(payload: ChatRequest, db: Database, agent: Agent) -> ChatResponse:
    """Keep the original endpoint available for existing clients."""
    if payload.session_id:
        get_session(db, str(payload.session_id))
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
