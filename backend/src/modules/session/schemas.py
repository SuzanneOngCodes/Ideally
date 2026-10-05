from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from src.modules.research.schemas import ResearchResult


class SessionCreate(BaseModel):
    title: str = Field(default="Cuộc trò chuyện mới", min_length=1, max_length=200)


class MessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=20000)
    research: bool = False


class MessageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    role: str
    content: str
    created_at: datetime


class SessionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    title: str
    created_at: datetime
    updated_at: datetime


class SessionDetail(SessionRead):
    messages: list[MessageRead]
    research: ResearchResult | None


class MessageResponse(BaseModel):
    session_id: str
    user_message: MessageRead
    assistant_message: MessageRead
    research: ResearchResult | None
