import logging
from collections.abc import Awaitable, Callable

from fastapi import HTTPException
from sqlalchemy.orm import Session

from src.core.agent import AgentService
from src.core.errors import AgentUnavailableError
from src.core.logger import error_fields, log_event
from src.modules.session.models import ChatMessage, ChatSession
from src.modules.session.repository import claim_version, get_session
from src.modules.session.schemas import MessageCreate, MessageRead, MessageResponse

async def send_message(
    db: Session,
    session_id: str | None,
    payload: MessageCreate,
    agent: AgentService,
    progress_callback: Callable[[str], Awaitable[None]] | None = None,
    answer_token_callback: Callable[[str], Awaitable[None]] | None = None,
) -> MessageResponse:
    content = payload.content.strip()
    if not content:
        raise HTTPException(422, "Message must not be blank")
    version, count = 0, 0
    history = []
    session = None
    if session_id is not None:
        session = db.get(ChatSession, session_id)
        if session is not None:
            version, count = session.version, len(session.messages)
            history = [
                {"role": m.role, "content": m.content}
                for m in session.messages[-agent.settings.max_history_messages :]
            ]
        db.rollback()  # Release the read transaction before waiting for the provider.
    log_event("chat.message.received", message="Đã nhận tin nhắn", session_id=session_id, research=payload.research)
    history.append({"role": "user", "content": content})
    try:
        if progress_callback:
            result = await agent.reply(
                history, payload.research, progress_callback, answer_token_callback
            )
        else:
            result = await agent.reply(history, payload.research)
    except AgentUnavailableError as error:
        log_event("agent.run.failed", level=logging.ERROR, message="Agent không khả dụng", **error_fields(error))
        raise HTTPException(503, str(error)) from error
    except TimeoutError as error:
        log_event("agent.run.failed", level=logging.ERROR, message="Agent xử lý quá thời hạn", **error_fields(error))
        raise HTTPException(504, "AI request timed out; retry your message") from error
    except Exception as error:
        # Do not log provider exceptions containing prompts, keys, or response bodies.
        code = getattr(error, "code", None) or getattr(error.__cause__, "code", None)
        log_event("dependency.request.failed", level=logging.ERROR, message="Gọi AI thất bại", dependency="llm", error_type=type(error).__name__, provider_status=code)
        if code == 404:
            raise HTTPException(
                502,
                "AI model not available; check GEMINI_MODEL, GEMINI_FALLBACK_MODEL "
                "and GOOGLE_CLOUD_LOCATION",
            ) from error
        if code == 429:
            raise HTTPException(
                503,
                "Gemini rate limit or quota exceeded; check AI Studio quota and retry later",
                headers={"Retry-After": "10"},
            ) from error
        if code == 503:
            raise HTTPException(
                503,
                "Gemini temporarily unavailable after retries and model fallback; retry later",
                headers={"Retry-After": "10"},
            ) from error
        raise HTTPException(502, "AI provider request failed") from error
    if session is None:
        session = (
            ChatSession(title=content[:200])
            if session_id is None
            else ChatSession(id=session_id, title=content[:200])
        )
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
        updated_research = result.research.model_dump(mode="json")
        previous_research = session.research or {}
        if not updated_research.get("reasoning_map"):
            updated_research["reasoning_map"] = previous_research.get("reasoning_map")
        if updated_research.get("reasoning_map") == previous_research.get("reasoning_map"):
            for key in (
                "experiment_design", "experiment_direction_id", "experiment_context_hash"
            ):
                if previous_research.get(key) is not None:
                    updated_research[key] = previous_research[key]
        session.research = updated_research
    if progress_callback:
        await progress_callback("saving_response")
    db.commit()
    log_event("chat.response.completed", message="Đã lưu phản hồi chat", session_id=str(session_id))
    return MessageResponse(
        session_id=session_id,
        user_message=MessageRead.model_validate(user),
        assistant_message=MessageRead.model_validate(assistant),
        research=session.research,
    )
