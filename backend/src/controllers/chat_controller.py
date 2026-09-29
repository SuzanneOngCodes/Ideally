import hashlib

from src.models.chat import ChatRequest, ChatResponse
from src.services.agent_service import AgentService


class ChatController:
    def __init__(self, agent_service: AgentService) -> None:
        self.agent_service = agent_service

    def chat(self, request: ChatRequest) -> ChatResponse:
        thread_key = hashlib.sha256(
            f"{request.user_id}:{request.thread_id}".encode("utf-8")
        ).hexdigest()
        response = self.agent_service.reply(
            user_id=request.user_id,
            message=request.message,
            thread_key=thread_key,
        )
        return ChatResponse(
            user_id=request.user_id,
            thread_id=request.thread_id,
            response=response,
        )
