from fastapi import HTTPException
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from src.modules.session.models import ChatSession, utc_now


def get_session(db: Session, session_id: str) -> ChatSession:
    session = db.get(ChatSession, session_id)
    if session is None:
        raise HTTPException(404, "Session not found")
    return session


def list_sessions(db: Session, limit: int, offset: int) -> list[ChatSession]:
    return list(
        db.scalars(
            select(ChatSession)
            .order_by(ChatSession.updated_at.desc(), ChatSession.id)
            .limit(limit)
            .offset(offset)
        )
    )


def claim_version(db: Session, session_id: str, version: int) -> None:
    result = db.execute(
        update(ChatSession)
        .where(ChatSession.id == session_id, ChatSession.version == version)
        .values(version=version + 1, updated_at=utc_now())
    )
    if result.rowcount != 1:
        db.rollback()
        raise HTTPException(409, "Session changed while processing; reload and retry")
