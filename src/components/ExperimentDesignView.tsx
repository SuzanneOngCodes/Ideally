import React from 'react';
import { Target, Layers, Clock, AlertTriangle, ArrowRight, ArrowLeft, ShieldCheck } from 'lucide-react';
import { ExperimentDesign } from '../types/research';

interface ExperimentDesignViewProps {
  design: ExperimentDesign;
  onProceed: () => void;
  onBack?: () => void;
  title: string;
}

export const ExperimentDesignView: React.FC<ExperimentDesignViewProps> = ({
  design,
  onProceed,
  onBack,
  title,
}) => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto py-8 px-4 sm:px-6">
      {/* Stage Header & Top Navigation Controls */}
      <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Stage 04 of 05</span>
            <span aria-hidden="true">·</span>
            <span>Empirical Rigor</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-serif-scholarly mt-1">
            Experiment Protocol & Falsification Design
          </h1>
          <p className="text-sm text-slate-600 mt-2 max-w-3xl">
            A research proposal is only as strong as its ability to be falsified. Ideally defines your independent variables, baseline controls, phased stop/go criteria, and the scientific value of a negative outcome.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
          {onBack && (
            <button
              onClick={onBack}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back: Trade-offs</span>
            </button>
          )}
          <button
            onClick={onProceed}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <span>Next: Research Brief</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Core Question & Falsifiable Hypothesis */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <Target className="w-3.5 h-3.5 text-slate-700" />
            <span>Primary Research Question</span>
          </div>
          <h2 className="text-lg font-semibold text-slate-900 font-serif-scholarly">
            {design.primaryResearchQuestion}
          </h2>
        </div>

        <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
          <div className="text-xs uppercase tracking-wider font-semibold text-slate-600">
            Falsifiable Core Hypothesis (Nullifiable)
          </div>
          <p className="text-sm text-slate-900 font-medium leading-relaxed font-serif-scholarly">
            "{design.falsifiableHypothesis}"
          </p>
        </div>
      </div>

      {/* Variables & Dependent Metrics */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Layers className="w-4 h-4 text-slate-700" />
          <span>Experimental Variables & Quantitative Metrics</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Independent Variables (Manipulated)
            </span>
            <ul className="space-y-1.5 text-xs text-slate-700">
              {design.independentVariables.map((v, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                  <span>{v}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Control Baselines
            </span>
            <ul className="space-y-1.5 text-xs text-slate-700">
              {design.baselinesAndControls.map((b, i) => (
                <li key={i} className="flex flex-col gap-0.5">
                  <span className="font-semibold text-slate-900">· {b.name} ({b.type.replace('_', ' ')})</span>
                  <span className="text-slate-500 pl-2">{b.rationale}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Dependent Variables & Metric Targets */}
        <div className="space-y-3 pt-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Dependent Variables & Evaluation Criteria
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {design.dependentVariablesAndMetrics.map((m, i) => (
              <div key={i} className="p-3.5 rounded-lg border border-slate-200 bg-white space-y-1">
                <div className="font-semibold text-xs text-slate-900">{m.metric}</div>
                <div className="text-xs text-slate-600">Method: {m.evaluationMethod}</div>
                <div className="text-xs font-mono-tabular text-emerald-700 font-medium">
                  Falsification Threshold: {m.targetBenchmark}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Phased Execution Runway */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Clock className="w-4 h-4 text-slate-700" />
          <span>Execution Runway & Stop/Go Checkpoints</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {design.milestoneTimeline.map((milestone, idx) => (
            <div key={idx} className="p-4 rounded-lg bg-slate-50 border border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900">
                  Phase 0{idx + 1}: {milestone.phase}
                </span>
                <span className="text-[11px] text-slate-500 font-mono-tabular">
                  {milestone.durationWeeks} wks
                </span>
              </div>
              <p className="text-xs text-slate-600">
                <span className="font-medium text-slate-700">Objective: </span>
                {milestone.objective}
              </p>
              <div className="pt-2 border-t border-slate-200 text-xs text-amber-900 font-mono-tabular">
                <span className="font-semibold">Stop/Go Criteria: </span>
                {milestone.stopGoCriteria}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Threats to Validity & Scientific Value of Negative Result */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Threats to Validity & Pre-emptive Mitigations</span>
          </div>

          <div className="space-y-3">
            {design.validityThreats.map((vt, i) => (
              <div key={i} className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                <div className="text-xs font-semibold text-slate-900 capitalize">
                  [{vt.threatType} Validity] {vt.description}
                </div>
                <p className="text-xs text-slate-600">
                  <span className="font-semibold">Mitigation: </span>{vt.mitigationStrategy}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Negative Result Value */}
        <div className="bg-slate-900 text-white rounded-xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider font-mono-tabular">
              <ShieldCheck className="w-4 h-4" />
              <span>Scientific Value of a Negative Result</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-serif-scholarly">
              {design.negativeResultValue}
            </p>
          </div>

          <div className="pt-3 border-t border-slate-800 text-xs text-slate-400 font-mono-tabular">
            <span className="text-white font-semibold">Success Threshold: </span>
            {design.successDefinition}
          </div>
        </div>
      </div>

      {/* Next Step Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <div className="text-xs text-slate-500">
          Step 4 of 5: Protocol verified with explicit falsification conditions
        </div>
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back: Trade-offs</span>
            </button>
          )}
          <button
            onClick={onProceed}
            className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <span>View Synthesized Research Brief</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
