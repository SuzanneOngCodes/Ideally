from uuid import UUID

from fastapi import APIRouter

from src.modules.research.schemas import ResearchResult
from src.modules.session.repository import get_session
from src.share.database import Database

router = APIRouter(prefix="/research", tags=["research"])


@router.get("/{session_id}", response_model=ResearchResult | None)
def read_research(session_id: UUID, db: Database):
    return get_session(db, str(session_id)).research
