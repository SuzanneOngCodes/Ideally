import React from 'react';
import { CheckCircle2, ShieldAlert, Award, Compass, ArrowRight, ArrowLeft } from 'lucide-react';
import { ResearchDirection } from '../types/research';

interface DirectionTradeoffsViewProps {
  directions: ResearchDirection[];
  selectedDirectionId: string;
  onSelectDirection: (directionId: string) => void;
  selectionRationale: string;
  onProceed: () => void;
  onBack?: () => void;
  userContext: string;
  timeHorizonWeeks: number;
}

export const DirectionTradeoffsView: React.FC<DirectionTradeoffsViewProps> = ({
  directions,
  selectedDirectionId,
  onSelectDirection,
  selectionRationale,
  onProceed,
  onBack,
  userContext,
  timeHorizonWeeks,
}) => {
  const selectedDirection = directions.find((d) => d.id === selectedDirectionId) || directions[0];

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-8 px-4 sm:px-6">
      {/* Stage Header & Top Navigation Controls */}
      <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Stage 03 of 05</span>
            <span aria-hidden="true">·</span>
            <span>{userContext.replace('_', ' ')} · {timeHorizonWeeks} Weeks Runway</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-serif-scholarly mt-1">
            Research Direction Exploration & Trade-off Frontier
          </h1>
          <p className="text-sm text-slate-600 mt-2 max-w-3xl">
            A research question can be attacked through multiple methodological paradigms. Ideally evaluates candidate directions on novelty, execution feasibility, and failure risk given your specific constraints.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
          {onBack && (
            <button
              onClick={onBack}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back: Knowledge</span>
            </button>
          )}
          <button
            onClick={onProceed}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <span>Next: Experiment Protocol</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Candidate Directions Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {directions.map((direction) => {
          const isSelected = direction.id === selectedDirectionId;
          const isRecommended = direction.isRecommended;

          return (
            <div
              key={direction.id}
              onClick={() => onSelectDirection(direction.id)}
              className={`rounded-xl border p-5 transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'border-slate-900 bg-slate-50/70 shadow-xs ring-1 ring-slate-900'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/40'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 font-mono-tabular">
                    {direction.directionType.replace('_', ' ')}
                  </span>
                  {isRecommended && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      <Award className="w-3 h-3" />
                      Advisor Pick
                    </span>
                  )}
                </div>

                <h3 className="font-semibold text-base text-slate-900 leading-snug">
                  {direction.title}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {direction.summary}
                </p>

                {/* Score Meters */}
                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-600 mb-1">
                      <span>Academic Novelty</span>
                      <span className="font-mono-tabular font-semibold text-slate-900">
                        {direction.tradeoffs.noveltyScore}/10
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-800 rounded-full"
                        style={{ width: `${direction.tradeoffs.noveltyScore * 10}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-600 mb-1">
                      <span>Feasibility ({timeHorizonWeeks}w)</span>
                      <span className="font-mono-tabular font-semibold text-slate-900">
                        {direction.tradeoffs.feasibilityScore}/10
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-800 rounded-full"
                        style={{ width: `${direction.tradeoffs.feasibilityScore * 10}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Selection Toggle Button */}
              <div className="pt-4 mt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectDirection(direction.id);
                  }}
                  className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    isSelected
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      <span>Selected Direction</span>
                    </>
                  ) : (
                    <span>Select This Direction</span>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Direction Deep-Dive */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
              Active Focus Paradigm
            </span>
            <h2 className="text-xl font-bold text-slate-900 font-serif-scholarly mt-0.5">
              {selectedDirection.title}
            </h2>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500 font-mono-tabular">
            <span>Risk Level: {selectedDirection.tradeoffs.riskLevel}</span>
            <span aria-hidden="true">·</span>
            <span>Impact Score: {selectedDirection.tradeoffs.impactScore}/10</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm">
          <div className="space-y-4">
            <div>
              <div className="font-semibold text-slate-900 mb-1">
                Core Methodology & Approach:
              </div>
              <p className="text-slate-700 leading-relaxed">
                {selectedDirection.summary}
              </p>
            </div>

            <div>
              <div className="font-semibold text-slate-900 mb-1">
                Why Pursue This Direction?
              </div>
              <p className="text-slate-600 leading-relaxed">
                {selectedDirection.whyPursue}
              </p>
            </div>

            <div>
              <div className="font-semibold text-slate-900 mb-1">
                Suitability for Milestone Context:
              </div>
              <p className="text-slate-600 leading-relaxed">
                {selectedDirection.suitabilityForContext}
              </p>
            </div>
          </div>

          <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div>
              <div className="font-semibold text-slate-900 mb-2">
                Required Prerequisite Resources:
              </div>
              <ul className="space-y-1.5 text-slate-700 text-xs">
                {selectedDirection.requiredResources.map((res, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    <span>{res}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2 border-t border-slate-200/60">
              <div className="flex items-center gap-1.5 font-semibold text-rose-800 mb-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Primary Pitfall to Guard Against:</span>
              </div>
              <p className="text-rose-900/90 leading-relaxed text-xs">
                {selectedDirection.potentialPitfalls}
              </p>
            </div>
          </div>
        </div>

        {/* Global Selection Rationale Callout */}
        <div className="p-4 rounded-lg bg-slate-900 text-slate-100 text-xs sm:text-sm">
          <span className="font-semibold text-amber-400">Advisory Committee Verdict: </span>
          <span>{selectionRationale}</span>
        </div>
      </div>

      {/* Next Step Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <div className="text-xs text-slate-500">
          Step 3 of 5: Direction selected — proceeding to experiment specification
        </div>
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back: State of Knowledge</span>
            </button>
          )}
          <button
            onClick={onProceed}
            className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <span>Design Experiment Protocol</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
