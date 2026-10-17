import re
from typing import Any, Literal

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


ReasoningStage = Literal["problem", "evidence", "research_question", "hypothesis", "experiment"]


class ReasoningDiagramNode(BaseModel):
    id: ReasoningStage
    label: str
    title: str
    summary: str
    status: Literal["source-supported", "AI-inferred", "hypothesis", "insufficient-evidence"]
    source_count: int = Field(ge=0)


class ReasoningDiagramEdge(BaseModel):
    source: ReasoningStage
    target: ReasoningStage
    label: str = "informs"


class MindMapNode(BaseModel):
    """Structured content for the deterministic Miro-style renderer."""

    id: str
    parent_id: str | None = None
    label: str
    description: str = ""
    level: int = Field(ge=0, le=3)
    side: Literal["left", "right"] | None = None
    branch_color: str | None = None
    children: list[str] = Field(default_factory=list)
    collapsed: bool = False


class ReasoningMapUI(BaseModel):
    """Allowlisted, declarative UI payload consumed by the Reasoning Map diagram."""

    type: Literal["reasoning-map-diagram"] = "reasoning-map-diagram"
    version: Literal[1] = 1
    trigger: Literal["user-request"] | None = None
    title: str = "Research flow"
    format: Literal["flow", "mermaid-mindmap"] = "flow"
    mermaid: str | None = None
    nodes: list[ReasoningDiagramNode] = Field(default_factory=list)
    edges: list[ReasoningDiagramEdge] = Field(default_factory=list)
    mindmap_nodes: list[MindMapNode] = Field(default_factory=list)


def build_reasoning_map_ui(reasoning_map: ReasoningMap) -> ReasoningMapUI:
    stages: tuple[ReasoningStage, ...] = (
        "problem",
        "evidence",
        "research_question",
        "hypothesis",
        "experiment",
    )
    labels = {
        "problem": "Problem",
        "evidence": "Evidence",
        "research_question": "Research question",
        "hypothesis": "Hypothesis",
        "experiment": "Experiment",
    }
    nodes = []
    for stage in stages:
        card = getattr(reasoning_map, stage)
        nodes.append(
            ReasoningDiagramNode(
                id=stage,
                label=labels[stage],
                title=card.title,
                summary=card.summary,
                status=card.status,
                source_count=len(card.sources),
            )
        )
    return ReasoningMapUI(
        trigger="user-request",
        nodes=nodes,
        edges=[
            ReasoningDiagramEdge(source=source, target=target)
            for source, target in zip(stages, stages[1:], strict=False)
        ],
    )


_MINDMAP_COLORS = (
    "#7DDDC8",
    "#A78BFA",
    "#E879D0",
    "#F5B84D",
    "#7CB9F4",
    "#5CCBC5",
)


def _mindmap_text(value: Any) -> str:
    text = re.sub(r"\s+", " ", str(value or "")).strip()
    return re.sub(r"[`\[\]{}():\";#%|<>]", " ", text)


def _mindmap_label(value: Any, *, max_words: int = 8, max_chars: int = 72) -> str:
    """Create a concise, safe concept label for the visual layer."""
    words = _mindmap_text(value).strip(" .").split()
    if not words:
        return "To be determined"
    if len(words) > max_words:
        words = words[: max_words - 1] + ["…"]
    text = " ".join(words)
    if len(text) > max_chars:
        text = text[: max_chars - 1].rsplit(" ", 1)[0].rstrip() + "…"
    return text or "To be determined"


def _mindmap_description(value: Any, *, max_chars: int = 600) -> str:
    text = _mindmap_text(value)
    if len(text) > max_chars:
        return text[: max_chars - 1].rstrip() + "…"
    return text


def _mindmap_detail(label: str, description: Any) -> tuple[str, str]:
    return _mindmap_label(label, max_words=6), _mindmap_description(description)


