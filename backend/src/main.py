import logging
import os
import re
from contextlib import asynccontextmanager
from time import perf_counter
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from src.core.agent import AgentService
from src.core.config import Settings, get_settings
from src.core.logger import configure_logging, error_fields, log_context, log_event
from src.modules.auditor.router import router as auditor_router
from src.modules.auditor.service import CitationAuditService
from src.modules.chat.router import router as chat_router
from src.modules.evidence.router import router as evidence_router
from src.modules.evidence.service import EvidenceSearchService
from src.modules.research.router import router as research_router
from src.modules.session.router import router as session_router
from src.share.database import Base, create_database


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    configure_logging(
        settings.log_level,
        service=os.getenv("SERVICE_NAME", "ideally-api"),
        secrets=(
            settings.google_api_key.get_secret_value(),
            settings.tavily_api_key.get_secret_value(),
            settings.crawl4ai_api_key.get_secret_value(),
        ),
    )
    engine, db_factory = create_database(settings.database_url)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        Base.metadata.create_all(engine)
        yield
        engine.dispose()

    app = FastAPI(title=settings.app_name, lifespan=lifespan)

    @app.middleware("http")
    async def request_logging(request: Request, call_next):
        supplied = request.headers.get("X-Trace-ID", "")
        trace_id = supplied if re.fullmatch(r"[A-Za-z0-9._-]{1,128}", supplied) else f"tr_{uuid4().hex}"
        token = log_context.set({"trace_id": trace_id})
        started = perf_counter()
        log_event("http.request.started", message="Bắt đầu xử lý request", method=request.method, path=request.url.path)
        try:
            response = await call_next(request)
            response.headers["X-Trace-ID"] = trace_id
            log_event(
                "http.request.completed",
                message="Request hoàn tất",
                status_code=response.status_code,
                duration_ms=round((perf_counter() - started) * 1000, 2),
            )
            return response
        except Exception as error:
            log_event(
                "http.request.failed",
                message="Request thất bại",
                level=logging.ERROR,
                **error_fields(error),
                duration_ms=round((perf_counter() - started) * 1000, 2),
            )
            return JSONResponse(
                status_code=500,
                content={"detail": "Internal server error", "trace_id": trace_id},
                headers={"X-Trace-ID": trace_id},
            )
        finally:
            log_context.reset(token)

    app.state.db_factory = db_factory
    app.state.agent = AgentService(settings)
    app.state.evidence = EvidenceSearchService(settings)
    app.state.auditor = CitationAuditService(settings)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_methods=["GET", "POST", "DELETE"],
        allow_headers=["Content-Type", "X-Trace-ID"],
        expose_headers=["X-Trace-ID"],
    )
    app.include_router(chat_router, prefix="/api/v1")
    app.include_router(auditor_router, prefix="/api/v1")
    app.include_router(session_router, prefix="/api/v1")
    app.include_router(research_router, prefix="/api/v1")
    app.include_router(evidence_router, prefix="/api/v1")

    @app.get("/health", tags=["health"])
    def health(request: Request):
        with request.app.state.db_factory() as db:
            db.execute(text("SELECT 1"))
        return {
            "status": "ok",
            "ai_configured": bool(settings.google_api_key.get_secret_value()),
        }

    return app


app = create_app()
