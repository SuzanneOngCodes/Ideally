import React, { useState } from 'react';
import { Download, Printer, Copy, Check, Shield, FileText, ArrowRight, ArrowLeft, Layers, Compass, BookOpen, AlertCircle, Languages, RefreshCw, Globe } from 'lucide-react';
import { ResearchBrief } from '../types/research';
import { generateMarkdownBrief, downloadMarkdownFile } from '../utils/exportBrief';
import { useLanguage } from '../context/LanguageContext';

interface ResearchBriefViewProps {
  brief: ResearchBrief;
  onOpenDefense: () => void;
  onOpenAuditor: () => void;
  onNavigateStage?: (stage: 'problem' | 'knowledge' | 'tradeoffs' | 'experiment') => void;
  onUpdateBrief?: (brief: ResearchBrief) => void;
}

export const ResearchBriefView: React.FC<ResearchBriefViewProps> = ({
  brief,
  onOpenDefense,
  onOpenAuditor,
  onNavigateStage,
  onUpdateBrief,
}) => {
  const { currentLanguage, activeLanguageInfo, t, translateBriefContent, isTranslating } = useLanguage();
  const [copiedBibtex, setCopiedBibtex] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [displayBrief, setDisplayBrief] = useState<ResearchBrief>(brief);
  const [showingLocalized, setShowingLocalized] = useState(false);

  // Sync if parent brief changes
  React.useEffect(() => {
    setDisplayBrief(brief);
    setShowingLocalized(false);
  }, [brief]);

  const handleToggleTranslate = async () => {
    if (showingLocalized) {
      setDisplayBrief(brief);
      setShowingLocalized(false);
      return;
    }

    const localized = await translateBriefContent(brief, currentLanguage);
    if (localized) {
      setDisplayBrief(localized);
      setShowingLocalized(true);
      if (onUpdateBrief) onUpdateBrief(localized);
    }
  };

  const selectedDirection =
    displayBrief.candidateDirections.find((d) => d.id === displayBrief.selectedDirectionId) ||
    displayBrief.candidateDirections[0];

  const handleDownloadMarkdown = () => {
    const md = generateMarkdownBrief(displayBrief);
    const filename = `${displayBrief.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}-research-brief.md`;
    downloadMarkdownFile(filename, md);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyBibtex = () => {
    navigator.clipboard.writeText(displayBrief.bibtexSnippet);
    setCopiedBibtex(true);
    setTimeout(() => setCopiedBibtex(false), 2000);
  };

  const handleCopyPitch = () => {
    const pitch = `RESEARCH PROPOSAL SUMMARY
Title: ${displayBrief.title}
Domain: ${displayBrief.intake.domain} (${displayBrief.intake.targetContext})
Core Problem: ${displayBrief.problemValidation.coreProblemStatement}
Hypothesis: ${displayBrief.experimentDesign.falsifiableHypothesis}
Selected Direction: ${selectedDirection.title}
Falsification Metric: ${displayBrief.experimentDesign.dependentVariablesAndMetrics[0]?.targetBenchmark}
Timeline: ${displayBrief.feasibilityAssessment.runwayWeeks} weeks`;
    navigator.clipboard.writeText(pitch);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Top Action Ribbon (Hidden on Print) */}
      <div className="no-print bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <FileText className="w-4 h-4 text-slate-700" />
          <span className="font-semibold text-slate-800">{t('navBrief')}</span>
          <span aria-hidden="true">·</span>
          <span>{new Date(brief.createdAt).toLocaleDateString()}</span>
          {showingLocalized && (
            <span className="ml-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              <Globe className="w-3 h-3 text-indigo-500" />
              <span>{activeLanguageInfo.nativeName} (Cloud Translation)</span>
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* APAC & Japan Translation Toggle Button */}
          {currentLanguage !== 'en' && (
            <button
              onClick={handleToggleTranslate}
              disabled={isTranslating}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 border ${
                showingLocalized
                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
                  : 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100'
              }`}
              title="Toggle between English original and APAC translation via Google Cloud Translation"
            >
              {isTranslating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{t('btnTranslating')}</span>
                </>
              ) : showingLocalized ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{t('btnOriginalEnglish')}</span>
                </>
              ) : (
                <>
                  <Languages className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{t('btnTranslateBrief')} ({activeLanguageInfo.flag} {activeLanguageInfo.name})</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={handleCopyPitch}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
            title="Copy 1-minute elevator pitch to clipboard"
          >
            {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSummary ? 'Copied Pitch' : 'Copy Pitch'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF</span>
          </button>

          <button
            onClick={handleDownloadMarkdown}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Markdown</span>
          </button>

          <button
            onClick={onOpenAuditor}
            className="px-3 py-1.5 text-xs font-semibold text-purple-950 bg-purple-100 hover:bg-purple-200 rounded-lg transition-colors flex items-center gap-1.5 ring-1 ring-purple-300"
          >
            <Shield className="w-3.5 h-3.5 text-purple-700" />
            <span>Audit Citations & Slop</span>
          </button>

          <button
            onClick={onOpenDefense}
            className="px-3 py-1.5 text-xs font-semibold text-amber-950 bg-amber-300 hover:bg-amber-400 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <span>Defense Lab</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Quick Stage Inspection Links */}
      {onNavigateStage && (
        <div className="no-print bg-slate-50 border border-slate-200/80 rounded-lg p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-semibold text-slate-600">Inspect Underlying Foundation:</span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigateStage('problem')}
              className="text-slate-600 hover:text-slate-900 hover:underline flex items-center gap-1"
            >
              <AlertCircle className="w-3 h-3 text-slate-500" />
              <span>01. Problem Grounding</span>
            </button>
            <span className="text-slate-300">·</span>
            <button
              onClick={() => onNavigateStage('knowledge')}
              className="text-slate-600 hover:text-slate-900 hover:underline flex items-center gap-1"
            >
              <BookOpen className="w-3 h-3 text-slate-500" />
              <span>02. State of Knowledge</span>
            </button>
            <span className="text-slate-300">·</span>
            <button
              onClick={() => onNavigateStage('tradeoffs')}
              className="text-slate-600 hover:text-slate-900 hover:underline flex items-center gap-1"
            >
              <Compass className="w-3 h-3 text-slate-500" />
              <span>03. Direction Trade-offs</span>
            </button>
            <span className="text-slate-300">·</span>
            <button
              onClick={() => onNavigateStage('experiment')}
              className="text-slate-600 hover:text-slate-900 hover:underline flex items-center gap-1"
            >
              <Layers className="w-3 h-3 text-slate-500" />
              <span>04. Experiment Protocol</span>
            </button>
          </div>
        </div>
      )}

      {/* The Printable Research Brief Document */}
      <article className="bg-white rounded-xl border border-slate-200 p-8 sm:p-12 shadow-xs space-y-10 font-sans print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <header className="border-b border-slate-200 pb-8 space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-mono-tabular">
            <span className="uppercase tracking-wider font-semibold text-slate-700">
              {brief.intake.domain}
            </span>
            <span aria-hidden="true">·</span>
            <span className="capitalize">{brief.intake.targetContext.replace('_', ' ')} Proposal</span>
            <span aria-hidden="true">·</span>
            <span>{brief.feasibilityAssessment.runwayWeeks} Weeks Estimated Runway</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 font-serif-scholarly leading-tight">
            {brief.title}
          </h1>

          <p className="text-base text-slate-700 leading-relaxed font-serif-scholarly italic">
            "{brief.problemValidation.coreProblemStatement}"
          </p>
        </header>

        {/* Section 1: Problem Space & Societal Value */}
        <section className="space-y-3">
          <h2 className="text-xs uppercase tracking-wider font-bold text-slate-900">
            01. Grounded Problem Validation
          </h2>
          <div className="text-sm text-slate-700 leading-relaxed space-y-3">
            <p>{brief.problemValidation.coreProblemStatement}</p>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 text-xs space-y-1">
              <span className="font-semibold text-slate-900 block">Real-World Friction & Harm:</span>
              <p className="text-slate-600">{brief.problemValidation.realWorldImpact}</p>
            </div>
          </div>
        </section>

        {/* Section 2: Critical Knowledge Gap */}
        <section className="space-y-3">
          <h2 className="text-xs uppercase tracking-wider font-bold text-slate-900">
            02. The Unsolved Gap in the Literature
          </h2>
          <div className="text-sm text-slate-700 leading-relaxed space-y-2">
            <p className="font-medium text-slate-900 font-serif-scholarly">
              "{brief.knowledgeLandscape.criticalKnowledgeGap}"
            </p>
            <p className="text-slate-600 text-xs">
              <span className="font-semibold text-slate-800">Why Unsolved: </span>
              {brief.knowledgeLandscape.whyUnsolvedUntilNow}
            </p>
          </div>
        </section>

        {/* Section 3: Chosen Research Direction */}
        <section className="space-y-3">
          <h2 className="text-xs uppercase tracking-wider font-bold text-slate-900">
            03. Selected Direction & Methodological Strategy
          </h2>
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <h3 className="font-semibold text-base text-slate-900">
                {selectedDirection.title}
              </h3>
              <span className="text-xs font-mono-tabular text-slate-500">
                Novelty: {selectedDirection.tradeoffs.noveltyScore}/10 · Feasibility: {selectedDirection.tradeoffs.feasibilityScore}/10
              </span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              {selectedDirection.summary}
            </p>
            <p className="text-xs text-slate-600 italic">
              Selection Rationale: {brief.selectionRationale}
            </p>
          </div>
        </section>

        {/* Section 4: Experiment Design & Falsification */}
        <section className="space-y-4">
          <h2 className="text-xs uppercase tracking-wider font-bold text-slate-900">
            04. Empirical Verification & Falsification
          </h2>

          <div className="space-y-3 text-xs">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
              <span className="font-semibold text-slate-900 block mb-1">Falsifiable Hypothesis:</span>
              <p className="text-slate-800 font-serif-scholarly text-sm">
                "{brief.experimentDesign.falsifiableHypothesis}"
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-900 block mb-1">Baseline Controls:</span>
                <ul className="space-y-1 text-slate-600">
                  {brief.experimentDesign.baselinesAndControls.map((b, i) => (
                    <li key={i}>· {b.name} ({b.type.replace('_', ' ')})</li>
                  ))}
                </ul>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-900 block mb-1">Primary Falsification Metric:</span>
                <p className="text-slate-800">
                  {brief.experimentDesign.dependentVariablesAndMetrics[0]?.metric}:{' '}
                  <span className="font-mono-tabular text-emerald-700 font-medium">
                    {brief.experimentDesign.dependentVariablesAndMetrics[0]?.targetBenchmark}
                  </span>
                </p>
                <p className="text-slate-500 text-[11px] mt-1">
                  Negative outcome utility: {brief.experimentDesign.negativeResultValue}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Advisor Critiques & Feasibility */}
        <section className="space-y-3">
          <h2 className="text-xs uppercase tracking-wider font-bold text-slate-900">
            05. Pre-Emptive Advisor Critiques & Committee Guardrails
          </h2>

          <div className="space-y-2.5">
            {brief.advisorCritiques.map((crit, idx) => (
              <div key={idx} className="p-4 rounded-lg bg-amber-50/60 border border-amber-200/60 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-amber-950">
                  <Shield className="w-3.5 h-3.5 text-amber-700" />
                  <span>Advisor Note: {crit.category}</span>
                </div>
                <p className="text-amber-900/90">{crit.critique}</p>
                <p className="text-amber-950 font-medium">
                  <span className="underline">Actionable Recommendation:</span> {crit.actionableAdjustment}
                </p>
              </div>
            ))}
          </div>

          <div className="pt-2 text-xs text-slate-500 flex flex-wrap items-center gap-4 font-mono-tabular">
            <span>Runway: {brief.feasibilityAssessment.runwayWeeks} Weeks</span>
            <span aria-hidden="true">·</span>
            <span>Budget: {brief.feasibilityAssessment.budgetVerdict}</span>
            <span aria-hidden="true">·</span>
            <span>Prerequisite: {brief.feasibilityAssessment.keyPrerequisite}</span>
          </div>
        </section>

        {/* Section 6: Citation & BibTeX */}
        <section className="space-y-3 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
              BibTeX Citation
            </span>
            <button
              onClick={handleCopyBibtex}
              className="text-xs text-slate-700 hover:text-slate-900 flex items-center gap-1 font-mono-tabular"
            >
              {copiedBibtex ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copiedBibtex ? 'Copied' : 'Copy BibTeX'}</span>
            </button>
          </div>

          <pre className="p-3 rounded-lg bg-slate-900 text-slate-200 text-xs font-mono overflow-x-auto">
            {brief.bibtexSnippet}
          </pre>
        </section>

        {/* Action Callout to Defense Lab */}
        <div className="no-print pt-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 -mx-8 sm:-mx-12 -mb-8 sm:-mb-12 p-8 rounded-b-xl">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Ready to defend this proposal before your committee?
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Enter the Socratic Defense Lab to answer tough Reviewer #2 and department chair critique probes.
            </p>
          </div>

          <button
            onClick={onOpenDefense}
            className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap self-start sm:self-auto shadow-2xs"
          >
            <span>Enter Defense Lab</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </article>
    </div>
  );
};