def _mindmap_mermaid(nodes: list[MindMapNode]) -> str:
    by_parent: dict[str | None, list[MindMapNode]] = {}
    for node in nodes:
        by_parent.setdefault(node.parent_id, []).append(node)

    lines = ["mindmap"]

    def visit(node: MindMapNode, depth: int) -> None:
        if node.parent_id is None:
            lines.append(f"  root(({node.label}))")
        else:
            lines.append(f"{'  ' * (depth + 1)}{node.label}")
        if node.collapsed:
            return
        for child in by_parent.get(node.id, []):
            visit(child, depth + 1)

    root = next((node for node in nodes if node.parent_id is None), None)
    if root:
        visit(root, 0)
    return "\n".join(lines)


def build_session_mindmap_ui(
    reasoning_map: ReasoningMap,
    brief: "ProposalBriefDraft",
    research: dict,
    session_messages: list[dict],
) -> ReasoningMapUI:
    """Build a concise, balanced tree plus a Mermaid fallback from the active session."""
    base = build_reasoning_map_ui(reasoning_map)
    selected = next(
        (
            direction
            for direction in brief.candidateDirections
            if direction.id == brief.selectedDirectionId
        ),
        brief.candidateDirections[0],
    )

    evidence_points = [point.claim for point in brief.problemValidation.evidencePoints]
    approaches = [
        f"{approach.approachName}: {approach.primaryLimitation}"
        for approach in brief.knowledgeLandscape.existingApproaches
    ]
    alternatives = [
        direction.title
        for direction in brief.candidateDirections
        if direction.id != selected.id
    ]
    unresolved = [
        question
        for card in reasoning_map.model_dump().values()
        for question in card.get("unresolved_questions", [])
    ]
    source_titles = [
        source.get("title")
        for card in reasoning_map.model_dump().values()
        for source in card.get("sources", [])
        if source.get("title")
    ]
    source_titles.extend(
        source.get("title")
        for source in research.get("sources", [])
        if source.get("title")
    )

    branch_specs: list[tuple[str, str, str, list[tuple[str, Any]]]] = [
        (
            "problem",
            "Problem",
            brief.problemValidation.coreProblemStatement,
            [
                _mindmap_detail("Core problem", brief.problemValidation.coreProblemStatement),
                _mindmap_detail("Real-world impact", brief.problemValidation.realWorldImpact),
                _mindmap_detail(
                    "Stakeholders", ", ".join(brief.problemValidation.stakeholdersAffected)
                ),
                _mindmap_detail(
                    "Failure modes", ", ".join(brief.problemValidation.failureModesOfStatusQuo)
                ),
            ],
        ),
        (
            "evidence",
            "Evidence",
            brief.knowledgeLandscape.criticalKnowledgeGap,
            [
                _mindmap_detail(
                    "Consensus", "; ".join(brief.knowledgeLandscape.establishedConsensus)
                ),
                _mindmap_detail("Evidence points", "; ".join(evidence_points)),
                _mindmap_detail("Knowledge gap", brief.knowledgeLandscape.criticalKnowledgeGap),
                _mindmap_detail("Existing approaches", "; ".join(approaches)),
                _mindmap_detail("Sources", "; ".join(dict.fromkeys(source_titles))[:600]),
            ],
        ),
        (
            "direction",
            "Direction",
            selected.title,
            [
                _mindmap_detail("Selected direction", selected.title),
                _mindmap_detail("Why pursue", selected.whyPursue),
                _mindmap_detail("Alternatives", "; ".join(alternatives)),
                _mindmap_detail("Selection rationale", brief.selectionRationale),
            ],
        ),
        (
            "experiment",
            "Experiment",
            brief.experimentDesign.primaryResearchQuestion,
            [
                _mindmap_detail(
                    "Research question", brief.experimentDesign.primaryResearchQuestion
                ),
                _mindmap_detail("Hypothesis", brief.experimentDesign.falsifiableHypothesis),
                _mindmap_detail(
                    "Variables", ", ".join(brief.experimentDesign.independentVariables)
                ),
                _mindmap_detail(
                    "Metrics",
                    "; ".join(
                        f"{metric.metric}: {metric.targetBenchmark}"
                        for metric in brief.experimentDesign.dependentVariablesAndMetrics
                    ),
                ),
                _mindmap_detail(
                    "Controls",
                    "; ".join(
                        [baseline.name for baseline in brief.experimentDesign.baselinesAndControls]
                        + [threat.description for threat in brief.experimentDesign.validityThreats]
                        + [brief.experimentDesign.negativeResultValue]
                    ),
                ),
            ],
        ),
        (
            "feasibility",
            "Feasibility",
            brief.feasibilityAssessment.keyPrerequisite,
            [
                _mindmap_detail("Timeline", f"{brief.intake.constraints.timeHorizonWeeks} weeks"),
                _mindmap_detail("Compute", brief.intake.constraints.computeTier),
                _mindmap_detail("Dataset", brief.intake.constraints.datasetAccess),
                _mindmap_detail(
                    "Human subjects",
                    "Yes" if brief.intake.constraints.humanSubjects else "No",
                ),
                _mindmap_detail("Prerequisite", brief.feasibilityAssessment.keyPrerequisite),
            ],
        ),
        (
            "open_questions",
            "Open questions",
            "Items needing resolution",
            [
                _mindmap_detail(
                    "Advisor critiques", "; ".join(crit.critique for crit in brief.advisorCritiques)
                ),
                _mindmap_detail("Unresolved questions", "; ".join(unresolved)),
            ],
        ),
    ]

    root = MindMapNode(
        id="root",
        label=_mindmap_label(brief.title, max_words=5),
        description=_mindmap_description(
            f"{research.get('summary') or brief.title}. {brief.intake.domain}. "
            f"{len(session_messages)} session messages."
        ),
        level=0,
    )
    nodes = [root]
    left_height = right_height = 0
    left_count = right_count = 0
    for index, (branch_id, label, description, children) in enumerate(branch_specs):
        subtree_height = max(1, len(children)) * 44
        if left_height == right_height:
            side = "left" if (left_count + right_count) % 2 == 0 else "right"
        else:
            side = "left" if left_height < right_height else "right"
        if side == "left":
            left_height += subtree_height + 80
            left_count += 1
        else:
            right_height += subtree_height + 80
            right_count += 1
        color = _MINDMAP_COLORS[index % len(_MINDMAP_COLORS)]
        child_ids: list[str] = []
        branch = MindMapNode(
            id=branch_id,
            parent_id="root",
            label=_mindmap_label(label, max_words=4),
            description=_mindmap_description(description),
            level=1,
            side=side,
            branch_color=color,
            children=child_ids,
        )
        nodes.append(branch)
        for child_index, (child_label, child_description) in enumerate(children[:5]):
            child_id = f"{branch_id}-{child_index}"
            child_ids.append(child_id)
            nodes.append(
                MindMapNode(
                    id=child_id,
                    parent_id=branch_id,
                    label=_mindmap_label(child_label, max_words=8),
                    description=_mindmap_description(child_description),
                    level=2,
                    side=side,
                    branch_color=color,
                )
            )
        branch.children = child_ids

    root.children = [node.id for node in nodes if node.parent_id == root.id]
    diagram = base.model_copy(
        update={
            "format": "mermaid-mindmap",
            "title": f"Session mindmap - {brief.title}",
            "mermaid": _mindmap_mermaid(nodes),
            "mindmap_nodes": nodes,
        }
    )
    return diagram


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


