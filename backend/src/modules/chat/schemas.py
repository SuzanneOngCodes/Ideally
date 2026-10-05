from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from src.modules.research.schemas import ResearchResult


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=20000)
    session_id: UUID | None = None
    research: bool = False

    @field_validator("message")
    @classmethod
    def validate_message(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Message must not be blank")
        return value


class ChatResponse(BaseModel):
    session_id: UUID
    reply: str
    research: ResearchResult | None = None
