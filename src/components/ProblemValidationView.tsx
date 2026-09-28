import React from 'react';
import { AlertCircle, Users, XCircle, FileText, ArrowRight, ArrowLeft } from 'lucide-react';
import { ProblemValidation } from '../types/research';

interface ProblemValidationViewProps {
  validation: ProblemValidation;
  domain: string;
  onProceed: () => void;
  onBack?: () => void;
}

export const ProblemValidationView: React.FC<ProblemValidationViewProps> = ({
  validation,
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
            <span>Stage 01 of 05</span>
            <span aria-hidden="true">·</span>
            <span>{domain}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-serif-scholarly mt-1">
            Problem Grounding & Real-World Validation
          </h1>
          <p className="text-sm text-slate-600 mt-2 max-w-3xl">
            Before formulating methodologies or code, Ideally interrogates why this problem matters: the concrete human and industrial friction, who bears the cost, and why existing practices break down.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
          {onBack && (
            <button
              onClick={onBack}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Intake</span>
            </button>
          )}
          <button
            onClick={onProceed}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <span>Next: State of Knowledge</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Primary Problem Statement Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-slate-100 rounded-lg text-slate-700 shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-slate-900">
              Core Problem Statement
            </h2>
            <p className="text-base text-slate-700 leading-relaxed font-serif-scholarly">
              {validation.coreProblemStatement}
            </p>
          </div>
        </div>

        {/* Real-World Impact Callout */}
        <div className="mt-4 pt-4 border-t border-slate-100 bg-slate-50/80 -mx-6 -mb-6 p-6 rounded-b-xl">
          <div className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1">
            Societal & Industrial Impact
          </div>
          <p className="text-sm text-slate-800 leading-relaxed">
            {validation.realWorldImpact}
          </p>
        </div>
      </div>

      {/* Stakeholders & Failure Modes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Affected Stakeholders */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Users className="w-4 h-4 text-slate-700" />
            <span>Affected Stakeholders & Ecosystem</span>
          </div>

          <div className="space-y-2.5">
            {validation.stakeholdersAffected.map((stakeholder, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-mono-tabular text-[11px] font-bold shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {stakeholder}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Current Inadequacies & Failure Modes */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <XCircle className="w-4 h-4 text-rose-600" />
            <span>Status Quo Failure Modes</span>
          </div>

          <div className="space-y-2.5">
            {validation.failureModesOfStatusQuo.map((failureMode, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-mono-tabular text-[11px] font-bold shrink-0 mt-0.5">
                  !
                </span>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {failureMode}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Empirical Grounding Evidence Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <FileText className="w-4 h-4 text-slate-700" />
            <span>Empirical Grounding Evidence</span>
          </div>
          <span className="text-xs text-slate-400">Verifiable Phenomena</span>
        </div>

        <div className="space-y-3">
          {validation.evidencePoints.map((ev, idx) => (
            <div key={idx} className="p-4 rounded-lg bg-slate-50 border border-slate-100 space-y-2">
              <div className="text-sm font-medium text-slate-900 font-serif-scholarly">
                "{ev.claim}"
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Source: {ev.phenomenonOrSource}</span>
                <span aria-hidden="true">·</span>
                <span>Significance: {ev.realWorldSignificance}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Urgency Verdict */}
        <div className="mt-4 p-4 rounded-lg bg-amber-50/70 border border-amber-200/60 text-amber-900 text-sm">
          <span className="font-semibold">Urgency Assessment: </span>
          <span>{validation.urgencyVerdict}</span>
        </div>
      </div>

      {/* Next Step Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <div className="text-xs text-slate-500">
          Step 1 of 5: Problem grounded in verified real-world symptoms
        </div>
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Intake</span>
            </button>
          )}
          <button
            onClick={onProceed}
            className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <span>Examine State of Knowledge</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
