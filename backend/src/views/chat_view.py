from fastapi import APIRouter, HTTPException, Request

from src.controllers.chat_controller import ChatController
from src.models.chat import ChatRequest, ChatResponse
from src.services.agent_service import AgentConfigurationError, AgentResponseError


router = APIRouter(prefix="/api", tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
def chat(request: Request, payload: ChatRequest) -> ChatResponse:
    controller: ChatController = request.app.state.chat_controller
    try:
        return controller.chat(payload)
    except AgentConfigurationError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except AgentResponseError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error
