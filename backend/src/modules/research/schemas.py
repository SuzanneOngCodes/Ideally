from typing import Literal

from pydantic import BaseModel, Field, HttpUrl


class Finding(BaseModel):
    title: str
    description: str


class Source(BaseModel):
    title: str
    url: HttpUrl
    excerpt: str = ""


class ReasoningCard(BaseModel):
    title: str
    summary: str
    explanation: str
    methodology: str = ""
    limitations: list[str] = Field(default_factory=list)
    unresolved_questions: list[str] = Field(default_factory=list)
    sources: list[Source] = Field(default_factory=list)
    status: Literal["source-supported", "AI-inferred", "hypothesis", "insufficient-evidence"] = (
        "AI-inferred"
    )


class ReasoningMap(BaseModel):
    problem: ReasoningCard
    evidence: ReasoningCard
    research_question: ReasoningCard
    hypothesis: ReasoningCard
    experiment: ReasoningCard


class ResearchResult(BaseModel):
    title: str
    summary: str
    reasoning_map: ReasoningMap | None = None
    findings: list[Finding] = Field(default_factory=list)
    sources: list[Source] = Field(default_factory=list)


class AgentReply(BaseModel):
    answer: str = Field(min_length=1)
    research: ResearchResult | None = None
