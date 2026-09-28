import React from 'react';
import { X, ShieldCheck } from 'lucide-react';

interface EvidencePrinciplesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EvidencePrinciplesModal: React.FC<EvidencePrinciplesModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const principles = [
    { num: '01', title: 'Observation as Inquiry', desc: "Treat the researcher's initial observation as an empirical question to investigate, not as an established fact." },
    { num: '02', title: 'Primary Sources First', desc: 'Prioritize peer-reviewed scientific papers, official technical reports, and public benchmark datasets over secondary blog commentary.' },
    { num: '03', title: 'Community Signals ≠ Proof', desc: 'GitHub issues, forum complaints, and social discussions signal friction, but do not prove its statistical prevalence or root cause.' },
    { num: '04', title: 'Empirical Traceability', desc: 'Every empirical claim must be traceable to supporting source content, including its date, operational context, and limitations.' },
    { num: '05', title: 'Epistemic Categorization', desc: 'Strictly distinguish evidence of problem existence, evidence of prevalence, evidence of causal mechanism, and evidence of solution efficacy.' },
    { num: '06', title: 'Mandatory Contradictory Findings', desc: 'Actively search for contradictory evidence, negative results, and boundary conditions to prevent confirmation bias.' },
    { num: '07', title: 'Clear Epistemic Separation', desc: 'Explicitly separate source-supported facts, AI inference, and proposed falsifiable hypotheses.' },
    { num: '08', title: 'Uncertainty & Lack of Literature', desc: 'A lack of published papers does not prove a problem is novel or non-existent. Keep claims uncertain until verified with data.' },
    { num: '09', title: 'Zero Fabrication & Scope Disclosures', desc: 'Never fabricate sources, statistics, or metrics. If only an abstract was reviewed, disclose that explicitly.' },
    { num: '10', title: 'Illustrations ≠ Evidence', desc: 'Illustrations, mechanism diagrams, and expected outcomes are hypotheses, not achieved empirical results.' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/60">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Core Methodological Tenets</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 font-serif-scholarly">
              The 10 Evidence Principles
            </h2>
            <p className="text-xs text-slate-600">
              Standards enforced by Ideally to ensure research proposals withstand critical peer review.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close principles guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-2.5 text-xs">
          {principles.map((p) => (
            <div key={p.num} className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 flex items-start gap-3">
              <span className="font-bold text-slate-900 font-mono-tabular text-xs bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0">
                {p.num}
              </span>
              <div>
                <span className="font-semibold text-slate-900">{p.title}: </span>
                <span className="text-slate-600 leading-relaxed">{p.desc}</span>
              </div>
            </div>
          ))}

          <div className="p-3.5 rounded-xl bg-slate-900 text-white text-xs mt-3">
            <span className="font-semibold text-emerald-400 block mb-0.5">Defensibility Mandate:</span>
            "Defending the reason for choosing a direction includes the ability to revise or abandon that direction when evidence fails."
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-2xs"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
