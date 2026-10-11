import { FC, useEffect, useState } from "react";
import { Download, Printer, Copy, Check, Shield, FileText, ArrowRight, Layers, Compass, BookOpen, AlertCircle, Languages, RefreshCw, Globe } from "lucide-react";
import { ResearchBrief } from "../types/research";
import { generateMarkdownBrief, downloadMarkdownFile } from "../utils/exportBrief";
import { useLanguage } from "../context/LanguageContext";
import { copyToClipboard } from "../utils/clipboard";
import { getBriefLabels } from "../i18n/translations";
import { LanguageCode } from "../types/i18n";

interface ResearchBriefViewProps {
	brief: ResearchBrief;
	onOpenDefense: () => void;
	onOpenAuditor: () => void;
	onNavigateStage?: (stage: "problem" | "knowledge" | "tradeoffs" | "experiment") => void;
	onUpdateBrief?: (brief: ResearchBrief) => void;
}

export const ResearchBriefView: FC<ResearchBriefViewProps> = ({ brief, onOpenDefense, onOpenAuditor, onNavigateStage, onUpdateBrief }) => {
	const { currentLanguage, activeLanguageInfo, languages, setLanguage, translateBriefContent, isTranslating, translationProvider } = useLanguage();
	const [copiedBibtex, setCopiedBibtex] = useState(false);
	const [copiedSummary, setCopiedSummary] = useState(false);
	const [displayBrief, setDisplayBrief] = useState<ResearchBrief>(brief);
	const [showingLocalized, setShowingLocalized] = useState(false);
	const [langMenuOpen, setLangMenuOpen] = useState(false);
	const [translationNotice, setTranslationNotice] = useState<string | null>(null);

	// Deterministic UI labels from local app dictionary (instant, zero API calls)
	const activeUiLang = (showingLocalized ? (displayBrief.localizedLang as LanguageCode) || currentLanguage : currentLanguage) as LanguageCode;
	const labels = getBriefLabels(activeUiLang);

	// Sync if parent brief changes
	useEffect(() => {
		setDisplayBrief(brief);
		setShowingLocalized(false);
	}, [brief]);

	const handleToggleTranslate = async (chosenLang?: string) => {
		const targetLangCode = (chosenLang || (currentLanguage === "en" ? "ja" : currentLanguage)) as any;

		if (showingLocalized && (!chosenLang || chosenLang === "en" || chosenLang === currentLanguage)) {
			setDisplayBrief(brief);
			setShowingLocalized(false);
			setTranslationNotice(labels.viewEnglishOriginal);
			setTimeout(() => setTranslationNotice(null), 3000);
			return;
		}

		if (targetLangCode === "en") {
			setDisplayBrief(brief);
			setShowingLocalized(false);
			return;
		}

		if (chosenLang && chosenLang !== currentLanguage) {
			setLanguage(chosenLang as any);
		}

		// Only triggers the API for the dynamic brief content
		const localized = await translateBriefContent(brief, targetLangCode, true);
		if (localized && localized.isLocalized) {
			setDisplayBrief(localized);
			setShowingLocalized(true);
			if (onUpdateBrief) onUpdateBrief(localized);
			const targetLangObj = languages.find((l) => l.code === targetLangCode);
			const provName = process.env.GOOGLE_CLOUD_TRANSLATION_API_KEY != "" ? "Google Cloud Translation" : "Gemini Flash Neural Translator";
			setTranslationNotice(`${labels.navBrief}: ${targetLangObj?.name || targetLangCode} (${provName})`);
			setTimeout(() => setTranslationNotice(null), 4000);
		} else {
			setTranslationNotice("Brief retained in original English.");
			setTimeout(() => setTranslationNotice(null), 3000);
		}
	};

	const selectedDirection = displayBrief.candidateDirections.find((d) => d.id === displayBrief.selectedDirectionId) || displayBrief.candidateDirections[0];

	const handleDownloadMarkdown = () => {
		const md = generateMarkdownBrief(displayBrief);
		const filename = `${displayBrief.title
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.slice(0, 40)}-research-brief.md`;
		downloadMarkdownFile(filename, md);
	};

	const handlePrint = () => {
		window.print();
	};

	const handleCopyBibtex = async () => {
		if (!displayBrief.bibtexSnippet) return;
		const ok = await copyToClipboard(displayBrief.bibtexSnippet);
		if (ok) {
			setCopiedBibtex(true);
			setTimeout(() => setCopiedBibtex(false), 2000);
		}
	};

	const handleCopyPitch = async () => {
		const pitch = `RESEARCH PROPOSAL SUMMARY
Title: ${displayBrief.title}
Domain: ${displayBrief.intake.domain} (${displayBrief.intake.targetContext})
Core Problem: ${displayBrief.problemValidation.coreProblemStatement}
Hypothesis: ${displayBrief.experimentDesign.falsifiableHypothesis}
Selected Direction: ${selectedDirection.title}
Falsification Metric: ${displayBrief.experimentDesign.dependentVariablesAndMetrics[0]?.targetBenchmark}
Timeline: ${displayBrief.feasibilityAssessment.runwayWeeks} weeks`;
		const ok = await copyToClipboard(pitch);
		if (ok) {
			setCopiedSummary(true);
			setTimeout(() => setCopiedSummary(false), 2000);
		}
	};

	return (
		<div className='max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-8'>
			{/* Optional Toast Notice */}
			{translationNotice && (
				<div className='no-print bg-indigo-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-md flex items-center justify-between transition-all animate-in fade-in slide-in-from-top-2'>
					<div className='flex items-center gap-2'>
						<Globe className='w-4 h-4 text-indigo-300' />
						<span>{translationNotice}</span>
					</div>
					<button onClick={() => setTranslationNotice(null)} className='text-indigo-300 hover:text-white'>
						✕
					</button>
				</div>
			)}

			{/* Top Action Ribbon (Hidden on Print) */}
			<div className='no-print bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3'>
				<div className='flex items-center gap-2 text-xs text-slate-500'>
					<FileText className='w-4 h-4 text-slate-700' />
					<span className='font-semibold text-slate-800'>{labels.navBrief}</span>
					<span aria-hidden='true'>·</span>
					<span>{new Date(brief.createdAt).toLocaleDateString()}</span>
					{showingLocalized && (
						<span className='ml-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200'>
							<Globe className='w-3 h-3 text-indigo-500' />
							<span>
								{activeLanguageInfo.nativeName} ({translationProvider.includes("cloud") ? "Cloud" : "Gemini Flash"})
							</span>
						</span>
					)}
				</div>

				<div className='flex flex-wrap items-center gap-2'>
					{/* Translation Controls with direct language picker (Only triggers API on click) */}
					<div className='relative inline-block text-left'>
						<div className='inline-flex rounded-lg shadow-2xs'>
							<button onClick={() => handleToggleTranslate()} disabled={isTranslating} className={`px-3 py-1.5 text-xs font-semibold rounded-l-lg transition-colors flex items-center gap-1.5 border cursor-pointer ${showingLocalized ? "bg-indigo-600 text-white border-indigo-700" : "bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100"}`} title='Toggle between English original and APAC translation'>
								{isTranslating ? (
									<>
										<RefreshCw className='w-3.5 h-3.5 animate-spin' />
										<span>{labels.translatingBtn}</span>
									</>
								) : showingLocalized ? (
									<>
										<Check className='w-3.5 h-3.5' />
										<span>{labels.viewEnglishOriginal}</span>
									</>
								) : (
									<>
										<Languages className='w-3.5 h-3.5 text-indigo-600' />
										<span>{currentLanguage !== "en" ? `${labels.translateBriefBtn} (${activeLanguageInfo.flag} ${activeLanguageInfo.name})` : `${labels.translateBriefBtn} (🇯🇵 日本語)`}</span>
									</>
								)}
							</button>
							<button onClick={() => setLangMenuOpen(!langMenuOpen)} disabled={isTranslating} className={`px-2 py-1.5 text-xs border-y border-r rounded-r-lg cursor-pointer transition-colors ${showingLocalized ? "bg-indigo-700 text-white border-indigo-700 hover:bg-indigo-800" : "bg-indigo-100 text-indigo-800 border-indigo-200 hover:bg-indigo-200"}`} title='Select target language for research brief'>
								▾
							</button>
						</div>

						{langMenuOpen && (
							<div className='absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50 text-xs'>
								<div className='px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider'>{labels.targetLanguage}</div>
								{languages
									.filter((l) => l.code !== "en")
									.map((lang) => (
										<button
											key={lang.code}
											onClick={() => {
												setLangMenuOpen(false);
												handleToggleTranslate(lang.code);
											}}
											className='w-full text-left px-3 py-1.5 hover:bg-indigo-50 flex items-center justify-between text-slate-700 hover:text-indigo-900 cursor-pointer'>
											<span>
												{lang.flag} {lang.nativeName}
											</span>
											<span className='text-[10px] text-slate-400'>{lang.name}</span>
										</button>
									))}
								{showingLocalized && (
									<button
										onClick={() => {
											setLangMenuOpen(false);
											handleToggleTranslate("en");
										}}
										className='w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between text-slate-700 border-t border-slate-100 font-medium cursor-pointer'>
										<span>🌐 English</span>
										<span className='text-[10px] text-slate-400'>{labels.viewEnglishOriginal}</span>
									</button>
								)}
							</div>
						)}
					</div>

					<button onClick={handleCopyPitch} className='px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer' title='Copy 1-minute elevator pitch to clipboard'>
						{copiedSummary ? <Check className='w-3.5 h-3.5 text-emerald-600' /> : <Copy className='w-3.5 h-3.5' />}
						<span>{copiedSummary ? labels.copiedPitch : labels.copyPitch}</span>
					</button>

					<button onClick={handlePrint} className='px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer'>
						<Printer className='w-3.5 h-3.5' />
						<span>{labels.printPdf}</span>
					</button>

					<button onClick={handleDownloadMarkdown} className='px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer'>
						<Download className='w-3.5 h-3.5' />
						<span>{labels.exportMarkdown}</span>
					</button>

					<button onClick={onOpenAuditor} className='px-3 py-1.5 text-xs font-semibold text-purple-950 bg-purple-100 hover:bg-purple-200 rounded-lg transition-colors flex items-center gap-1.5 ring-1 ring-purple-300 cursor-pointer'>
						<Shield className='w-3.5 h-3.5 text-purple-700' />
						<span>{labels.auditSlop}</span>
					</button>

					<button onClick={onOpenDefense} className='px-3 py-1.5 text-xs font-semibold text-amber-950 bg-amber-300 hover:bg-amber-400 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer'>
						<span>{labels.defenseLab}</span>
						<ArrowRight className='w-3.5 h-3.5' />
					</button>
				</div>
			</div>

			{/* Quick Stage Inspection Links */}
			{onNavigateStage && (
				<div className='no-print bg-slate-50 border border-slate-200/80 rounded-lg p-3 flex flex-wrap items-center justify-between gap-2 text-xs'>
					<span className='font-semibold text-slate-600'>{labels.inspectFoundation}</span>
					<div className='flex flex-wrap items-center gap-2'>
						<button onClick={() => onNavigateStage("problem")} className='text-slate-600 hover:text-slate-900 hover:underline flex items-center gap-1 cursor-pointer'>
							<AlertCircle className='w-3 h-3 text-slate-500' />
							<span>{labels.stepProblem}</span>
						</button>
						<span className='text-slate-300'>·</span>
						<button onClick={() => onNavigateStage("knowledge")} className='text-slate-600 hover:text-slate-900 hover:underline flex items-center gap-1 cursor-pointer'>
							<BookOpen className='w-3 h-3 text-slate-500' />
							<span>{labels.stepKnowledge}</span>
						</button>
						<span className='text-slate-300'>·</span>
						<button onClick={() => onNavigateStage("tradeoffs")} className='text-slate-600 hover:text-slate-900 hover:underline flex items-center gap-1 cursor-pointer'>
							<Compass className='w-3 h-3 text-slate-500' />
							<span>{labels.stepTradeoffs}</span>
						</button>
						<span className='text-slate-300'>·</span>
						<button onClick={() => onNavigateStage("experiment")} className='text-slate-600 hover:text-slate-900 hover:underline flex items-center gap-1 cursor-pointer'>
							<Layers className='w-3 h-3 text-slate-500' />
							<span>{labels.stepExperiment}</span>
						</button>
					</div>
				</div>
			)}

			{/* The Printable Research Brief Document */}
			<article className='bg-white rounded-xl border border-slate-200 p-8 sm:p-12 shadow-xs space-y-10 font-sans print:border-none print:shadow-none print:p-0'>
				{/* Document Header */}
				<header className='border-b border-slate-200 pb-8 space-y-4'>
					<div className='flex flex-wrap items-center gap-3 text-xs text-slate-500 font-mono-tabular'>
						<span className='uppercase tracking-wider font-semibold text-slate-700'>{displayBrief.intake.domain}</span>
						<span aria-hidden='true'>·</span>
						<span className='capitalize'>
							{displayBrief.intake.targetContext.replace("_", " ")} {labels.proposalSuffix}
						</span>
						<span aria-hidden='true'>·</span>
						<span>
							{displayBrief.feasibilityAssessment.runwayWeeks} {labels.estimatedRunway}
						</span>
					</div>

					<h1 className='text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 font-serif-scholarly leading-tight'>{displayBrief.title}</h1>

					<p className='text-base text-slate-700 leading-relaxed font-serif-scholarly italic'>"{displayBrief.problemValidation.coreProblemStatement}"</p>
				</header>

				{/* Section 1: Problem Space & Societal Value */}
				<section className='space-y-3'>
					<h2 className='text-xs uppercase tracking-wider font-bold text-slate-900'>{labels.sec1Title}</h2>
					<div className='text-sm text-slate-700 leading-relaxed space-y-3'>
						<p>{displayBrief.problemValidation.coreProblemStatement}</p>
						<div className='p-4 rounded-lg bg-slate-50 border border-slate-100 text-xs space-y-1'>
							<span className='font-semibold text-slate-900 block'>{labels.realWorldHarm}</span>
							<p className='text-slate-600'>{displayBrief.problemValidation.realWorldImpact}</p>
						</div>
					</div>
				</section>

				{/* Section 2: Critical Knowledge Gap */}
				<section className='space-y-3'>
					<h2 className='text-xs uppercase tracking-wider font-bold text-slate-900'>{labels.sec2Title}</h2>
					<div className='text-sm text-slate-700 leading-relaxed space-y-2'>
						<p className='font-medium text-slate-900 font-serif-scholarly'>"{displayBrief.knowledgeLandscape.criticalKnowledgeGap}"</p>
						<p className='text-slate-600 text-xs'>
							<span className='font-semibold text-slate-800'>{labels.whyUnsolved}</span>
							{displayBrief.knowledgeLandscape.whyUnsolvedUntilNow}
						</p>
					</div>
				</section>

				{/* Section 3: Chosen Research Direction */}
				<section className='space-y-3'>
					<h2 className='text-xs uppercase tracking-wider font-bold text-slate-900'>{labels.sec3Title}</h2>
					<div className='p-5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3'>
						<div className='flex flex-col sm:flex-row sm:items-center justify-between gap-1'>
							<h3 className='font-semibold text-base text-slate-900'>{selectedDirection.title}</h3>
							<span className='text-xs font-mono-tabular text-slate-500'>
								{labels.novelty} {selectedDirection.tradeoffs.noveltyScore}/10 · {labels.feasibility} {selectedDirection.tradeoffs.feasibilityScore}/10
							</span>
						</div>
						<p className='text-xs text-slate-700 leading-relaxed'>{selectedDirection.summary}</p>
						<p className='text-xs text-slate-600 italic'>
							{labels.selectionRationale}
							{displayBrief.selectionRationale}
						</p>
					</div>
				</section>

				{/* Section 4: Experiment Design & Falsification */}
				<section className='space-y-4'>
					<h2 className='text-xs uppercase tracking-wider font-bold text-slate-900'>{labels.sec4Title}</h2>

					<div className='space-y-3 text-xs'>
						<div className='p-4 rounded-lg bg-slate-50 border border-slate-100'>
							<span className='font-semibold text-slate-900 block mb-1'>{labels.falsifiableHypothesis}</span>
							<p className='text-slate-800 font-serif-scholarly text-sm'>"{displayBrief.experimentDesign.falsifiableHypothesis}"</p>
						</div>

						<div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
							<div className='p-3.5 rounded-lg border border-slate-200'>
								<span className='font-semibold text-slate-900 block mb-1'>{labels.baselineControls}</span>
								<ul className='space-y-1 text-slate-600'>
									{displayBrief.experimentDesign.baselinesAndControls.map((b, i) => (
										<li key={i}>
											· {b.name} ({b.type.replace("_", " ")})
										</li>
									))}
								</ul>
							</div>

							<div className='p-3.5 rounded-lg border border-slate-200'>
								<span className='font-semibold text-slate-900 block mb-1'>{labels.primaryMetric}</span>
								<p className='text-slate-800'>
									{displayBrief.experimentDesign.dependentVariablesAndMetrics[0]?.metric}: <span className='font-mono-tabular text-emerald-700 font-medium'>{displayBrief.experimentDesign.dependentVariablesAndMetrics[0]?.targetBenchmark}</span>
								</p>
								<p className='text-slate-500 text-[11px] mt-1'>
									{labels.negativeOutcomeUtility}
									{displayBrief.experimentDesign.negativeResultValue}
								</p>
							</div>
						</div>
					</div>
				</section>

				{/* Section 5: Advisor Critiques & Feasibility */}
				<section className='space-y-3'>
					<h2 className='text-xs uppercase tracking-wider font-bold text-slate-900'>{labels.sec5Title}</h2>

					<div className='space-y-2.5'>
						{displayBrief.advisorCritiques.map((crit, idx) => (
							<div key={idx} className='p-4 rounded-lg bg-amber-50/60 border border-amber-200/60 text-xs space-y-1.5'>
								<div className='flex items-center gap-1.5 font-semibold text-amber-950'>
									<Shield className='w-3.5 h-3.5 text-amber-700' />
									<span>
										{labels.advisorNote}
										{crit.category}
									</span>
								</div>
								<p className='text-amber-900/90'>{crit.critique}</p>
								<p className='text-amber-950 font-medium'>
									<span className='underline'>{labels.actionableRec}</span> {crit.actionableAdjustment}
								</p>
							</div>
						))}
					</div>

					<div className='pt-2 text-xs text-slate-500 flex flex-wrap items-center gap-4 font-mono-tabular'>
						<span>
							{labels.runway}
							{displayBrief.feasibilityAssessment.runwayWeeks} {labels.estimatedRunway.split(" ")[0] || "Weeks"}
						</span>
						<span aria-hidden='true'>·</span>
						<span>
							{labels.budget}
							{displayBrief.feasibilityAssessment.budgetVerdict}
						</span>
						<span aria-hidden='true'>·</span>
						<span>
							{labels.prerequisite}
							{displayBrief.feasibilityAssessment.keyPrerequisite}
						</span>
					</div>
				</section>

				{/* Section 6: Citation & BibTeX */}
				<section className='space-y-3 pt-4 border-t border-slate-200'>
					<div className='flex items-center justify-between'>
						<span className='text-xs uppercase tracking-wider font-semibold text-slate-500'>{labels.bibtexTitle}</span>
						<button onClick={handleCopyBibtex} className='text-xs text-slate-700 hover:text-slate-900 flex items-center gap-1 font-mono-tabular cursor-pointer'>
							{copiedBibtex ? <Check className='w-3 h-3 text-emerald-600' /> : <Copy className='w-3 h-3' />}
							<span>{copiedBibtex ? labels.copied : labels.copyBibtex}</span>
						</button>
					</div>

					<pre className='p-3 rounded-lg bg-slate-900 text-slate-200 text-xs font-mono overflow-x-auto'>{displayBrief.bibtexSnippet}</pre>
				</section>

				{/* Action Callout to Defense Lab */}
				<div className='no-print pt-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 -mx-8 sm:-mx-12 -mb-8 sm:-mb-12 p-8 rounded-b-xl'>
					<div>
						<h3 className='text-sm font-semibold text-slate-900'>{labels.defenseReadyTitle}</h3>
						<p className='text-xs text-slate-600 mt-0.5'>{labels.defenseReadyDesc}</p>
					</div>

					<button onClick={onOpenDefense} className='px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap self-start sm:self-auto shadow-2xs cursor-pointer'>
						<span>{labels.enterDefenseLab}</span>
						<ArrowRight className='w-3.5 h-3.5' />
					</button>
				</div>
			</article>
		</div>
	);
};