class BriefDirectionTradeoffs(BaseModel):
    noveltyScore: int = Field(ge=1, le=10)
    feasibilityScore: int = Field(ge=1, le=10)
    impactScore: int = Field(ge=1, le=10)
    riskLevel: Literal["Low", "Moderate", "High"]


class BriefDirection(BaseModel):
    id: str
    title: str
    directionType: Literal[
        "empirical_diagnostic",
        "architectural_intervention",
        "benchmark_evaluation",
        "theory_grounded",
    ]
    summary: str
    whyPursue: str
    tradeoffs: BriefDirectionTradeoffs
    requiredResources: list[str]
    potentialPitfalls: str
    suitabilityForContext: str
    isRecommended: bool


class BriefCritique(BaseModel):
    category: str
    critique: str
    actionableAdjustment: str


class BriefIntakeConstraints(BaseModel):
    timeHorizonWeeks: int = Field(ge=1, le=104)
    computeTier: Literal["laptop", "single_gpu", "cluster", "cloud_credits"]
    datasetAccess: Literal["public_only", "synthetic_possible", "proprietary_partner"]
    humanSubjects: bool
    budgetNotes: str = ""


class BriefIntake(BaseModel):
    mode: Literal["blank_canvas", "observation_hypothesis"]
    domain: str
    problemOrObservation: str
    earlyHypothesis: str = ""
    targetContext: Literal["capstone", "academic_conference", "industry_rnd", "thesis"]
    constraints: BriefIntakeConstraints


