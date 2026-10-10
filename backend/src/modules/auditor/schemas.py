from typing import List, Optional, Literal
from pydantic import BaseModel, Field

class Factor(BaseModel):
    # 💡 THE FIX: Forces Gemini to ONLY use these 3 exact names requested in your prompt layout
    name: Literal[
        "Bibliographic Authenticity Risk", 
        "Synthetic Stylometric Clumping", 
        "Empirical Verification Deficit"
    ] = Field(description="The distinct validation category name parameter being scored.")
    score: int = Field(..., ge=0, le=100, description="Factor score out of 100.")
    description: str = Field(..., description="Detailed breakdown explanation justifying this score assignment.")

class FlaggedSnippet(BaseModel):
    snippet: str = Field(..., description="The exact matching substring from the text that is suspicious.")
    reason: str = Field(..., description="Reasoning or description explaining why this specific snippet was flagged.")
    severity: Literal["warning", "critical"] = Field(..., description="Severity classification tag.")
    confidence: int = Field(..., ge=0, le=100, description="Confidence level score between 0 and 100.")
    category: Literal["invented_citation", "synthetic_rhetoric", "ungrounded_claim"] = Field(
        ..., description="Structural classification tag node parameter matching type constraints."
    )

class HallucinationRisk(BaseModel):
    score: int = Field(..., ge=0, le=100, description="Overall risk score between 0 and 100.")
    riskLevel: Literal["Low", "Moderate", "Severe", "Critical"] = Field(..., description="Categorical risk scale tier.")
    confidence: int = Field(..., ge=0, le=100, description="Confidence score gauge between 0 and 100.")
    verdictSummary: str = Field(..., description="A 1-2 sentence high-level assessment of validation results.")
    factors: List[Factor] = Field(..., description="Breakdown array matrix exactly identifying the 3 core risk factors.")
    flaggedSnippets: List[FlaggedSnippet] = Field(..., description="Array collection of isolated suspicious sentences.")

class AuditCitation(BaseModel):
    id: str = Field(..., description="Incremental unique identifier token sequence, e.g., 'cit-1'.")
    citationText: str = Field(..., description="The exact raw inline reference string captured from the source text.")
    paperTitle: str = Field(..., description="The matching or extracted real-world title of the academic paper.")
    allegedClaim: str = Field(..., description="The arguments supported by this specific citation element.")
    status: Literal["verified", "attribution_drift", "phantom_hallucination", "unverifiable"] = Field(
        ..., description="The forensic validation verdict status tag."
    )
    verdictReason: str = Field(..., description="Granular justification notes supporting the validation status.")
    groundedSourceUrl: str = Field(..., description="URL reference location pointing to source repository or empty string.")
    confidenceScore: int = Field(..., ge=0, le=100, description="Confidence gauge ranking parameter out of 100.")
    verifiedAuthors: str = Field(..., description="The real-world author names or 'Unknown'.")
    verifiedVenueYear: str = Field(..., description="The publishing journal venue track identity and calendar year details.")

class DetectedPattern(BaseModel):
    phrase: str = Field(..., description="The caught synthetic cliché word token expression phrase string.")
    category: Literal["vacuous_hyperbole", "passive_evasion", "cliche_metaphor", "unquantified_claim"] = Field(
        ..., description="Structural writing style violation category classification label parameter."
    )
    explanation: str = Field(..., description="Detailed description detailing why this phrase represents empty AI slop.")
    suggestedRewrite: str = Field(..., description="The clean, direct micro-correction alternative phrasing alternative.")

class SlopAnalysis(BaseModel):
    slopScore: int = Field(..., ge=0, le=100, description="AI slop score metric evaluation value out of 100.")
    empiricalDensityScore: int = Field(..., ge=0, le=100, description="Quantitative density parameter calculation out of 100.")
    detectedPatterns: List[DetectedPattern] = Field(..., description="Collection of all style violation patterns caught.")
    critiqueSummary: str = Field(..., description="High-level feedback summarizing document tone patterns.")
    cleanScholarlyRewrite: str = Field(
        ..., description="A pristine, academic rewrite that strips out marketing terms while maintaining empirical facts."
    )

class AuditReport(BaseModel):
    id: str = Field(..., description="Unique code identifier track node, matching pattern format 'audit-1700000000000'.")
    auditedAt: str = Field(..., description="ISO 8601 string instance marking the date-time tracking matrix point.")
    targetDomain: str = Field(..., description="The engineering or scientific field domain name assigned.")
    overallIntegrityScore: int = Field(..., ge=0, le=100, description="Global document tracking metric score out of 100.")
    hallucinationRisk: HallucinationRisk = Field(..., description="Detailed verification analysis metrics nested block.")
    citations: List[AuditCitation] = Field(..., description="Collection containing metrics evaluating text citation links.")
    slopAnalysis: SlopAnalysis = Field(..., description="Stylistic writing pattern evaluation analysis block.")
    recommendations: List[str] = Field(..., description="Array list of actionable suggestions and remediation procedures.")

# --- Input Validation Schemas matching your TypeScript body structure ---

class ProblemValidationSchema(BaseModel):
    coreProblemStatement: str = Field(..., description="Core observation to audit")

class KnowledgeLandscapeSchema(BaseModel):
    criticalKnowledgeGap: str = Field(..., description="Identified space missing critical research mapping")

class ExperimentDesignSchema(BaseModel):
    falsifiableHypothesis: str = Field(..., description="Proposed check metric for testing validation")

class IntakeSchema(BaseModel):
    domain: Optional[str] = Field(None, description="Optional discipline field context string tag")

class BriefInputSchema(BaseModel):
    title: str = Field(..., description="Title descriptor of the research direction")
    problemValidation: ProblemValidationSchema
    knowledgeLandscape: KnowledgeLandscapeSchema
    experimentDesign: ExperimentDesignSchema
    intake: Optional[IntakeSchema] = None

class AuditRequestPayload(BaseModel):
    text: Optional[str] = Field(None, description="Raw block string input to audit directly")
    brief: Optional[BriefInputSchema] = Field(None, description="Alternative composite object layout parameter")
    domain: Optional[str] = Field(None, description="Discipline area overrides configuration option")