from uuid import UUID

from fastapi import APIRouter, HTTPException, Request, status
from sqlalchemy import select

from src.modules.auditor.models import SessionAudit
from src.modules.auditor.schemas import AuditRequestPayload
from src.modules.session.models import utc_now
from src.modules.session.repository import get_session
from src.share.database import Database

router = APIRouter()


def _research_text(research: dict) -> str:
    parts = [research.get("title", ""), research.get("summary", "")]
    reasoning_map = research.get("reasoning_map") or {}
    for card_id in ("problem", "evidence", "research_question", "hypothesis", "experiment"):
        card = reasoning_map.get(card_id) or {}
        parts.extend(
            value
            for value in (
                card.get("title"),
                card.get("summary"),
                card.get("explanation"),
                card.get("methodology"),
            )
            if value
        )
    for finding in research.get("findings") or []:
        parts.extend(value for value in (finding.get("title"), finding.get("description")) if value)
    return "\n\n".join(part for part in parts if part)


def _session_text(session) -> str:
    research = session.research or {}
    topic = research.get("title") or session.title
    parts = [f"Session topic: {topic}"]
    research_text = _research_text(research)
    if research_text.strip():
        parts.append(f"Saved research:\n{research_text[:20000]}")

    recent_messages = [
        f"{message.role}: {message.content}"
        for message in session.messages[-20:]
        if message.role in {"user", "assistant"}
    ]
    if recent_messages:
        conversation = "\n\n".join(recent_messages)[-28000:]
        parts.append(f"Recent session conversation:\n{conversation}")
    return "\n\n".join(parts).strip()[:50000]


@router.post("/advisor/audit-citations")
async def handle_citation_audit(
    request: Request, payload: AuditRequestPayload, db: Database
):
    session = None
    if payload.session_id:
        session = get_session(db, str(payload.session_id))
        db.rollback()

    # Saved session context takes precedence over any stale proposal still mounted in the UI.
    brief_data = None
    if payload.brief and session is None:
        brief_data = payload.brief.model_dump(mode="json")
    target_text = payload.text
    if payload.source == "brief" and session is not None:
        target_text = _session_text(session)
        if not target_text.strip():
            raise HTTPException(
                status_code=409,
                detail="This session has no saved research to audit yet",
            )

    domain = payload.domain
    if session is not None and payload.source == "brief":
        research = session.research or {}
        domain = (
            research.get("domain")
            or research.get("targetDomain")
            or research.get("title")
            or session.title
        )

    try:
        result = await request.app.state.auditor.audit_text(
            text=target_text,
            brief=brief_data,
            domain=domain,
        )
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Citation audit service failed; retry the audit",
        ) from error

    if payload.session_id:
        report = result.get("report")
        if report:
            session = get_session(db, str(payload.session_id))
            session.updated_at = utc_now()
            db.add(SessionAudit(session_id=str(payload.session_id), report=report))
            db.commit()
    result["session_id"] = str(payload.session_id) if payload.session_id else None
    return result


@router.get("/sessions/{session_id}/audits")
def list_session_audits(session_id: UUID, db: Database):
    get_session(db, str(session_id))
    rows = db.scalars(
        select(SessionAudit)
        .where(SessionAudit.session_id == str(session_id))
        .order_by(SessionAudit.created_at.desc())
        .limit(20)
    )
    return {"audits": [row.report for row in rows]}
