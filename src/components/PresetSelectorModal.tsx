import React from 'react';
import { X, ArrowRight, CheckCircle2, Clock, Cpu } from 'lucide-react';
import { PRESET_SCENARIOS, PresetScenario } from '../data/presetScenarios';

interface PresetSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (preset: PresetScenario) => void;
  currentPresetId?: string;
}

export const PresetSelectorModal: React.FC<PresetSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectPreset,
  currentPresetId,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-serif-scholarly">
              Research Archetypes & Case Studies
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Select a pre-loaded, evidence-backed research scenario to inspect how Ideally formulates problem validation, trade-offs, and experiment design.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {PRESET_SCENARIOS.map((preset) => {
            const isSelected = preset.id === currentPresetId;
            return (
              <div
                key={preset.id}
                className={`p-5 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-slate-900 bg-slate-50/70 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/40'
                }`}
                onClick={() => {
                  onSelectPreset(preset);
                  onClose();
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">{preset.domain}</span>
                      <span aria-hidden="true">·</span>
                      <span className="capitalize">{preset.context.replace('_', ' ')}</span>
                      <span aria-hidden="true">·</span>
                      <span>{preset.brief.intake.constraints.timeHorizonWeeks}w runway</span>
                    </div>

                    <h3 className="text-base font-semibold text-slate-900">
                      {preset.name}
                    </h3>
                    <p className="text-sm text-slate-600 line-clamp-2">
                      {preset.tagline}
                    </p>

                    <div className="pt-2 flex items-center gap-4 text-xs text-slate-500 font-mono-tabular">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {preset.brief.intake.constraints.timeHorizonWeeks} Weeks
                      </span>
                      <span className="flex items-center gap-1">
                        <Cpu className="w-3.5 h-3.5 text-slate-400" />
                        {preset.brief.intake.constraints.computeTier}
                      </span>
                      <span>
                        Falsifiable Target: {preset.brief.experimentDesign.dependentVariablesAndMetrics[0]?.targetBenchmark || 'Rigorous Empirical Bound'}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {isSelected ? (
                      <span className="text-xs font-medium text-slate-900 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-slate-900" />
                        Active
                      </span>
                    ) : (
                      <button
                        className="px-3 py-1.5 text-xs font-medium text-slate-900 bg-slate-100 hover:bg-slate-900 hover:text-white rounded-lg transition-colors flex items-center gap-1"
                      >
                        Load Case
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>You can also formulate custom research problems using the "Start Intake" wizard.</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 font-medium text-slate-700 hover:text-slate-900"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
