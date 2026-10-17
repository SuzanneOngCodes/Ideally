import hashlib
import json
import logging
from uuid import UUID, uuid4

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from src.core.dependencies import Agent
from src.core.errors import AgentUnavailableError
from src.core.logger import log_event
from src.modules.research.schemas import (
    AgUiRunInput,
    ExperimentDesign,
    ExperimentRequest,
    ProposalBrief,
    ProposalBriefRequest,
    ReasoningMap,
    ResearchResult,
    build_session_mindmap_ui,
)
from src.modules.session.repository import claim_version, get_session
from src.share.database import Database

router = APIRouter(prefix="/research", tags=["research"])


def _context_hash(messages: list[dict], research: dict) -> str:
    return hashlib.sha256(
        json.dumps(
            {
                "messages": messages,
                "research": {
                    key: value
                    for key, value in research.items()
                    if key
                    not in {
                        "proposal_brief",
                        "proposal_brief_context_hash",
                        "defense_lab",
                    }
                },
            },
            sort_keys=True,
            ensure_ascii=False,
            default=str,
        ).encode("utf-8")
    ).hexdigest()


async def _generate_proposal_brief(
    session_id: UUID, payload: bool, db: Database, agent: Agent
) -> ProposalBrief:
    session = get_session(db, str(session_id))
    research = dict(session.research or {})
    reasoning_map = research.get("reasoning_map")
    if not reasoning_map:
        raise HTTPException(
            409, "Build a research reasoning map before generating a proposal brief"
        )
    messages = [{"role": message.role, "content": message.content} for message in session.messages]
    context_hash = _context_hash(messages, research)
    if not payload and research.get("proposal_brief_context_hash") == context_hash:
        cached = research.get("proposal_brief")
        if cached:
            cached_brief = ProposalBrief.model_validate(cached)
            if (
                cached_brief.researchDiagram.format == "mermaid-mindmap"
                and cached_brief.researchDiagram.mermaid
            ):
                return cached_brief
            upgraded = cached_brief.model_copy(
                update={
                    "researchDiagram": build_session_mindmap_ui(
                        ReasoningMap.model_validate(reasoning_map),
                        cached_brief,
                        research,
                        messages,
                    )
                }
            )
            research["proposal_brief"] = upgraded.model_dump(mode="json")
            session.research = research
            db.commit()
            return upgraded

    version = session.version
    db.rollback()  # Avoid holding a transaction while the model synthesizes the brief.
    try:
        brief = await agent.create_proposal_brief(messages, research)
    except ValueError as error:
        raise HTTPException(409, str(error)) from error
    except AgentUnavailableError as error:
        raise HTTPException(503, str(error)) from error
    except TimeoutError as error:
        raise HTTPException(504, "Proposal brief generation timed out; retry") from error
    except Exception as error:
        code = getattr(error, "code", None) or getattr(error.__cause__, "code", None)
        log_event(
            "proposal_brief.generation.failed",
            level=logging.ERROR,
            error_type=type(error).__name__,
            provider_status=code,
        )
        if code in (429, 503):
            raise HTTPException(503, "Gemini temporarily unavailable; retry later") from error
        raise HTTPException(502, "Proposal brief provider request failed") from error

    # The server owns the visual structure so every producer, including test/fallback
    # providers, receives the same concise tree and renderer contract.
    brief = brief.model_copy(
        update={
            "researchDiagram": build_session_mindmap_ui(
                ReasoningMap.model_validate(reasoning_map),
                brief,
                research,
                messages,
            )
        }
    )
    claim_version(db, str(session_id), version)
    session = get_session(db, str(session_id))
    updated_research = dict(session.research or {})
    updated_research["proposal_brief"] = brief.model_dump(mode="json")
    updated_research["proposal_brief_context_hash"] = context_hash
    session.research = updated_research
    db.commit()
    return brief


def _sse(event: dict) -> str:
    return f"data: {json.dumps(event, ensure_ascii=False, separators=(',', ':'))}\n\n"


def _diagram_activity(brief: ProposalBrief, status: str) -> dict:
    diagram = brief.researchDiagram
    return {
        "kind": "mermaid-mindmap",
        "status": status,
        "source": "active-session",
        "type": diagram.type,
        "format": diagram.format,
        "title": diagram.title,
        "mermaid": diagram.mermaid or "",
        "nodes": [node.model_dump(mode="json") for node in diagram.nodes],
        "mindmapNodes": [node.model_dump(mode="json") for node in diagram.mindmap_nodes],
        "sourceCount": sum(node.source_count for node in diagram.nodes),
    }


