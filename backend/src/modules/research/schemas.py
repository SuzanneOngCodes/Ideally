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


class ExperimentMetric(BaseModel):
    metric: str
    targetBenchmark: str
    evaluationMethod: str


class ExperimentBaseline(BaseModel):
    name: str
    type: Literal["naive_baseline", "sota_benchmark", "ablation_control"]
    rationale: str


class ExperimentApparatus(BaseModel):
    primaryDatasetOrSetup: str
    sourceAndLicensing: str
    sampleScale: str
    fallbackIfUnavailable: str


class ExperimentMilestone(BaseModel):
    phase: str
    durationWeeks: int = Field(ge=0)
    objective: str
    stopGoCriteria: str


class ExperimentThreat(BaseModel):
    threatType: Literal["internal", "external", "construct", "statistical"]
    description: str
    mitigationStrategy: str


class ExperimentDesign(BaseModel):
    primaryResearchQuestion: str
    falsifiableHypothesis: str
    independentVariables: list[str]
    dependentVariablesAndMetrics: list[ExperimentMetric]
    baselinesAndControls: list[ExperimentBaseline]
    datasetAndApparatus: ExperimentApparatus
    milestoneTimeline: list[ExperimentMilestone]
    validityThreats: list[ExperimentThreat]
    negativeResultValue: str
    successDefinition: str


class ExperimentRequest(BaseModel):
    direction_id: str = Field(default="", max_length=100)
    direction_title: str = Field(default="", max_length=300)
    direction_summary: str = Field(default="", max_length=2000)
    time_horizon_weeks: int | None = Field(default=None, ge=1, le=104)
    compute_tier: str = Field(default="unknown", max_length=100)
    dataset_access: str = Field(default="unknown", max_length=100)
    regenerate: bool = False


class AgentResearchResult(BaseModel):
    title: str
    summary: str
    reasoning_map: ReasoningMap | None = None
    findings: list[Finding] = Field(default_factory=list)
    sources: list[Source] = Field(default_factory=list)


class ResearchResult(AgentResearchResult):
    experiment_design: ExperimentDesign | None = None
    experiment_direction_id: str | None = None


class AgentReply(BaseModel):
    answer: str = Field(min_length=1)
    research: AgentResearchResult | None = None
