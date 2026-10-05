from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from src.core.agent import AgentService
from src.core.config import Settings, get_settings
from src.core.logger import configure_logging
from src.modules.chat.router import router as chat_router
from src.modules.research.router import router as research_router
from src.modules.session.router import router as session_router
from src.share.database import Base, create_database


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    configure_logging(settings.log_level)
    engine, db_factory = create_database(settings.database_url)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        Base.metadata.create_all(engine)
        yield
        engine.dispose()

    app = FastAPI(title=settings.app_name, lifespan=lifespan)
    app.state.db_factory = db_factory
    app.state.agent = AgentService(settings)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_methods=["GET", "POST", "DELETE"],
        allow_headers=["Content-Type"],
    )
    app.include_router(chat_router, prefix="/api/v1")
    app.include_router(session_router, prefix="/api/v1")
    app.include_router(research_router, prefix="/api/v1")

    @app.get("/health", tags=["health"])
    def health(request: Request):
        with request.app.state.db_factory() as db:
            db.execute(text("SELECT 1"))
        return {"status": "ok", "ai_configured": bool(settings.google_api_key.get_secret_value())}

    return app


app = create_app()
