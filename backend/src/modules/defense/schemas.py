from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class DefenseProbe(BaseModel):
    id: str = Field(min_length=1, max_length=80)
    persona: str = Field(min_length=1, max_length=160)
    probingTopic: str = Field(min_length=1, max_length=240)
    question: str = Field(min_length=1, max_length=3000)
    exampleAnswers: list[str] = Field(default_factory=list, max_length=3)
    userDefenseAnswer: str | None = None
    feedback: dict[str, Any] | None = None


class DefenseProbesResponse(BaseModel):
    probes: list[DefenseProbe] = Field(min_length=3, max_length=3)
    brief_id: str | None = None


class DefenseEvaluation(BaseModel):
    strengthScore: int = Field(ge=1, le=10)
    strengths: list[str] = Field(min_length=1, max_length=5)
    vulnerabilities: list[str] = Field(min_length=1, max_length=5)
    advisorTip: str = Field(min_length=1, max_length=2000)


class DefenseContextRequest(BaseModel):
    brief: dict[str, Any]
    session_id: UUID | None = None


class GenerateDefenseProbesRequest(DefenseContextRequest):
    pass


class EvaluateDefenseRequest(DefenseContextRequest):
    probe: DefenseProbe
    answer: str = Field(min_length=1, max_length=12000)
