from contextlib import asynccontextmanager

from fastapi import FastAPI
from langgraph.checkpoint.sqlite import SqliteSaver

from src.config import DATABASE_PATH
from src.controllers.chat_controller import ChatController
from src.repositories.memory_repository import SQLiteMemoryRepository
from src.services.agent_service import AgentService
from src.views.chat_view import router as chat_router
from src.views.health_view import router as health_router


memory_repository = SQLiteMemoryRepository(DATABASE_PATH)


@asynccontextmanager
async def lifespan(app: FastAPI):
    memory_repository.initialize()
    with SqliteSaver.from_conn_string(str(DATABASE_PATH)) as checkpointer:
        agent_service = AgentService(checkpointer, memory_repository)
        app.state.chat_controller = ChatController(agent_service)
        yield


app = FastAPI(title="Ideally Deep Agent API", lifespan=lifespan)
app.include_router(health_router)
app.include_router(chat_router)
