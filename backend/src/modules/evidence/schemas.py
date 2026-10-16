from typing import Literal

from pydantic import BaseModel, Field


class WebSearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=512)


class AcademicSearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=450)
    source: Literal["all", "arxiv", "semantic_scholar"] = "all"
    limit: int = Field(default=6, ge=1, le=10)
