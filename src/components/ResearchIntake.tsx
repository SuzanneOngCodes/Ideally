import React, { useState } from 'react';
import { ArrowRight, HelpCircle, Check, Loader2, Sparkles, BookOpen } from 'lucide-react';
import { UserIntake, ProjectContext, IntakeMode } from '../types/research';

interface ResearchIntakeProps {
  onSubmit: (intake: UserIntake) => Promise<void>;
  isLoading: boolean;
  onOpenPresets: () => void;
  initialIntake?: UserIntake;
}

export const ResearchIntake: React.FC<ResearchIntakeProps> = ({
  onSubmit,
  isLoading,
  onOpenPresets,
  initialIntake,
}) => {
  const [mode, setMode] = useState<IntakeMode>(initialIntake?.mode || 'observation_hypothesis');
  const [domain, setDomain] = useState(initialIntake?.domain || '');
  const [problemOrObservation, setProblemOrObservation] = useState(initialIntake?.problemOrObservation || '');
  const [earlyHypothesis, setEarlyHypothesis] = useState(initialIntake?.earlyHypothesis || '');
  const [targetContext, setTargetContext] = useState<ProjectContext>(initialIntake?.targetContext || 'capstone');
  const [timeHorizonWeeks, setTimeHorizonWeeks] = useState<number>(initialIntake?.constraints.timeHorizonWeeks || 12);
  const [computeTier, setComputeTier] = useState<any>(initialIntake?.constraints.computeTier || 'single_gpu');
  const [datasetAccess, setDatasetAccess] = useState<any>(initialIntake?.constraints.datasetAccess || 'public_only');
  const [humanSubjects, setHumanSubjects] = useState<boolean>(initialIntake?.constraints.humanSubjects || false);
  const [budgetNotes, setBudgetNotes] = useState(initialIntake?.constraints.budgetNotes || '');

  // Quick domain suggestions reflecting Section 3 and Section 8
  const domainSuggestions = [
    'LLM Classification Latency (Section 8 Demo)',
    'AI Safety & Code LLM Hallucination',
    'Clinical Informatics & Healthcare ML',
    'Post-Quantum Cryptography & Embedded Systems',
    'CI/CD Flaky Test Isolation in Distributed Pipelines',
  ];

  const handleApplySuggestion = (d: string) => {
    setDomain(d);
    if (d.includes('LLM Classification Latency')) {
      setDomain('Software Engineering Systems & Applied NLP');
      setProblemOrObservation('A student asks: "I notice that LLMs return results token by token. Does that make classification or recommendation slow? Could a simpler model return the result all at once?"');
      setEarlyHypothesis('A specialized non-autoregressive encoder (ModernBERT / DeBERTa) will achieve >10x p99 latency reduction (<30ms vs >350ms) compared to an 8B LLM baseline on software support-ticket classification, while maintaining Macro-F1 within 1.5%.');
      setTargetContext('capstone');
      setTimeHorizonWeeks(12);
    } else if (d.includes('Clinical')) {
      setProblemOrObservation('Hospital ICU readmission prediction models degrade by 15-20% AUC when clinical staff transition to streamlined EHR documentation templates with fewer free-text narrative notes.');
      setEarlyHypothesis('Models rely on token frequency heuristics rather than temporal biomarker trajectories, causing catastrophic uncertainty when note length drops.');
      setTargetContext('capstone');
      setTimeHorizonWeeks(12);
    } else if (d.includes('Post-Quantum')) {
      setProblemOrObservation('Deploying NIST ML-KEM (Kyber) onto ARM Cortex-M4 microcontrollers exceeds available 32KB-64KB SRAM budgets unless timing or power side-channel leaks are introduced.');
      setEarlyHypothesis('An inplace butterfly register-budgeted Number Theoretic Transform can maintain constant-time execution while reducing peak dynamic stack memory below 1.8KB.');
      setTargetContext('thesis');
      setTimeHorizonWeeks(16);
    } else if (d.includes('Code LLM')) {
      setProblemOrObservation('Coding models frequently invent non-existent method signatures and hallucinate deprecated API parameters when generating code for specialized or recently updated Python packages.');
      setEarlyHypothesis('Hallucinations stem from frequency bias in training data, which can be mitigated by AST-guided logit masking without noticeable latency.');
      setTargetContext('academic_conference');
      setTimeHorizonWeeks(10);
    } else if (d.includes('Hydrology')) {
      setProblemOrObservation('Standard stormwater bio-retention swales fail to capture sub-50µm secondary microplastics during high-intensity storm surges, washing 82% of tire wear particulates into municipal waterways.');
      setEarlyHypothesis('Electrostatic biochar amendments can induce electrophoretic entrapment without reducing soil hydraulic conductivity.');
      setTargetContext('capstone');
      setTimeHorizonWeeks(12);
    } else if (d.includes('Robotic')) {
      setProblemOrObservation('Tactile slip-detection sensors on compliant robotic grippers incur 60ms latency, causing fragile irregular agricultural produce to drop or bruise before grasp force adjusts.');
      setEarlyHypothesis('Event-based neuromorphic acoustic emission sensors can detect micro-slips in <4ms with zero tactile deformation.');
      setTargetContext('thesis');
      setTimeHorizonWeeks(16);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim() || !problemOrObservation.trim()) return;

    await onSubmit({
      mode,
      domain: domain.trim(),
      problemOrObservation: problemOrObservation.trim(),
      earlyHypothesis: earlyHypothesis.trim() || undefined,
      targetContext,
      constraints: {
        timeHorizonWeeks,
        computeTier,
        datasetAccess,
        humanSubjects,
        budgetNotes: budgetNotes.trim() || undefined,
      },
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6">
      {/* Editorial Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3 mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 font-serif-scholarly">
          Evidence-Backed Research Advisor
        </h1>
        <p className="text-base text-slate-600">
          Ideally guides you to explore, select, and defend a research direction worth pursuing—grounded in real-world friction, literature gaps, and verifiable experiment design.
        </p>

        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onOpenPresets}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-500" />
            Browse Verified Case Studies
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-8">
        {/* Step 1: Mode Switcher */}
        <div className="space-y-3">
          <label className="text-xs uppercase tracking-wider font-semibold text-slate-500">
            01. Starting Point & Input Mode
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMode('observation_hypothesis')}
              className={`p-4 rounded-lg border text-left transition-all ${
                mode === 'observation_hypothesis'
                  ? 'border-slate-900 bg-slate-50/70 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="font-semibold text-sm text-slate-900">
                Observation & Early Hypothesis
              </div>
              <div className="text-xs text-slate-500 mt-1">
                You’ve observed a real-world discrepancy, anomaly, or failure mode and have an early hunch to test.
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMode('blank_canvas')}
              className={`p-4 rounded-lg border text-left transition-all ${
                mode === 'blank_canvas'
                  ? 'border-slate-900 bg-slate-50/70 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="font-semibold text-sm text-slate-900">
                Blank Canvas / Domain Exploration
              </div>
              <div className="text-xs text-slate-500 mt-1">
                You have a problem space or curiosity but need help formulating the research gap and direction.
              </div>
            </button>
          </div>
        </div>

        {/* Step 2: Domain & Problem */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs uppercase tracking-wider font-semibold text-slate-500">
              02. Research Domain & Problem Grounding
            </label>
            <span className="text-xs text-slate-400">Required fields</span>
          </div>

          <div>
            <label htmlFor="domain" className="block text-sm font-medium text-slate-700 mb-1">
              Field or Disciplinary Domain
            </label>
            <input
              id="domain"
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="e.g. Clinical Informatics, Post-Quantum Cryptography, AI Safety, Urban Hydrology..."
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent placeholder:text-slate-400"
              required
            />

            {/* Suggestions */}
            <div className="mt-3 p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-700 font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Not sure where to start? Pre-fill a real-world research problem:</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono-tabular">1-Click Auto-Fill</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {domainSuggestions.map((sug) => {
                  const icon = sug.includes('LLM Classification') ? '⚡' : sug.includes('Clinical') ? '🏥' : sug.includes('Post-Quantum') ? '🔐' : sug.includes('Code LLM') ? '🤖' : '🌊';
                  return (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => handleApplySuggestion(sug)}
                      className="px-3 py-1.5 rounded-lg text-xs bg-white hover:bg-slate-100 text-slate-800 transition-all flex items-center gap-1.5 font-medium border border-slate-200 hover:border-slate-300 shadow-2xs hover:shadow-xs active:scale-95"
                    >
                      <span className="text-sm">{icon}</span>
                      <span>{sug.split('(')[0].trim()}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="problem" className="block text-sm font-medium text-slate-700 mb-1">
              {mode === 'observation_hypothesis'
                ? 'What real-world failure, friction, or anomaly did you observe?'
                : 'What real-world challenge or question do you want to explore?'}
            </label>
            <textarea
              id="problem"
              rows={3}
              value={problemOrObservation}
              onChange={(e) => setProblemOrObservation(e.target.value)}
              placeholder="Describe the concrete friction or breakdown. (e.g. ICU predictive models drop in accuracy when EHR template changes encourage shorter clinical notes...)"
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent placeholder:text-slate-400"
              required
            />
          </div>

          {mode === 'observation_hypothesis' && (
            <div>
              <label htmlFor="hypothesis" className="block text-sm font-medium text-slate-700 mb-1">
                Early Hypothesis or Working Intuition <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                id="hypothesis"
                rows={2}
                value={earlyHypothesis}
                onChange={(e) => setEarlyHypothesis(e.target.value)}
                placeholder="What do you suspect is the underlying mechanism? (e.g. Models overfit to token volume shortcuts rather than physiological labs...)"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent placeholder:text-slate-400"
              />
            </div>
          )}
        </div>

        {/* Step 3: Project Context & Practical Constraints */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <label className="text-xs uppercase tracking-wider font-semibold text-slate-500">
            03. Target Context & Practical Resource Budget
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Project Milestone Context
              </label>
              <select
                value={targetContext}
                onChange={(e) => setTargetContext(e.target.value as ProjectContext)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="capstone">Capstone Project (Undergraduate / Masters)</option>
                <option value="academic_conference">Academic Conference (NeurIPS, ICSE, etc.)</option>
                <option value="thesis">Master's or Doctoral Thesis</option>
                <option value="industry_rnd">Applied Industry R&D Validation</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Time Horizon: <span className="font-mono-tabular font-semibold text-slate-900">{timeHorizonWeeks} Weeks</span>
              </label>
              <input
                type="range"
                min="4"
                max="24"
                step="2"
                value={timeHorizonWeeks}
                onChange={(e) => setTimeHorizonWeeks(parseInt(e.target.value))}
                className="w-full accent-slate-900 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1 font-mono-tabular">
                <span>4w (Sprint)</span>
                <span>12w (Semester)</span>
                <span>24w (Year)</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Compute Tier
              </label>
              <select
                value={computeTier}
                onChange={(e) => setComputeTier(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="laptop">Standard Laptop / Local CPU</option>
                <option value="single_gpu">Single Consumer GPU (RTX 3090/4090)</option>
                <option value="cluster">Multi-Node Cluster / HPC</option>
                <option value="cloud_credits">Limited Cloud Credits</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Dataset / Lab Access
              </label>
              <select
                value={datasetAccess}
                onChange={(e) => setDatasetAccess(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="public_only">Publicly Available Data Only</option>
                <option value="synthetic_possible">Synthetic Generation Feasible</option>
                <option value="proprietary_partner">Partner / Lab Proprietary Access</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Human Subjects / IRB
              </label>
              <select
                value={humanSubjects ? 'yes' : 'no'}
                onChange={(e) => setHumanSubjects(e.target.value === 'yes')}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="no">No Human Subjects (Pure In Silico / Empirical)</option>
                <option value="yes">Requires Human Trials / IRB Approval</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submit Action */}
        <div className="pt-4 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>Output: Evidence-backed brief with falsifiable experiment design</span>
          </div>

          <button
            type="submit"
            disabled={isLoading || !domain.trim() || !problemOrObservation.trim()}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2 shadow-xs"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Advisor Reasoning...</span>
              </>
            ) : (
              <>
                <span>Synthesize Research Brief</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Advisory Reasoning Steps Indicator when loading */}
      {isLoading && (
        <div className="mt-8 bg-slate-900 text-white rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-400 font-mono-tabular">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>Ideally Advisory Pipeline Executing</span>
          </div>

          <div className="space-y-2 text-sm text-slate-300 font-mono-tabular">
            <div className="flex items-center gap-2 text-white">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Validating real-world stakeholder impact & status quo failure modes...</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-slate-600" />
              <span>Mapping established consensus vs unsolved literature frontiers...</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-slate-600" />
              <span>Evaluating candidate directions on novelty, feasibility, and risk...</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-slate-600" />
              <span>Structuring falsifiable hypotheses, variables, and stop/go milestones...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
