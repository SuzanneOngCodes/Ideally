import React, { useState } from 'react';
import { X, Search, BookOpen, CheckCircle, Scale, AlertCircle, Sparkles, HelpCircle, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface TerminologyGlossaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSearch?: string;
}

interface GlossaryTerm {
  term: string;
  category: 'scientific_method' | 'evidence_status' | 'experiment_design' | 'review_defense';
  plainEnglish: string;
  academicDefinition: string;
  example: string;
  whyItMatters: string;
}

const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    term: 'Falsifiable Hypothesis',
    category: 'scientific_method',
    plainEnglish: 'A statement that can be proven WRONG by an experiment, not just an opinion or vague goal.',
    academicDefinition: 'An empirical proposition subject to Karl Popper’s criterion of demarcation, possessing non-empty potential falsifiers and operationalized dependent metric thresholds.',
    example: '"Model A will achieve <30ms p99 latency with Macro-F1 >= 91.5% on benchmark X" (can be tested and disproven).',
    whyItMatters: 'If your hypothesis cannot fail, it is not science—it is just rhetoric.',
  },
  {
    term: 'Source-Supported (Badge)',
    category: 'evidence_status',
    plainEnglish: 'Backed directly by published peer-reviewed papers or real-world industrial measurements.',
    academicDefinition: 'Claims grounded in identifiable, primary bibliographic citations or verifiable benchmark datasets with documented methodology.',
    example: 'A citation to a peer-reviewed ACM/IEEE paper demonstrating 12ms latency on an ARM Cortex chip.',
    whyItMatters: 'Protects you from building a research proposal on fabricated rumors or LLM hallucinations.',
  },
  {
    term: 'AI-Inferred (Badge)',
    category: 'evidence_status',
    plainEnglish: 'A logical deduction made by the AI advisor. It makes sense, but has NOT been proven yet.',
    academicDefinition: 'A synthesized deductive or inductive inference derived from cross-domain literature schemas, requiring empirical validation before acceptance.',
    example: 'Predicting that a specific compression algorithm will reduce memory on an unseen dataset.',
    whyItMatters: 'Treating AI guesses as established facts will result in immediate rejection by academic reviewers.',
  },
  {
    term: 'Insufficient Evidence (Badge)',
    category: 'evidence_status',
    plainEnglish: 'A blind spot in current science. No one has published trustworthy proof yet.',
    academicDefinition: 'An empirical lacuna characterized by absence of controlled comparative studies, high risk of publication bias, or confounding measurement artifacts.',
    example: 'Testing whether small models outperform large ones on newly released private enterprise datasets.',
    whyItMatters: 'Acknowledging what you do not know demonstrates scientific maturity and prevents overclaiming.',
  },
  {
    term: 'Disconfirming Evidence',
    category: 'scientific_method',
    plainEnglish: 'Findings, papers, or negative results that contradict your hunch.',
    academicDefinition: 'Literature or empirical observations demonstrating counter-examples, boundary conditions, or failure modes to guard against confirmation bias.',
    example: 'Discovering a 2024 paper showing that the proposed latency trick drops accuracy by 25% on long sequences.',
    whyItMatters: 'Revealing counter-evidence early prevents wasting 6 months on a flawed experimental design.',
  },
  {
    term: 'Pareto Frontier / Trade-off',
    category: 'experiment_design',
    plainEnglish: 'The sweet spot where you cannot improve speed without sacrificing accuracy or cost.',
    academicDefinition: 'The set of non-dominated parameter configurations in multi-objective optimization where no criterion can be improved without degrading at least one other criterion.',
    example: 'Trading 1% accuracy for an 80% reduction in inference latency and 90% lower compute cost.',
    whyItMatters: 'Real engineering is about managing trade-offs, not claiming magical perfection.',
  },
  {
    term: 'Threats to Internal Validity',
    category: 'experiment_design',
    plainEnglish: 'Hidden bugs, data leaks, or unfair comparison conditions that secretly cause your result.',
    academicDefinition: 'Systematic errors or confounding variables within experimental apparatus that undermine the causal inference between independent and dependent variables.',
    example: 'Testing the baseline on a cold cache while testing your new model on a warm cache.',
    whyItMatters: 'Reviewer #2 will destroy a paper if baseline comparisons are not strictly standardized.',
  },
  {
    term: 'Threats to External Validity',
    category: 'experiment_design',
    plainEnglish: 'Does your solution work in the real messy world, or only on your clean test dataset?',
    academicDefinition: 'The degree to which empirical findings generalize across alternative populations, operational environments, and temporal distributions.',
    example: 'A model trained on clean Wikipedia text failing catastrophically on noisy social media or customer chats.',
    whyItMatters: 'Employers and academic committees want to see practical real-world applicability.',
  },
  {
    term: 'Reviewer #2',
    category: 'review_defense',
    plainEnglish: 'The legendary hyper-critical academic peer reviewer who questions every assumption.',
    academicDefinition: 'The archetype of the adversarial, methodology-focused peer reviewer who scrutinizes control baselines, hardware specs, and statistical significance.',
    example: '"Why did the authors compare against an unoptimized 8B model instead of a properly quantized INT4 checkpoint?"',
    whyItMatters: 'Our Socratic Defense Lab trains you to anticipate their critiques before you submit your thesis or paper.',
  },
  {
    term: 'AI Slop & Empty Rhetoric',
    category: 'review_defense',
    plainEnglish: 'Grand-sounding, buzzword-filled sentences that say nothing concrete.',
    academicDefinition: 'Vacuous generative text devoid of operationalized definitions, characterized by unfalsifiable superlatives ("game-changing paradigm shift") and lack of empirical density.',
    example: '"This novel synergistic framework seamlessly revolutionizes AI paradigms" vs. "This model reduces p99 latency from 320ms to 24ms".',
    whyItMatters: 'Modern academic conferences and thesis committees immediately reject papers contaminated with AI buzzwords.',
  },
];

