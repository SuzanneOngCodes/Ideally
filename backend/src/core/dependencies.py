from typing import Annotated

from fastapi import Depends, Request

from src.core.agent import AgentService


def get_agent(request: Request) -> AgentService:
    return request.app.state.agent


Agent = Annotated[AgentService, Depends(get_agent)]
