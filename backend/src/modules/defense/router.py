from uuid import UUID

from fastapi import APIRouter, HTTPException, Request
from sqlalchemy.orm import Session

from src.core.errors import AgentUnavailableError
from src.modules.defense.schemas import (
    DefenseEvaluation,
    DefenseProbesResponse,
    EvaluateDefenseRequest,
    GenerateDefenseProbesRequest,
)
from src.modules.session.models import utc_now
from src.modules.session.repository import claim_version, get_session
from src.share.database import Database

router = APIRouter(prefix="/defense", tags=["defense-lab"])


def _saved_research(db: Session, session_id: UUID | None) -> dict | None:
    if session_id is None:
        return None
    session = get_session(db, str(session_id))
    return session.research


def _service(request: Request):
    return request.app.state.defense


def _handle_model_error(error: Exception) -> HTTPException:
    if isinstance(error, AgentUnavailableError):
        return HTTPException(503, str(error))
    if isinstance(error, TimeoutError):
        return HTTPException(504, "Defense Lab evaluation timed out; retry")
    code = getattr(error, "code", None) or getattr(error.__cause__, "code", None)
    if code == 429:
        return HTTPException(503, "Gemini rate limit or quota exceeded; retry later")
    if code == 404:
        return HTTPException(502, "Defense model not available; check model and location settings")
    return HTTPException(502, "Defense Lab AI provider request failed")


@router.post("/probes", response_model=DefenseProbesResponse)
async def generate_probes(
    payload: GenerateDefenseProbesRequest,
    request: Request,
    db: Database,
) -> DefenseProbesResponse:
    version = None
    if payload.session_id is not None:
        session = get_session(db, str(payload.session_id))
        version = session.version
        saved_research = session.research
    else:
        saved_research = None
    db.rollback()
    try:
        result = await _service(request).generate_probes(payload.brief, saved_research)
        if payload.session_id is not None and version is not None:
            claim_version(db, str(payload.session_id), version)
            session = get_session(db, str(payload.session_id))
            research = dict(session.research or {})
            research["defense_lab"] = {
                "brief_id": payload.brief.get("id", ""),
                "probes": [probe.model_dump(mode="json") for probe in result.probes],
            }
            session.research = research
            session.updated_at = utc_now()
            db.commit()
            result.brief_id = payload.brief.get("id")
        return result
    except HTTPException:
        raise
    except Exception as error:
        raise _handle_model_error(error) from error


@router.post("/evaluate", response_model=DefenseEvaluation)
async def evaluate_defense(
    payload: EvaluateDefenseRequest,
    request: Request,
    db: Database,
) -> DefenseEvaluation:
    saved_research = _saved_research(db, payload.session_id)
    db.rollback()
    try:
        result = await _service(request).evaluate_defense(
            payload.brief,
            payload.probe,
            payload.answer,
            saved_research,
        )
        if payload.session_id is not None:
            session = get_session(db, str(payload.session_id))
            research = dict(session.research or {})
            defense_lab = dict(research.get("defense_lab") or {})
            probes = list(defense_lab.get("probes") or [])
            for index, saved_probe in enumerate(probes):
                if saved_probe.get("id") == payload.probe.id:
                    probes[index] = {
                        **saved_probe,
                        **payload.probe.model_dump(mode="json"),
                        "userDefenseAnswer": payload.answer,
                        "feedback": result.model_dump(mode="json"),
                    }
                    break
            defense_lab["probes"] = probes
            research["defense_lab"] = defense_lab
            session.research = research
            session.updated_at = utc_now()
            db.commit()
        return result
    except HTTPException:
        raise
    except Exception as error:
        raise _handle_model_error(error) from error


@router.get("/probes/{session_id}", response_model=DefenseProbesResponse)
def read_saved_probes(session_id: UUID, db: Database) -> DefenseProbesResponse:
    session = get_session(db, str(session_id))
    defense_lab = (session.research or {}).get("defense_lab") or {}
    probes = defense_lab.get("probes") or []
    if len(probes) != 3:
        raise HTTPException(404, "No cached defense probes for this session")
    try:
        return DefenseProbesResponse(
            probes=probes,
            brief_id=defense_lab.get("brief_id"),
        )
    except ValueError as error:
        raise HTTPException(409, "The cached defense probes are invalid") from error
