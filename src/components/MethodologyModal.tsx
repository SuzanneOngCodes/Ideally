import React from 'react';
import { X, CheckCircle, ShieldAlert, Target, BookOpen, Layers, Sparkles, ArrowRight } from 'lucide-react';

interface MethodologyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: any) => void;
}

export const MethodologyModal: React.FC<MethodologyModalProps> = ({
  isOpen,
  onClose,
  onSelectTab,
}) => {
  if (!isOpen) return null;

  const stages = [
    {
      num: '01',
      title: 'Problem Grounding',
      subtitle: 'Validate Real-World Pain',
      description: '80% of rejected proposals fail here. We interrogate who suffers from the problem, concrete empirical evidence of failure, and why existing workarounds are inadequate.',
      tab: 'problem',
    },
    {
      num: '02',
      title: 'State of Knowledge',
      subtitle: 'Map the Unsolved Frontier',
      description: 'Establish what the field already agrees on versus the precise conceptual, architectural, or empirical bottleneck that has stalled previous researchers.',
      tab: 'knowledge',
    },
    {
      num: '03',
      title: 'Direction Trade-offs',
      subtitle: 'Novelty vs. Feasibility Frontier',
      description: 'Compare high-risk transformative versus high-feasibility incremental paths, calibrated against your runway (e.g. 12-week capstone vs 2-year thesis) and compute limits.',
      tab: 'tradeoffs',
    },
    {
      num: '04',
      title: 'Experiment Protocol',
      subtitle: 'Falsifiable Hypothesis & Metrics',
      description: 'Formulate crisp nullifiable hypotheses, baseline comparisons, dependent metrics, and define the scientific value of a negative result to ensure rigorous research.',
      tab: 'experiment',
    },
    {
      num: '05',
      title: 'Synthesized Brief',
      subtitle: 'Executive Thesis Pitch & BibTeX',
      description: 'Receive a cohesive, defensible document with elevator pitches, advisor critique points, prerequisite checklists, and publication-ready citations.',
      tab: 'brief',
    },
  ];

  const tools = [
    {
      title: 'Socratic Defense Lab',
      desc: 'Simulate high-stakes defense before a skeptical review committee and Reviewer #2 to uncover hidden vulnerabilities before committee submission.',
      tab: 'defense',
    },
    {
      title: 'Citation & AI Slop Auditor',
      desc: 'Audit research drafts with a visual Hallucination Risk Gauge, verifying DOIs against real indexes and stripping vacuous generative AI buzzwords.',
      tab: 'auditor',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span>Methodology & Advisory Framework</span>
              <span aria-hidden="true">·</span>
              <span>Ideally</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-serif-scholarly mt-1">
              How Ideally Advises Your Research
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-xl">
              Unlike generic LLM chats that generate code or superficial paper titles, Ideally enforces academic rigor through a structured 5-stage advisor pipeline.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg transition-colors shrink-0"
            aria-label="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 5-Stage Stepper Overview */}
        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-slate-500">
              The 5-Stage Research Formulation Pipeline
            </h3>

            <div className="grid grid-cols-1 gap-3">
              {stages.map((st) => (
                <div
                  key={st.num}
                  onClick={() => {
                    onSelectTab(st.tab);
                    onClose();
                  }}
                  className="p-4 rounded-xl border border-slate-200 hover:border-slate-400 bg-white hover:bg-slate-50/70 transition-all cursor-pointer flex items-start justify-between gap-4 group"
                >
                  <div className="flex items-start gap-3.5">
                    <span className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-slate-900 group-hover:text-white flex items-center justify-center font-mono-tabular text-xs font-bold text-slate-700 transition-colors shrink-0">
                      {st.num}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-slate-900 group-hover:text-slate-950">
                          {st.title}
                        </h4>
                        <span className="text-xs text-slate-500">· {st.subtitle}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {st.description}
                      </p>
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                </div>
              ))}
            </div>
          </div>

          {/* 10 Evidence Principles Section (Section 4) */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase tracking-wider font-semibold text-slate-500">
                The 10 Evidence Principles (Ideally Constitution)
              </h3>
              <span className="text-[11px] text-slate-400 font-mono-tabular">Section 4 Mandate</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs text-slate-700">
              <p className="font-semibold text-slate-900">
                AI must verify the problem before recommending a specific research direction:
              </p>
              <ol className="list-decimal pl-4 space-y-1.5 text-[11px] text-slate-600">
                <li><strong className="text-slate-800">Observation as Inquiry:</strong> Treat user observations as something to investigate, never as established fact.</li>
                <li><strong className="text-slate-800">Primary Literature:</strong> Search peer-reviewed papers, systems reports, and public datasets; prefer primary sources.</li>
                <li><strong className="text-slate-800">Signals ≠ Prevalence:</strong> Community forum/GitHub discussions signal a problem, but do not prove broad prevalence.</li>
                <li><strong className="text-slate-800">Traceable Claims:</strong> Every empirical claim must be traceable to supporting sources with date, context, scope, and limitations.</li>
                <li><strong className="text-slate-800">Four Evidence Classes:</strong> Distinguish evidence of existence, evidence of prevalence, evidence of causes, and evidence of solution efficacy.</li>
                <li><strong className="text-slate-800">Contradictory Findings:</strong> Actively search for counter-evidence, not just confirming findings.</li>
                <li><strong className="text-slate-800">Epistemic Separation:</strong> Strictly separate source-supported facts, AI inference, and proposed hypotheses.</li>
                <li><strong className="text-slate-800">Uncertainty Handling:</strong> Lack of literature does not prove novelty or non-existence; keep claims uncertain.</li>
                <li><strong className="text-slate-800">Zero Fabrication:</strong> Never fabricate citations; explicitly disclose if only an abstract was reviewed.</li>
                <li><strong className="text-slate-800">Illustrations ≠ Evidence:</strong> Clearly label diagrams and simulated outcomes as testable hypotheses, not achieved results.</li>
              </ol>
              <div className="pt-2 text-[11px] text-slate-800 font-medium italic border-t border-slate-200/60">
                "Defending the reason for choosing a direction includes the ability to revise or abandon that direction when evidence does not support it."
              </div>
            </div>
          </div>

          {/* Verification Tools Section */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-slate-500">
              Post-Formulation Verification Labs
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {tools.map((t) => (
                <div
                  key={t.title}
                  onClick={() => {
                    onSelectTab(t.tab);
                    onClose();
                  }}
                  className="p-4 rounded-xl border border-slate-200 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-900">
                      {t.title}
                    </h4>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    {t.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Click any stage above to jump directly into that step</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
