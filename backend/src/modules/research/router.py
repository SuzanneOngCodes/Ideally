import hashlib
import json
import logging
from uuid import UUID

from fastapi import APIRouter, HTTPException

from src.core.dependencies import Agent
from src.core.errors import AgentUnavailableError
from src.core.logger import log_event
from src.modules.research.schemas import ExperimentDesign, ExperimentRequest, ResearchResult
from src.modules.session.repository import claim_version, get_session
from src.share.database import Database

router = APIRouter(prefix="/research", tags=["research"])


@router.get("/{session_id}", response_model=ResearchResult | None)
def read_research(session_id: UUID, db: Database):
    return get_session(db, str(session_id)).research


@router.post("/{session_id}/experiment", response_model=ExperimentDesign)
async def design_experiment(
    session_id: UUID, payload: ExperimentRequest, db: Database, agent: Agent
):
    session = get_session(db, str(session_id))
    research = session.research or {}
    reasoning_map = research.get("reasoning_map")
    if not reasoning_map:
        raise HTTPException(409, "Build a research reasoning map before designing an experiment")

    context_hash = hashlib.sha256(
        json.dumps(
            {"reasoning_map": reasoning_map, "request": payload.model_dump(exclude={"regenerate"})},
            sort_keys=True,
            ensure_ascii=False,
        ).encode("utf-8")
    ).hexdigest()
    if not payload.regenerate and research.get("experiment_context_hash") == context_hash:
        cached = research.get("experiment_design")
        if cached:
            return ExperimentDesign.model_validate(cached)

    version = session.version
    db.rollback()  # Do not hold a database transaction while waiting for Gemini.
    try:
        design = await agent.design_experiment(reasoning_map, payload)
    except AgentUnavailableError as error:
        raise HTTPException(503, str(error)) from error
    except TimeoutError as error:
        raise HTTPException(504, "Experiment design timed out; retry") from error
    except Exception as error:
        code = getattr(error, "code", None) or getattr(error.__cause__, "code", None)
        log_event(
            "experiment.design.failed",
            level=logging.ERROR,
            error_type=type(error).__name__,
            provider_status=code,
        )
        if code in (429, 503):
            raise HTTPException(503, "Gemini temporarily unavailable; retry later") from error
        raise HTTPException(502, "Experiment design provider request failed") from error

    claim_version(db, str(session_id), version)
    session = get_session(db, str(session_id))
    updated_research = dict(session.research or {})
    updated_research["experiment_design"] = design.model_dump(mode="json")
    updated_research["experiment_direction_id"] = payload.direction_id or None
    updated_research["experiment_context_hash"] = context_hash
    session.research = updated_research
    db.commit()
    return design