@router.get("/{session_id}", response_model=ResearchResult | None)
def read_research(session_id: UUID, db: Database):
    return get_session(db, str(session_id)).research


@router.get("/{session_id}/brief", response_model=ProposalBrief)
def read_cached_proposal_brief(session_id: UUID, db: Database):
    """Read the persisted brief without invoking the model.

    A 404 means this session has no reusable brief for its current research
    context; the client can then start the AG-UI generation stream.
    """
    session = get_session(db, str(session_id))
    research = dict(session.research or {})
    cached = research.get("proposal_brief")
    if not cached:
        raise HTTPException(404, "No cached proposal brief for this session")

    messages = [{"role": message.role, "content": message.content} for message in session.messages]
    cached_context_hash = research.get("proposal_brief_context_hash")
    if cached_context_hash and cached_context_hash != _context_hash(messages, research):
        raise HTTPException(404, "The cached proposal brief is stale")

    try:
        brief = ProposalBrief.model_validate(cached)
    except ValueError as error:
        raise HTTPException(409, "The cached proposal brief is invalid") from error

    reasoning_map = research.get("reasoning_map")
    if (
        reasoning_map
        and (brief.researchDiagram.format != "mermaid-mindmap" or not brief.researchDiagram.mermaid)
    ):
        brief = brief.model_copy(
            update={
                "researchDiagram": build_session_mindmap_ui(
                    ReasoningMap.model_validate(reasoning_map),
                    brief,
                    research,
                    messages,
                )
            }
        )
        research["proposal_brief"] = brief.model_dump(mode="json")
        session.research = research
        db.commit()
    return brief


@router.post("/{session_id}/brief", response_model=ProposalBrief)
async def create_proposal_brief(
    session_id: UUID, payload: ProposalBriefRequest, db: Database, agent: Agent
):
    return await _generate_proposal_brief(session_id, payload.regenerate, db, agent)


@router.post("/{session_id}/brief/stream")
async def create_proposal_brief_stream(
    session_id: UUID, payload: AgUiRunInput, db: Database, agent: Agent
):
    """Stream proposal generation and the Mermaid diagram through AG-UI events."""
    thread_id = payload.threadId or str(session_id)
    run_id = payload.runId or str(uuid4())

    async def events():
        yield _sse(
            {
                "type": "RUN_STARTED",
                "threadId": thread_id,
                "runId": run_id,
                "protocolVersion": payload.protocolVersion or "1.0",
            }
        )
        yield _sse({"type": "STEP_STARTED", "stepName": "proposal_brief"})
        yield _sse(
            {
                "type": "ACTIVITY_SNAPSHOT",
                "messageId": f"{run_id}:proposal-mindmap",
                "activityType": "MERMAID_MINDMAP",
                "content": {
                    "kind": "mermaid-mindmap",
                    "status": "generating",
                    "source": "active-session",
                    "title": "Session mindmap",
                    "mermaid": "",
                },
                "replace": True,
            }
        )
        try:
            brief = await _generate_proposal_brief(session_id, payload.regenerate, db, agent)
            yield _sse(
                {
                    "type": "ACTIVITY_SNAPSHOT",
                    "messageId": f"{run_id}:proposal-mindmap",
                    "activityType": "MERMAID_MINDMAP",
                    "content": _diagram_activity(brief, "ready"),
                    "replace": True,
                }
            )
            yield _sse(
                {
                    "type": "STATE_SNAPSHOT",
                    "snapshot": {
                        "proposalBrief": brief.model_dump(mode="json"),
                        "researchDiagram": brief.researchDiagram.model_dump(mode="json"),
                    },
                }
            )
            yield _sse({"type": "STEP_FINISHED", "stepName": "proposal_brief"})
            yield _sse(
                {
                    "type": "RUN_FINISHED",
                    "threadId": thread_id,
                    "runId": run_id,
                    "outcome": {"type": "success"},
                }
            )
        except HTTPException as error:
            yield _sse(
                {
                    "type": "RUN_ERROR",
                    "message": (
                        error.detail
                        if isinstance(error.detail, str)
                        else "Proposal brief failed"
                    ),
                    "code": str(error.status_code),
                }
            )
        except Exception:
            yield _sse(
                {
                    "type": "RUN_ERROR",
                    "message": "Proposal brief stream failed",
                    "code": "500",
                }
            )

    return StreamingResponse(
        events(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no"},
    )


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
