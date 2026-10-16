import asyncio
import json
from uuid import UUID

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from src.core.dependencies import Agent
from src.modules.chat.schemas import ChatRequest, ChatResponse
from src.modules.session.schemas import MessageCreate
from src.modules.session.repository import get_session
from src.modules.session.service import send_message
from src.share.database import Database

router = APIRouter(tags=["chat"])


def ndjson(event: dict) -> str:
    return json.dumps(event, ensure_ascii=False, separators=(",", ":")) + "\n"


@router.post("/{session_id}/chat/stream")
async def chat_stream(
    session_id: UUID, payload: ChatRequest, db: Database, agent: Agent
) -> StreamingResponse:
    async def events():
        event_queue: asyncio.Queue[dict] = asyncio.Queue()

        async def report_progress(stage: str):
            await event_queue.put({"type": "progress", "stage": stage})

        async def report_answer_token(text: str):
            await event_queue.put({"type": "token", "text": text})

        yield ndjson({"type": "progress", "stage": "analyzing"})
        task = asyncio.create_task(
            send_message(
                db,
                str(session_id),
                MessageCreate(content=payload.message, research=payload.research),
                agent,
                progress_callback=report_progress,
                answer_token_callback=report_answer_token,
            )
        )
        try:
            while not task.done() or not event_queue.empty():
                if event_queue.empty():
                    try:
                        event = await asyncio.wait_for(event_queue.get(), timeout=15)
                    except TimeoutError:
                        yield ndjson({"type": "keepalive"})
                        continue
                else:
                    event = event_queue.get_nowait()
                yield ndjson(event)

            result = await task
            response = ChatResponse(
                session_id=result.session_id,
                reply=result.assistant_message.content,
                research=result.research,
            )
            yield ndjson({"type": "complete", "data": response.model_dump(mode="json")})
        except HTTPException as error:
            message = error.detail if isinstance(error.detail, str) else "Chat request failed"
            yield ndjson({"type": "error", "message": message, "status": error.status_code})
        except asyncio.CancelledError:
            raise
        except Exception:
            yield ndjson({"type": "error", "message": "Chat service error", "status": 500})
        finally:
            if not task.done():
                task.cancel()
            await asyncio.gather(task, return_exceptions=True)

    return StreamingResponse(
        events(),
        media_type="application/x-ndjson",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",
        },
    )


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
