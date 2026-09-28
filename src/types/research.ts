export type ProjectContext = 'capstone' | 'academic_conference' | 'industry_rnd' | 'thesis';

export type IntakeMode = 'blank_canvas' | 'observation_hypothesis';

export interface ResourceConstraints {
  timeHorizonWeeks: number;
  computeTier: 'laptop' | 'single_gpu' | 'cluster' | 'cloud_credits';
  datasetAccess: 'public_only' | 'synthetic_possible' | 'proprietary_partner';
  humanSubjects: boolean;
  budgetNotes?: string;
}

export interface UserIntake {
  mode: IntakeMode;
  domain: string;
  problemOrObservation: string;
  earlyHypothesis?: string;
  targetContext: ProjectContext;
  constraints: ResourceConstraints;
}

export interface GroundingEvidence {
  claim: string;
  phenomenonOrSource: string;
  realWorldSignificance: string;
}

export interface ProblemValidation {
  coreProblemStatement: string;
  realWorldImpact: string;
  stakeholdersAffected: string[];
  failureModesOfStatusQuo: string[];
  evidencePoints: GroundingEvidence[];
  urgencyVerdict: string;
}

export interface ExistingApproach {
  approachName: string;
  representativeParadigm: string;
  primaryLimitation: string;
}

export interface KnowledgeLandscape {
  establishedConsensus: string[];
  existingApproaches: ExistingApproach[];
  criticalKnowledgeGap: string;
  whyUnsolvedUntilNow: string;
}

export interface DirectionTradeoffs {
  noveltyScore: number; // 1-10
  feasibilityScore: number; // 1-10
  impactScore: number; // 1-10
  riskLevel: 'Low' | 'Moderate' | 'High';
}

export interface ResearchDirection {
  id: string;
  title: string;
  directionType: 'empirical_diagnostic' | 'architectural_intervention' | 'benchmark_evaluation' | 'theory_grounded';
  summary: string;
  whyPursue: string;
  tradeoffs: DirectionTradeoffs;
  requiredResources: string[];
  potentialPitfalls: string;
  suitabilityForContext: string;
  isRecommended: boolean;
}

export interface VariableMetric {
  metric: string;
  targetBenchmark: string;
  evaluationMethod: string;
}

export interface BaselineControl {
  name: string;
  type: 'naive_baseline' | 'sota_benchmark' | 'ablation_control';
  rationale: string;
}

export interface ExperimentMilestone {
  phase: string;
  durationWeeks: number;
  objective: string;
  stopGoCriteria: string;
}

export interface ValidityThreat {
  threatType: 'internal' | 'external' | 'construct' | 'statistical';
  description: string;
  mitigationStrategy: string;
}

export interface ExperimentDesign {
  primaryResearchQuestion: string;
  falsifiableHypothesis: string;
  independentVariables: string[];
  dependentVariablesAndMetrics: VariableMetric[];
  baselinesAndControls: BaselineControl[];
  datasetAndApparatus: {
    primaryDatasetOrSetup: string;
    sourceAndLicensing: string;
    sampleScale: string;
    fallbackIfUnavailable: string;
  };
  milestoneTimeline: ExperimentMilestone[];
  validityThreats: ValidityThreat[];
  negativeResultValue: string;
  successDefinition: string;
}

export interface AdvisorCritique {
  category: string;
  critique: string;
  actionableAdjustment: string;
}

export type AudienceMode = 'beginner' | 'experienced';

export type CardEvidenceStatus = 
  | 'source-supported' 
  | 'AI-inferred' 
  | 'hypothesis' 
  | 'insufficient-evidence';

export type EvidenceCategory = 
  | 'existence' 
  | 'prevalence' 
  | 'causes' 
  | 'solution_efficacy';

export type EvidenceStance = 
  | 'supporting' 
  | 'contradictory';

export type EvidenceReviewScope = 
  | 'full_paper' 
  | 'abstract_only' 
  | 'dataset_telemetry' 
  | 'technical_report';

export interface StructuredEvidenceSource {
  id: string;
  title: string;
  authors?: string;
  yearOrDate: string;
  venueOrPublisher?: string;
  url?: string;
  category: EvidenceCategory;
  stance: EvidenceStance;
  reviewScope: EvidenceReviewScope;
  isPrimarySource: boolean;
  methodSummary: string;
  findingsSummary: string;
  limitations: string;
  excerpt: string;
}

