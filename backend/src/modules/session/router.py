from uuid import UUID

from fastapi import APIRouter, Query, Response

from src.core.dependencies import Agent
from src.modules.session import repository, service
from src.modules.session.models import ChatSession
from src.modules.session.schemas import (
    MessageCreate,
    MessageResponse,
    SessionCreate,
    SessionDetail,
    SessionRead,
)
from src.share.database import Database

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("", response_model=SessionRead, status_code=201)
def create_session(payload: SessionCreate, db: Database):
    title = payload.title.strip()
    session = ChatSession(title=title or "Cuộc trò chuyện mới")
    db.add(session)
    db.commit()
    return session


@router.get("", response_model=list[SessionRead])
def list_sessions(db: Database, limit: int = Query(50, ge=1, le=100), offset: int = Query(0, ge=0)):
    return repository.list_sessions(db, limit, offset)


@router.get("/{session_id}", response_model=SessionDetail)
def read_session(session_id: UUID, db: Database):
    return repository.get_session(db, str(session_id))


@router.delete("/{session_id}", status_code=204)
def delete_session(session_id: UUID, db: Database):
    db.delete(repository.get_session(db, str(session_id)))
    db.commit()
    return Response(status_code=204)


@router.post("/{session_id}/messages", response_model=MessageResponse)
async def send_message(
    session_id: UUID,
    payload: MessageCreate,
    db: Database,
    agent: Agent,
):
    return await service.send_message(db, str(session_id), payload, agent)