class BriefGroundingEvidence(BaseModel):
    claim: str
    phenomenonOrSource: str
    realWorldSignificance: str


class BriefExistingApproach(BaseModel):
    approachName: str
    representativeParadigm: str
    primaryLimitation: str


class BriefProblemValidation(BaseModel):
    coreProblemStatement: str
    realWorldImpact: str
    stakeholdersAffected: list[str]
    failureModesOfStatusQuo: list[str]
    evidencePoints: list[BriefGroundingEvidence]
    urgencyVerdict: str


class BriefKnowledgeLandscape(BaseModel):
    establishedConsensus: list[str]
    existingApproaches: list[BriefExistingApproach]
    criticalKnowledgeGap: str
    whyUnsolvedUntilNow: str


class BriefFeasibility(BaseModel):
    runwayWeeks: int = Field(ge=1, le=104)
    budgetVerdict: str
    keyPrerequisite: str


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


class ProposalBrief(BaseModel):
    id: str
    createdAt: str
    title: str
    intake: BriefIntake
    problemValidation: BriefProblemValidation
    knowledgeLandscape: BriefKnowledgeLandscape
    candidateDirections: list[BriefDirection] = Field(min_length=1)
    selectedDirectionId: str
    selectionRationale: str
    experimentDesign: ExperimentDesign
    advisorCritiques: list[BriefCritique]
    feasibilityAssessment: BriefFeasibility
    bibtexSnippet: str
    researchMapCards: list[dict]
    researchDiagram: ReasoningMapUI


class ProposalBriefDraft(BaseModel):
    """Model-authored proposal content; session metadata and diagram are server-owned."""

    title: str
    intake: BriefIntake
    problemValidation: BriefProblemValidation
    knowledgeLandscape: BriefKnowledgeLandscape
    candidateDirections: list[BriefDirection] = Field(min_length=1)
    selectedDirectionId: str
    selectionRationale: str
    experimentDesign: ExperimentDesign
    advisorCritiques: list[BriefCritique]
    feasibilityAssessment: BriefFeasibility
    bibtexSnippet: str = ""


class ProposalBriefRequest(BaseModel):
    regenerate: bool = False


class AgUiRunInput(BaseModel):
    """Subset of the AG-UI RunAgentInput accepted by the proposal stream."""

    threadId: str = ""
    runId: str = ""
    protocolVersion: str = "1.0"
    state: dict = Field(default_factory=dict)
    messages: list[dict] = Field(default_factory=list)
    tools: list[dict] = Field(default_factory=list)
    context: list[dict] = Field(default_factory=list)
    forwardedProps: dict = Field(default_factory=dict)
    regenerate: bool = False


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
    ui: ReasoningMapUI | None = Field(
        default=None,
        description="Include a diagram UI only when the user explicitly requests a visual diagram.",
    )
    findings: list[Finding] = Field(default_factory=list)
    sources: list[Source] = Field(default_factory=list)


class ResearchResult(AgentResearchResult):
    experiment_design: ExperimentDesign | None = None
    experiment_direction_id: str | None = None
    proposal_brief: ProposalBrief | None = None
    defense_lab: dict[str, Any] | None = None


class AgentReply(BaseModel):
    answer: str = Field(min_length=1)
    research: AgentResearchResult | None = None
