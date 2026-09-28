import React from 'react';
import { BookOpen, CheckCircle, ArrowRight, ArrowLeft, HelpCircle } from 'lucide-react';
import { KnowledgeLandscape } from '../types/research';

interface KnowledgeLandscapeViewProps {
  landscape: KnowledgeLandscape;
  domain: string;
  onProceed: () => void;
  onBack?: () => void;
}

export const KnowledgeLandscapeView: React.FC<KnowledgeLandscapeViewProps> = ({
  landscape,
  domain,
  onProceed,
  onBack,
}) => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto py-8 px-4 sm:px-6">
      {/* Stage Header & Top Navigation Controls */}
      <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Stage 02 of 05</span>
            <span aria-hidden="true">·</span>
            <span>{domain}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-serif-scholarly mt-1">
            State of Knowledge & The Unsolved Frontier
          </h1>
          <p className="text-sm text-slate-600 mt-2 max-w-3xl">
            Effective research does not reinvent established consensus. Ideally maps what is already solved against the exact bottleneck holding the field back.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
          {onBack && (
            <button
              onClick={onBack}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back: Problem</span>
            </button>
          )}
          <button
            onClick={onProceed}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <span>Next: Direction Trade-offs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Established Consensus */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>Established Scientific & Engineering Consensus</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {landscape.establishedConsensus.map((point, idx) => (
            <div key={idx} className="p-4 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed">
              <span className="font-semibold text-slate-900 block mb-1">0{idx + 1}. Established Baseline</span>
              {point}
            </div>
          ))}
        </div>
      </div>

      {/* Existing Approaches & Limitations Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <BookOpen className="w-4 h-4 text-slate-700" />
          <span>Existing Paradigms & Why They Stall</span>
        </div>

        <div className="space-y-4 pt-1">
          {landscape.existingApproaches.map((app, idx) => (
            <div key={idx} className="p-4 rounded-lg bg-slate-50 border border-slate-100 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="font-semibold text-sm text-slate-900">{app.approachName}</span>
                <span className="text-xs text-slate-500 font-mono-tabular">Paradigm: {app.representativeParadigm}</span>
              </div>
              <p className="text-xs text-rose-700/90 leading-relaxed">
                <span className="font-medium text-rose-900">Bottleneck / Limitation: </span>
                {app.primaryLimitation}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* The Critical Knowledge Gap & Why Unsolved */}
      <div className="bg-slate-900 text-white rounded-xl p-6 sm:p-8 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-amber-400 font-mono-tabular">
          <HelpCircle className="w-4 h-4" />
          <span>The Critical Knowledge Gap</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-serif-scholarly font-medium leading-snug text-slate-100">
          "{landscape.criticalKnowledgeGap}"
        </h2>

        <div className="pt-4 border-t border-slate-800 text-sm text-slate-300 space-y-1">
          <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
            Why has this remained unsolved until now?
          </div>
          <p className="text-slate-300 leading-relaxed">
            {landscape.whyUnsolvedUntilNow}
          </p>
        </div>
      </div>

      {/* Next Step Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <div className="text-xs text-slate-500">
          Step 2 of 5: Gap identified against existing state of the art
        </div>
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back: Problem Grounding</span>
            </button>
          )}
          <button
            onClick={onProceed}
            className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <span>Compare Research Directions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
