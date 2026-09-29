from typing import Annotated

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    user_id: Annotated[str, Field(min_length=1, max_length=128)]
    thread_id: Annotated[str, Field(min_length=1, max_length=128)]
    message: Annotated[str, Field(min_length=1, max_length=12000)]


class ChatResponse(BaseModel):
    user_id: str
    thread_id: str
    response: str
