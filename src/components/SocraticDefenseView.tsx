import React, { useState } from 'react';
import { ShieldCheck, MessageSquare, Send, Award, HelpCircle, Loader2, RefreshCw } from 'lucide-react';
import { ResearchBrief, SocraticDefenseProbe } from '../types/research';

interface SocraticDefenseViewProps {
  brief: ResearchBrief;
  probes: SocraticDefenseProbe[];
  onRefreshProbes: () => Promise<void>;
  onSubmitDefense: (probeId: string, answer: string) => Promise<any>;
}

export const SocraticDefenseView: React.FC<SocraticDefenseViewProps> = ({
  brief,
  probes,
  onRefreshProbes,
  onSubmitDefense,
}) => {
  const [selectedProbeId, setSelectedProbeId] = useState<string>(probes[0]?.id || '');
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [evaluations, setEvaluations] = useState<Record<string, any>>({});

  const activeProbe = probes.find((p) => p.id === selectedProbeId) || probes[0];
  const activeEval = activeProbe ? evaluations[activeProbe.id] : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAnswer.trim() || !activeProbe) return;

    setEvaluating(true);
    try {
      const res = await onSubmitDefense(activeProbe.id, userAnswer);
      if (res?.evaluation) {
        setEvaluations((prev) => ({ ...prev, [activeProbe.id]: res.evaluation }));
      }
    } finally {
      setEvaluating(false);
    }
  };

  const handleSelectExampleAnswer = (ans: string) => {
    setUserAnswer(ans);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefreshProbes();
    } finally {
      setRefreshing(false);
    }
  };

  if (!activeProbe) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <p className="text-slate-600">No defense probes available yet.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Socratic Defense Lab</span>
            <span aria-hidden="true">·</span>
            <span>Committee Rehearsal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-serif-scholarly mt-1">
            Defend Your Research Proposal
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Simulate a rigorous examination before your advisory committee and Reviewer #2. Test your defenses against confounding variables, baseline fairness, and operational realities.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-auto shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>New Committee Probes</span>
        </button>
      </div>

      {/* Probe Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {probes.map((probe, idx) => {
          const isSelected = probe.id === activeProbe.id;
          const hasEval = !!evaluations[probe.id];

          return (
            <button
              key={probe.id}
              onClick={() => {
                setSelectedProbeId(probe.id);
                setUserAnswer('');
              }}
              className={`p-3.5 rounded-lg border text-left transition-all ${
                isSelected
                  ? 'border-slate-900 bg-slate-50/70 shadow-xs ring-1 ring-slate-900'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono-tabular mb-1">
                <span>PROBE 0{idx + 1}</span>
                {hasEval && (
                  <span className="text-emerald-700 font-bold">Defended ✓</span>
                )}
              </div>
              <div className="text-xs font-semibold text-slate-900 truncate">
                {probe.persona}
              </div>
              <div className="text-[11px] text-slate-500 truncate mt-0.5">
                {probe.probingTopic}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Probe & Defense Interface */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        {/* Committee Question */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <MessageSquare className="w-3.5 h-3.5 text-slate-700" />
            <span>Question from {activeProbe.persona}</span>
          </div>

          <blockquote className="p-4 rounded-lg bg-slate-50 border-l-4 border-slate-900 text-sm sm:text-base font-serif-scholarly font-medium text-slate-900 leading-relaxed">
            "{activeProbe.question}"
          </blockquote>

          {/* Suggested defense arguments */}
          {activeProbe.exampleAnswers && activeProbe.exampleAnswers.length > 0 && (
            <div className="pt-2 space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Strategic Defense Anchors (Click to adopt)
              </span>
              <div className="space-y-1.5">
                {activeProbe.exampleAnswers.map((ex, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectExampleAnswer(ex)}
                    className="w-full text-left p-2.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200/70 text-xs text-slate-700 transition-colors flex items-start gap-2"
                  >
                    <span className="text-slate-400 font-mono-tabular shrink-0">#{i + 1}</span>
                    <span>{ex}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Defense Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label htmlFor="defense-ans" className="block text-xs uppercase tracking-wider font-semibold text-slate-700 mb-1">
              Your Scientific Defense Argument
            </label>
            <textarea
              id="defense-ans"
              rows={3}
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="State your technical justification, citing variables, baselines, or statistical bounds..."
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 placeholder:text-slate-400"
              required
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              The advisor evaluates your argument on methodological validity and resilience.
            </span>

            <button
              type="submit"
              disabled={evaluating || !userAnswer.trim()}
              className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              {evaluating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Committee Evaluating...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Defense</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Committee Evaluation Result */}
        {activeEval && (
          <div className="mt-6 pt-6 border-t border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-700" />
                <span className="text-sm font-semibold text-slate-900">
                  Advisory Committee Assessment
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-mono-tabular text-sm font-bold text-slate-900">
                <span>Defense Score:</span>
                <span className="px-2 py-0.5 rounded bg-slate-900 text-white text-xs">
                  {activeEval.strengthScore}/10
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-lg bg-emerald-50/70 border border-emerald-200/60 space-y-1">
                <span className="font-semibold text-emerald-900 uppercase block">Strengths</span>
                <ul className="space-y-1 text-emerald-800">
                  {activeEval.strengths?.map((str: string, i: number) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span>✓</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3.5 rounded-lg bg-rose-50/70 border border-rose-200/60 space-y-1">
                <span className="font-semibold text-rose-900 uppercase block">Remaining Vulnerabilities</span>
                <ul className="space-y-1 text-rose-800">
                  {activeEval.vulnerabilities?.map((vul: string, i: number) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span>!</span>
                      <span>{vul}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {activeEval.advisorTip && (
              <div className="p-4 rounded-lg bg-slate-900 text-slate-200 text-xs space-y-1">
                <span className="text-amber-400 font-semibold uppercase tracking-wider block font-mono-tabular">
                  Advisor Strategic Tip for Paper / Defense:
                </span>
                <p className="leading-relaxed text-slate-100 font-serif-scholarly">
                  {activeEval.advisorTip}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
