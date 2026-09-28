import { ResearchBrief } from '../types/research';

export function generateMarkdownBrief(brief: ResearchBrief): string {
  const selectedDirection = brief.candidateDirections.find(d => d.id === brief.selectedDirectionId) || brief.candidateDirections[0];

  return `# ${brief.title}
**Evidence-Backed Research Brief & Experiment Protocol**
*Generated via Ideally AI Research Advisor — ${new Date(brief.createdAt).toLocaleDateString()}*

---

## 1. Executive Summary & Context
- **Target Domain:** ${brief.intake.domain}
- **Project Context:** ${brief.intake.targetContext.toUpperCase()}
- **Time Horizon:** ${brief.intake.constraints.timeHorizonWeeks} Weeks
- **Compute Budget:** ${brief.intake.constraints.computeTier}
- **Dataset Access:** ${brief.intake.constraints.datasetAccess}

### Real-World Problem Statement
${brief.problemValidation.coreProblemStatement}

### Real-World Impact
${brief.problemValidation.realWorldImpact}

### Stakeholders Affected
${brief.problemValidation.stakeholdersAffected.map(s => `- ${s}`).join('\n')}

---

## 2. Grounding Evidence & Failure Modes of Status Quo
${brief.problemValidation.evidencePoints.map(e => `### Claim: ${e.claim}
- **Source / Phenomenon:** ${e.phenomenonOrSource}
- **Significance:** ${e.realWorldSignificance}
`).join('\n')}

### Urgency Verdict
${brief.problemValidation.urgencyVerdict}

---

## 3. State of Knowledge & Literature Gap
### Established Consensus
${brief.knowledgeLandscape.establishedConsensus.map(c => `- ${c}`).join('\n')}

### Current Approaches & Limitations
| Approach | Paradigm | Critical Limitation |
| :--- | :--- | :--- |
${brief.knowledgeLandscape.existingApproaches.map(a => `| ${a.approachName} | ${a.representativeParadigm} | ${a.primaryLimitation} |`).join('\n')}

### The Critical Knowledge Gap
${brief.knowledgeLandscape.criticalKnowledgeGap}

*Why Unsolved Until Now:* ${brief.knowledgeLandscape.whyUnsolvedUntilNow}

---

## 4. Direction Exploration & Trade-off Evaluation
${brief.candidateDirections.map(d => `### ${d.title} ${d.id === brief.selectedDirectionId ? '★ SELECTED' : ''}
- **Type:** ${d.directionType}
- **Summary:** ${d.summary}
- **Why Pursue:** ${d.whyPursue}
- **Trade-offs:** Novelty: ${d.tradeoffs.noveltyScore}/10 | Feasibility: ${d.tradeoffs.feasibilityScore}/10 | Impact: ${d.tradeoffs.impactScore}/10 | Risk: ${d.tradeoffs.riskLevel}
- **Required Resources:** ${d.requiredResources.join(', ')}
- **Potential Pitfalls:** ${d.potentialPitfalls}
`).join('\n')}

### Selection Rationale
${brief.selectionRationale}

---

## 5. Experiment Design & Empirical Protocol
### Primary Research Question
> **${brief.experimentDesign.primaryResearchQuestion}**

### Falsifiable Core Hypothesis
> **${brief.experimentDesign.falsifiableHypothesis}**

### Variables & Metrics
- **Independent Variables:** ${brief.experimentDesign.independentVariables.join(', ')}
${brief.experimentDesign.dependentVariablesAndMetrics.map(m => `- **Metric:** ${m.metric} (Target: ${m.targetBenchmark}) — *Method: ${m.evaluationMethod}*`).join('\n')}

### Baselines & Controls
${brief.experimentDesign.baselinesAndControls.map(b => `- **${b.name}** (${b.type}): ${b.rationale}`).join('\n')}

### Dataset & Experimental Setup
- **Primary Setup:** ${brief.experimentDesign.datasetAndApparatus.primaryDatasetOrSetup}
- **Scale:** ${brief.experimentDesign.datasetAndApparatus.sampleScale}
- **Licensing/Access:** ${brief.experimentDesign.datasetAndApparatus.sourceAndLicensing}
- **Fallback Plan:** ${brief.experimentDesign.datasetAndApparatus.fallbackIfUnavailable}

### Milestone Protocol & Stop/Go Criteria
${brief.experimentDesign.milestoneTimeline.map(m => `#### ${m.phase} (${m.durationWeeks} Weeks)
- **Objective:** ${m.objective}
- **Stop/Go Criteria:** ${m.stopGoCriteria}
`).join('\n')}

### Threats to Validity & Mitigations
${brief.experimentDesign.validityThreats.map(t => `- **${t.threatType.toUpperCase()} THREAT:** ${t.description}\n  *Mitigation:* ${t.mitigationStrategy}`).join('\n')}

### Negative Result Value
${brief.experimentDesign.negativeResultValue}

### Success Criteria
${brief.experimentDesign.successDefinition}

---

## 6. Feasibility & Advisory Assessment
- **Runway:** ${brief.feasibilityAssessment.runwayWeeks} weeks
- **Budget Verdict:** ${brief.feasibilityAssessment.budgetVerdict}
- **Key Prerequisite:** ${brief.feasibilityAssessment.keyPrerequisite}

${brief.advisorCritiques.map(c => `> **Advisor Note (${c.category}):** ${c.critique}\n> *Actionable Step:* ${c.actionableAdjustment}`).join('\n\n')}

---

## 7. Citation
\`\`\`bibtex
${brief.bibtexSnippet}
\`\`\`
`;
}

export function downloadMarkdownFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
