import logging

from fastapi import HTTPException
from sqlalchemy.orm import Session

from src.core.agent import AgentService
from src.core.errors import AgentUnavailableError
from src.modules.session.models import ChatMessage, ChatSession
from src.modules.session.repository import claim_version, get_session
from src.modules.session.schemas import MessageCreate, MessageRead, MessageResponse

logger = logging.getLogger(__name__)


async def send_message(
    db: Session, session_id: str | None, payload: MessageCreate, agent: AgentService
) -> MessageResponse:
    content = payload.content.strip()
    if not content:
        raise HTTPException(422, "Message must not be blank")
    version, count = 0, 0
    history = []
    if session_id is not None:
        session = get_session(db, session_id)
        version, count = session.version, len(session.messages)
        history = [
            {"role": m.role, "content": m.content}
            for m in session.messages[-agent.settings.max_history_messages :]
        ]
        db.rollback()  # Release the read transaction before waiting for the provider.
    history.append({"role": "user", "content": content})
    try:
        result = await agent.reply(history, payload.research)
    except AgentUnavailableError as error:
        raise HTTPException(503, str(error)) from error
    except TimeoutError as error:
        raise HTTPException(504, "AI request timed out; retry your message") from error
    except Exception as error:
        # Do not log provider exceptions containing prompts, keys, or response bodies.
        logger.error("AI request failed: %s", type(error).__name__)
        code = getattr(error, "code", None) or getattr(error.__cause__, "code", None)
        if code == 404:
            raise HTTPException(
                502, "AI model not available; check GEMINI_MODEL and GEMINI_FALLBACK_MODEL"
            ) from error
        if code in (429, 503):
            raise HTTPException(
                503, "AI provider busy or rate limited; retry your message"
            ) from error
        raise HTTPException(502, "AI provider request failed") from error
    if session_id is None:
        session = ChatSession(title=content[:200])
        db.add(session)
        db.flush()
        session_id = session.id
    else:
        claim_version(db, session_id, version)
        session = get_session(db, session_id)
    user = ChatMessage(session_id=session_id, sequence=count, role="user", content=content)
    assistant = ChatMessage(
        session_id=session_id, sequence=count + 1, role="assistant", content=result.answer
    )
    db.add_all([user, assistant])
    if count == 0:
        session.title = content[:200]
    if result.research is not None:
        session.research = result.research.model_dump(mode="json")
    db.commit()
    return MessageResponse(
        session_id=session_id,
        user_message=MessageRead.model_validate(user),
        assistant_message=MessageRead.model_validate(assistant),
        research=session.research,
    )
