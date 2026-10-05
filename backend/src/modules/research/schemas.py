from pydantic import BaseModel, Field, HttpUrl


class Finding(BaseModel):
    title: str
    description: str


class Source(BaseModel):
    title: str
    url: HttpUrl


class ResearchResult(BaseModel):
    title: str
    summary: str
    findings: list[Finding] = Field(default_factory=list)
    sources: list[Source] = Field(default_factory=list)


class AgentReply(BaseModel):
    answer: str = Field(min_length=1)
    research: ResearchResult | None = None