export interface ResearchMapCard {
  id: 'problem' | 'evidence' | 'research_question' | 'hypothesis' | 'experiment';
  title: string;
  stageLabel: string;
  status: CardEvidenceStatus;
  summary: string;
  accessibleExplanation: string; // Plain-language explanation for beginners
  deepScholarlyExplanation: string; // Rigorous methodology and technical detail for experienced
  limitations: string[];
  sources: StructuredEvidenceSource[];
  visualType?: 'mechanism_diagram' | 'comparison_table' | 'problem_story' | 'latency_profile';
  visualTitle?: string;
  visualData?: any;
  expectedOutcomeWarning?: string; // Explicitly labels outcomes as hypotheses, not achieved results
  unresolvedQuestions?: string[];
  evidenceInsufficientAdvice?: string;
}

export interface ConversationMessage {
  id: string;
  sender: 'user' | 'advisor';
  text: string;
  timestamp: string;
  linkedCardId?: 'problem' | 'evidence' | 'research_question' | 'hypothesis' | 'experiment';
  actionPrompt?: string;
}

export interface ResearchBrief {
  id: string;
  createdAt: string;
  title: string;
  intake: UserIntake;
  problemValidation: ProblemValidation;
  knowledgeLandscape: KnowledgeLandscape;
  candidateDirections: ResearchDirection[];
  selectedDirectionId: string;
  selectionRationale: string;
  experimentDesign: ExperimentDesign;
  advisorCritiques: AdvisorCritique[];
  feasibilityAssessment: {
    runwayWeeks: number;
    budgetVerdict: string;
    keyPrerequisite: string;
  };
  bibtexSnippet: string;
  researchMapCards?: ResearchMapCard[];
}

export interface SocraticDefenseProbe {
  id: string;
  persona: string; // e.g. 'Committee Chair', 'Empirical Skeptic (Reviewer 2)', 'Industry Practitioner'
  question: string;
  probingTopic: string;
  exampleAnswers?: string[];
  userDefenseAnswer?: string;
  feedback?: {
    strengthScore: number; // 1-10
    strengths: string[];
    vulnerabilities: string[];
    advisorTip: string;
  };
}

export type CitationIntegrityStatus = 
  | 'verified' 
  | 'attribution_drift' 
  | 'phantom_hallucination' 
  | 'unverifiable';

export interface CitationAuditItem {
  id: string;
  citationText: string;
  paperTitle: string;
  allegedClaim: string;
  status: CitationIntegrityStatus;
  verdictReason: string;
  groundedSourceUrl?: string;
  confidenceScore: number; // 0-100
  verifiedAuthors?: string;
  verifiedVenueYear?: string;
}

export interface SlopPattern {
  phrase: string;
  category: 'vacuous_hyperbole' | 'passive_evasion' | 'cliche_metaphor' | 'unquantified_claim';
  explanation: string;
  suggestedRewrite: string;
}

export interface SlopAnalysis {
  slopScore: number; // 0 to 100 (lower is cleaner)
  empiricalDensityScore: number; // 0 to 100 (higher is more rigorous)
  detectedPatterns: SlopPattern[];
  critiqueSummary: string;
  cleanScholarlyRewrite: string;
}

export interface HallucinationRiskFactor {
  name: string;
  score: number; // 0-100 (risk level)
  description: string;
  flaggedTokens?: string[];
}

export interface FlaggedSnippet {
  snippet: string;
  reason: string;
  severity: 'warning' | 'critical';
  confidence: number; // 0-100
  category: 'invented_citation' | 'synthetic_rhetoric' | 'ungrounded_claim';
}

export interface HallucinationRisk {
  score: number; // 0 to 100 (100 = highest hallucination likelihood)
  riskLevel: 'Low' | 'Moderate' | 'Severe' | 'Critical';
  confidence: number; // 0 to 100 gauge confidence
  verdictSummary: string;
  factors: HallucinationRiskFactor[];
  flaggedSnippets: FlaggedSnippet[];
}

export interface EvidenceAuditReport {
  id: string;
  auditedAt: string;
  targetDomain: string;
  overallIntegrityScore: number; // 0 to 100
  hallucinationRisk: HallucinationRisk;
  citations: CitationAuditItem[];
  slopAnalysis: SlopAnalysis;
  recommendations: string[];
}

export interface AcademicSearchResult {
  id: string;
  title: string;
  authors: string;
  yearOrDate: string;
  abstract: string;
  venueOrPublisher: string;
  url: string;
  pdfUrl?: string;
  sourceType: 'arxiv' | 'semantic_scholar' | 'gemini_grounded';
  citationCount?: number;
  isOpenAccess: boolean;
  category?: EvidenceCategory;
  stance?: EvidenceStance;
}

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  publishedDate?: string;
  engine: 'gemini_grounding' | 'tavily' | 'google_custom_search' | 'fallback';
}