export const TerminologyGlossaryModal: React.FC<TerminologyGlossaryModalProps> = ({
  isOpen,
  onClose,
  initialSearch = '',
}) => {
  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { currentLanguage } = useLanguage();

  if (!isOpen) return null;

  const filtered = GLOSSARY_TERMS.filter((item) => {
    const matchesSearch =
      item.term.toLowerCase().includes(search.toLowerCase()) ||
      item.plainEnglish.toLowerCase().includes(search.toLowerCase()) ||
      item.academicDefinition.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[88vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span>Research Terminology Guide</span>
              <span aria-hidden="true">·</span>
              <span>For Beginners & Experts</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-serif-scholarly mt-1">
              Plain English & Academic Glossary
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl">
              Demystifying scientific vocabulary: learn what research terms mean in simple terms alongside their rigorous definitions.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg transition-colors shrink-0"
            aria-label="Close glossary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="p-4 border-b border-slate-100 bg-white flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search concepts (e.g. Falsifiable, Internal Validity, Pareto, Slop)..."
              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white font-medium'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Terms
            </button>
            <button
              onClick={() => setSelectedCategory('scientific_method')}
              className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap ${
                selectedCategory === 'scientific_method'
                  ? 'bg-slate-900 text-white font-medium'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Scientific Method
            </button>
            <button
              onClick={() => setSelectedCategory('evidence_status')}
              className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap ${
                selectedCategory === 'evidence_status'
                  ? 'bg-slate-900 text-white font-medium'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Evidence Badges
            </button>
            <button
              onClick={() => setSelectedCategory('experiment_design')}
              className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap ${
                selectedCategory === 'experiment_design'
                  ? 'bg-slate-900 text-white font-medium'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Experiments
            </button>
          </div>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No matching terms found. Try searching for "hypothesis", "validity", or "evidence".
            </div>
          ) : (
            filtered.map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs hover:border-slate-300 transition-colors space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>{item.term}</span>
                    </h3>
                    <div className="mt-1 text-xs text-indigo-900 bg-indigo-50/80 px-2.5 py-1 rounded-md border border-indigo-100 font-medium">
                      💡 <span className="font-semibold">Plain English:</span> {item.plainEnglish}
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-mono-tabular px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-semibold shrink-0">
                    {item.category.replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Formal Academic Definition
                    </span>
                    <p className="text-slate-700 leading-relaxed font-serif-scholarly">
                      {item.academicDefinition}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-100 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                      Concrete Example
                    </span>
                    <p className="text-amber-900/90 leading-relaxed font-mono text-[11px]">
                      {item.example}
                    </p>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 pt-1 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    <strong className="text-slate-700">Why this matters:</strong> {item.whyItMatters}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs text-slate-500">
          <span>{filtered.length} terms cataloged · Dual-Audience Scientific Framework</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
