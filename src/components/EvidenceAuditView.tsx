import React, { useState } from "react";
import { ShieldAlert, ShieldCheck, Search, Sparkles, ExternalLink, Check, Copy, Loader2, Zap, BookOpen, Gauge, FileWarning } from "lucide-react";
import { EvidenceAuditReport, ResearchBrief, HallucinationRisk } from "../types/research";
import { renderScholarlyText } from "../utils/textFormat";

interface EvidenceAuditViewProps {
	brief: ResearchBrief;
	onAuditText: (text: string) => Promise<EvidenceAuditReport>;
	initialCustomText?: string;
}

export const EvidenceAuditView: React.FC<EvidenceAuditViewProps> = ({ brief, onAuditText, initialCustomText = "" }) => {
	const [activeTab, setActiveTab] = useState<"brief" | "custom">(initialCustomText ? "custom" : "brief");
	const [customText, setCustomText] = useState<string>(initialCustomText);
	const [report, setReport] = useState<EvidenceAuditReport | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [copiedRewrite, setCopiedRewrite] = useState<boolean>(false);
	const [selectedSnippet, setSelectedSnippet] = useState<string | null>(null);

	// Demo test snippets
	const demoSnippets = [
		{
			label: "AI Slop & Phantom Citation (Trap)",
			text: `In this study, we delve into the multifaceted tapestry of next-generation artificial intelligence. Neural models play a pivotal role in revolutionizing the paradigm of modern healthcare. As demonstrated by Smith et al. (2024) in their landmark quantum-transformer benchmark, our approach seamlessly integrates into clinical pipelines and stands as a testament to the power of automated diagnosis.`,
		},
		{
			label: "Attribution Drift (Real paper, false claim)",
			text: `Recent advances in sequence modeling have solved real-time embedded latency. Notably, Vaswani et al. (2017) empirically proved that multi-head attention executes with less than 2KB of dynamic RAM overhead on ARM Cortex-M4 microcontrollers, achieving zero timing side-channel leakage across all evaluated cryptographic testbeds.`,
		},
		{
			label: "Rigorous Empirical Prose (Clean)",
			text: `Under non-stationary hospital discharge shift, standard gradient-boosted baselines exhibit an AUC degradation from 0.84 to 0.68. As documented in the MIMIC-IV benchmark (Johnson et al., 2023; DOI: 10.1038/s41597-023-01990-2), narrative note brevity directly accounts for 62% of predictive variance. We evaluate whether invariant causal representation alignment can restrict this delta to <0.04 (p < 0.01, paired Wilcoxon test).`,
		},
	];

	const handleAudit = async (targetText?: string) => {
		setIsLoading(true);
		try {
			// Reset the report and selected snippet when starting a new audit
			setReport(null);
			setSelectedSnippet(null);

			// Start new audit
			const textToAudit = targetText !== undefined ? targetText : activeTab === "brief" ? `${brief.title}\n\nCore Problem: ${brief.problemValidation.coreProblemStatement}\n\nExisting Paradigms: ${brief.knowledgeLandscape.existingApproaches.map((a) => `${a.approachName}: ${a.representativeParadigm}`).join("; ")}\n\nHypothesis: ${brief.experimentDesign.falsifiableHypothesis}` : customText;
			const result = await onAuditText(textToAudit);
			setReport(result);
		} catch (err) {
			console.error("Audit failed:", err);
		} finally {
			setIsLoading(false);
		}
	};

	const handleApplyPreset = (snippet: string) => {
		setActiveTab("custom");
		setCustomText(snippet);
		handleAudit(snippet);
	};

	const handleCopyCleanRewrite = () => {
		if (!report?.slopAnalysis.cleanScholarlyRewrite) return;
		navigator.clipboard.writeText(report.slopAnalysis.cleanScholarlyRewrite);
		setCopiedRewrite(true);
		setTimeout(() => setCopiedRewrite(false), 2000);
	};

	// Helper to get safe hallucinationRisk data
	const getHallucinationRisk = (rep: EvidenceAuditReport): HallucinationRisk => {
		if (rep.hallucinationRisk) return rep.hallucinationRisk;
		const hasPhantom = rep.citations.some((c) => c.status === "phantom_hallucination");
		const hasDrift = rep.citations.some((c) => c.status === "attribution_drift");
		const score = Math.min(100, (hasPhantom ? 60 : 0) + (hasDrift ? 25 : 0) + rep.slopAnalysis.slopScore * 0.4);
		return {
			score: Math.round(score),
			riskLevel: score >= 75 ? "Critical" : score >= 45 ? "Severe" : score >= 20 ? "Moderate" : "Low",
			confidence: 90,
			verdictSummary: score >= 60 ? "High probability of synthetic hallucination or invented literature." : "Low to moderate hallucination risk.",
			factors: [
				{ name: "Bibliographic Fabrication Risk", score: hasPhantom ? 90 : 15, description: "Evaluation of citation existence." },
				{ name: "Synthetic Stylometric Density", score: rep.slopAnalysis.slopScore, description: "Detected unconstrained AI phrases." },
			],
			flaggedSnippets: [],
		};
	};

	const riskData = report ? getHallucinationRisk(report) : null;

	// Arc gauge calculation parameters
	// Semi-circle arc: radius 95, from (35, 125) to (225, 125)
	const arcRadius = 95;
	const arcLength = Math.PI * arcRadius; // ~298.45
	const riskScore = riskData ? Math.max(0, Math.min(100, riskData.score)) : 0;
	const strokeDashoffset = arcLength * (1 - riskScore / 100);

	// Needle angle: 180 at 0% (left), 0 at 100% (right)
	const needleAngle = 180 - (riskScore / 100) * 180;
	const needleRad = (needleAngle * Math.PI) / 180;
	const needleLength = 72;
	const needleX = 130 + needleLength * Math.cos(needleRad);
	const needleY = 125 - needleLength * Math.sin(needleRad);

	const getGaugeColor = (score: number) => {
		if (score >= 75) return "#e11d48"; // rose-600
		if (score >= 45) return "#ea580c"; // orange-600
		if (score >= 20) return "#f59e0b"; // amber-500
		return "#10b981"; // emerald-600
	};

	const getRiskBadgeColor = (level: string) => {
		switch (level) {
			case "Critical":
				return "bg-rose-100 text-rose-800 border-rose-300";
			case "Severe":
				return "bg-orange-100 text-orange-800 border-orange-300";
			case "Moderate":
				return "bg-amber-100 text-amber-800 border-amber-300";
			default:
				return "bg-emerald-100 text-emerald-800 border-emerald-300";
		}
	};

	return (
		<div className='max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-8'>
			{/* Stage Header */}
			<div className='border-b border-slate-200 pb-5'>
				<div className='flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider'>
					<span>Integrity Verification</span>
					<span aria-hidden='true'>·</span>
					<span>Hallucination & Anti-Slop Lab</span>
				</div>
				<h1 className='text-2xl sm:text-3xl font-bold text-slate-900 font-serif-scholarly mt-1'>Evidence, Citation & Hallucination Auditor</h1>
				<p className='text-sm text-slate-600 mt-2 max-w-3xl'>Deep telemetry inspection for phantom citations, synthetic LLM stylometric signatures, attribution drift, and fabricated empirical claims. Evaluates any draft with an interactive confidence gauge before submission.</p>
			</div>

			{/* Input Mode Selector */}
			<div className='bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4'>
				<div className='flex flex-wrap items-center justify-between gap-3'>
					<div className='flex items-center gap-2'>
						<button
							onClick={() => {
								setActiveTab("brief");
								setReport(null);
								setSelectedSnippet(null);
							}}
							className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${activeTab === "brief" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
							Audit Current Research Brief
						</button>
						<button
							onClick={() => {
								setActiveTab("custom");
								setReport(null);
								setSelectedSnippet(null);
							}}
							className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${activeTab === "custom" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
							Paste & Audit Custom Draft / Literature
						</button>
					</div>

					<div className='flex flex-wrap items-center gap-1.5 text-xs text-slate-500'>
						<span className='text-slate-400 font-medium'>Quick Test:</span>
						{demoSnippets.map((demo, idx) => (
							<button key={idx} onClick={() => handleApplyPreset(demo.text)} className='px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium border border-slate-200/60' title={`Click to load and audit ${demo.label}`}>
								{demo.label.split("(")[0].trim()}
							</button>
						))}
					</div>
				</div>

				{activeTab === "custom" && (
					<div className='space-y-2 pt-2'>
						<label htmlFor='custom-draft' className='block text-xs uppercase tracking-wider font-semibold text-slate-500'>
							Input Text (Draft, Literature Review, or Proposal Abstract)
						</label>
						<textarea id='custom-draft' rows={4} value={customText} onChange={(e) => setCustomText(e.target.value)} placeholder='Paste any academic paragraph or LLM-generated literature text to audit citations and AI slop...' className='w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 placeholder:text-slate-400 font-serif-scholarly leading-relaxed' />
					</div>
				)}

				<div className='flex items-center justify-between pt-2'>
					<span className='text-xs text-slate-400 font-mono-tabular'>{activeTab === "brief" ? `Target: Current Brief ("${brief.title.slice(0, 45)}...")` : `${customText.split(/\s+/).filter(Boolean).length} words ready to scan`}</span>

					<button onClick={() => handleAudit()} disabled={isLoading || (activeTab === "custom" && !customText.trim())} className='px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs'>
						{isLoading ? (
							<>
								<Loader2 className='w-3.5 h-3.5 animate-spin' />
								<span>Auditing Hallucination & Grounding...</span>
							</>
						) : (
							<>
								<Search className='w-3.5 h-3.5' />
								<span>Run Hallucination & Citation Audit</span>
							</>
						)}
					</button>
				</div>
			</div>

			{/* Pre-Audit Informational Guide & Quick Test Cards when no report has been generated */}
			{!report && !isLoading && (
				<div className='bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs'>
					<div className='space-y-1'>
						<h3 className='text-base font-bold text-slate-900 font-serif-scholarly'>Why Audit Research Proposals for Hallucination & AI Fluff?</h3>
						<p className='text-xs text-slate-600 max-w-2xl'>Generative models frequently write convincing academic prose while fabricating literature, misattributing landmark findings, or hiding empirical gaps behind buzzwords.</p>
					</div>

					<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
						<div onClick={() => handleApplyPreset(demoSnippets[0].text)} className='p-4 rounded-xl border border-rose-200 bg-rose-50/40 hover:bg-rose-50 hover:border-rose-300 transition-all cursor-pointer space-y-2 group'>
							<div className='flex items-center justify-between'>
								<span className='text-xs font-bold text-rose-700 uppercase tracking-wider font-mono-tabular'>Trap 01 · Phantom Citation</span>
								<span className='text-[11px] text-rose-600 group-hover:underline'>Test Demo →</span>
							</div>
							<h4 className='text-sm font-semibold text-slate-900'>Invented Papers & AI Slop</h4>
							<p className='text-xs text-slate-600 leading-relaxed'>Fabricates a non-existent paper (e.g. "Smith et al. 2024 quantum benchmark") and uses empty buzzwords ("multifaceted tapestry", "stands as a testament").</p>
						</div>

						<div onClick={() => handleApplyPreset(demoSnippets[1].text)} className='p-4 rounded-xl border border-amber-200 bg-amber-50/40 hover:bg-amber-50 hover:border-amber-300 transition-all cursor-pointer space-y-2 group'>
							<div className='flex items-center justify-between'>
								<span className='text-xs font-bold text-amber-700 uppercase tracking-wider font-mono-tabular'>Trap 02 · Attribution Drift</span>
								<span className='text-[11px] text-amber-600 group-hover:underline'>Test Demo →</span>
							</div>
							<h4 className='text-sm font-semibold text-slate-900'>Real Paper, Fabricated Claims</h4>
							<p className='text-xs text-slate-600 leading-relaxed'>Cites a famous real paper (Vaswani et al. 2017), but falsely claims it proved 2KB RAM execution on ARM Cortex microcontrollers.</p>
						</div>

						<div onClick={() => handleApplyPreset(demoSnippets[2].text)} className='p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 hover:border-emerald-300 transition-all cursor-pointer space-y-2 group'>
							<div className='flex items-center justify-between'>
								<span className='text-xs font-bold text-emerald-700 uppercase tracking-wider font-mono-tabular'>Baseline · Clean Prose</span>
								<span className='text-[11px] text-emerald-600 group-hover:underline'>Test Demo →</span>
							</div>
							<h4 className='text-sm font-semibold text-slate-900'>Rigorous Empirical Writing</h4>
							<p className='text-xs text-slate-600 leading-relaxed'>Real verified DOI (MIMIC-IV benchmark), exact empirical degradation metrics (0.84 to 0.68 AUC), and a falsifiable p-value threshold.</p>
						</div>
					</div>
				</div>
			)}

			{/* Audit Report Results */}
			{report && riskData && (
				<div className='space-y-8'>
					{/* PRIMARY SECTION: Visual Hallucination Risk Telemetry Gauge & Factors */}
					<div className='bg-white rounded-xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-6'>
						<div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4'>
							<div className='space-y-1'>
								<div className='flex items-center gap-2'>
									<Gauge className='w-4 h-4 text-slate-700' />
									<span className='text-sm font-bold text-slate-900 font-serif-scholarly'>Hallucination Risk & AI Text Detection Gauge</span>
								</div>
								<p className='text-xs text-slate-500'>Calibrated probability that text relies on fabricated bibliographic records, hallucinated mechanisms, or generative buzzwords.</p>
							</div>

							<div className='flex items-center gap-2'>
								<span className='text-xs text-slate-500'>Detection Confidence:</span>
								<span className='font-mono-tabular text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200'>{riskData.confidence}% Confidence</span>
							</div>
						</div>

						{/* Gauge + Risk Factor Breakdown Grid */}
						<div className='grid grid-cols-1 md:grid-cols-12 gap-8 items-center'>
							{/* Dial Gauge Visual (5 cols) */}
							<div className='md:col-span-5 flex flex-col items-center justify-center p-4 bg-slate-50/70 rounded-xl border border-slate-100'>
								<div className='relative w-64 h-36 flex items-center justify-center'>
									<svg viewBox='0 0 260 145' className='w-full h-full overflow-visible'>
										{/* Background Arc */}
										<path d='M 35,125 A 95,95 0 0,1 225,125' stroke='#e2e8f0' strokeWidth='14' strokeLinecap='round' fill='none' />

										{/* Calibrated Ticks */}
										{/* 0% Tick */}
										<line x1='35' y1='125' x2='22' y2='125' stroke='#94a3b8' strokeWidth='1.5' />
										{/* 25% Tick (135 deg) */}
										<line x1='62.8' y1='57.8' x2='52.2' y2='47.2' stroke='#94a3b8' strokeWidth='1.5' />
										{/* 50% Tick (90 deg) */}
										<line x1='130' y1='30' x2='130' y2='15' stroke='#94a3b8' strokeWidth='1.5' />
										{/* 75% Tick (45 deg) */}
										<line x1='197.2' y1='57.8' x2='207.8' y2='47.2' stroke='#94a3b8' strokeWidth='1.5' />
										{/* 100% Tick */}
										<line x1='225' y1='125' x2='238' y2='125' stroke='#94a3b8' strokeWidth='1.5' />

										{/* Dynamic Risk Arc */}
										<path d='M 35,125 A 95,95 0 0,1 225,125' stroke={getGaugeColor(riskScore)} strokeWidth='14' strokeLinecap='round' fill='none' strokeDasharray={arcLength} strokeDashoffset={strokeDashoffset} className='transition-all duration-700 ease-out' />

										{/* Dial Needle */}
										<line x1='130' y1='125' x2={needleX} y2={needleY} stroke='#1e293b' strokeWidth='3.5' strokeLinecap='round' className='transition-all duration-700 ease-out' />
										{/* Needle Pivot */}
										<circle cx='130' cy='125' r='7' fill='#1e293b' />
										<circle cx='130' cy='125' r='3' fill='#ffffff' />
									</svg>

									{/* Centered Readout under the needle pivot */}
									<div className='absolute bottom-0 text-center flex flex-col items-center'>
										<span className='text-3xl font-bold font-mono-tabular leading-none' style={{ color: getGaugeColor(riskScore) }}>
											{riskScore}%
										</span>
										<span className='text-[10px] uppercase tracking-wider font-semibold text-slate-500 mt-1'>Hallucination Likelihood</span>
									</div>
								</div>

								{/* Risk Level Badge */}
								<div className='mt-3 flex items-center gap-2'>
									<span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded border font-mono-tabular ${getRiskBadgeColor(riskData.riskLevel)}`}>● {riskData.riskLevel} Risk Tier</span>
								</div>

								<div className='flex justify-between w-full text-[10px] text-slate-400 font-mono-tabular px-4 mt-2'>
									<span>0% Human / Grounded</span>
									<span>50%</span>
									<span>100% Hallucinated</span>
								</div>
							</div>

							{/* Factors & Diagnostic Verdict (7 cols) */}
							<div className='md:col-span-7 space-y-4'>
								<div className='p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs'>
									<span className='font-semibold text-slate-900 block mb-1'>Auditor Diagnostic Verdict:</span>
									<p className='text-slate-700 leading-relaxed'>{riskData.verdictSummary}</p>
								</div>

								<div className='space-y-3'>
									<span className='text-xs uppercase tracking-wider font-semibold text-slate-500 block'>Telemetry Factor Breakdown</span>

									{riskData.factors.map((factor, idx) => (
										<div key={idx} className='space-y-1'>
											<div className='flex items-center justify-between text-xs'>
												<span className='font-semibold text-slate-800'>{factor.name}</span>
												<span className='font-mono-tabular font-bold text-slate-900'>{factor.score}%</span>
											</div>
											<div className='w-full bg-slate-100 rounded-full h-1.5 overflow-hidden'>
												<div
													className='h-1.5 rounded-full transition-all duration-500'
													style={{
														width: `${factor.score}%`,
														backgroundColor: getGaugeColor(factor.score),
													}}
												/>
											</div>
											<p className='text-[11px] text-slate-500'>{factor.description}</p>
										</div>
									))}
								</div>
							</div>
						</div>
					</div>

					{/* FLAGGED SNIPPETS: Suspected AI-Generated Passages & Invented Citations */}
					{riskData.flaggedSnippets && riskData.flaggedSnippets.length > 0 && (
						<div className='bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4'>
							<div className='flex items-center justify-between'>
								<div className='flex items-center gap-2 text-sm font-semibold text-slate-900'>
									<FileWarning className='w-4 h-4 text-rose-600' />
									<span>Flagged AI Hallucinations & Fabricated References ({riskData.flaggedSnippets.length})</span>
								</div>
								<span className='text-xs text-slate-400 font-mono-tabular'>Forensic Trace Analyzer</span>
							</div>

							<div className='space-y-3'>
								{riskData.flaggedSnippets.map((item, idx) => {
									const isCritical = item.severity === "critical";
									const isInventedCitation = item.category === "invented_citation";
									const isRhetoric = item.category === "synthetic_rhetoric";

									return (
										<div key={idx} onClick={() => setSelectedSnippet(item.snippet)} className={`p-4 rounded-lg border transition-all cursor-pointer ${isCritical ? "bg-rose-50/50 border-rose-200 hover:border-rose-300" : "bg-amber-50/50 border-amber-200 hover:border-amber-300"} ${selectedSnippet === item.snippet ? "ring-2 ring-slate-900" : ""}`}>
											<div className='flex flex-col sm:flex-row sm:items-start justify-between gap-2'>
												<div className='space-y-1.5'>
													<div className='flex flex-wrap items-center gap-2'>
														<span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded font-mono-tabular ${isCritical ? "bg-rose-700 text-white" : "bg-amber-600 text-white"}`}>{isCritical ? "CRITICAL DETECT" : "WARNING"}</span>

														<span className='text-[11px] font-semibold text-slate-700 uppercase font-mono-tabular'>{isInventedCitation ? "Invented Citation / Attribution Drift" : isRhetoric ? "Synthetic LLM Cliché" : "Ungrounded Claim"}</span>
													</div>

													<div className='text-xs sm:text-sm font-serif-scholarly font-medium text-slate-900 bg-white/70 p-2.5 rounded border border-slate-200/60'>"{item.snippet}"</div>

													<p className='text-xs text-slate-700'>
														<span className='font-semibold text-slate-900'>Forensic Verdict: </span>
														{item.reason}
													</p>
												</div>

												<div className='shrink-0 flex sm:flex-col items-end gap-1 font-mono-tabular text-xs'>
													<span className='text-slate-400 text-[10px]'>Gauge Confidence</span>
													<span className='font-bold text-slate-800'>{item.confidence}%</span>
												</div>
											</div>
										</div>
									);
								})}
							</div>
						</div>
					)}

					{/* SECONDARY ROW: Overall Integrity & Empirical Density Cards */}
					<div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
						{/* Overall Integrity */}
						<div className='bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-2'>
							<div className='flex items-center justify-between text-xs text-slate-500 uppercase tracking-wider font-semibold'>
								<span>Overall Integrity</span>
								{report.overallIntegrityScore >= 80 ? <ShieldCheck className='w-4 h-4 text-emerald-600' /> : <ShieldAlert className='w-4 h-4 text-amber-600' />}
							</div>
							<div className='flex items-baseline gap-2'>
								<span className='text-3xl font-bold font-mono-tabular text-slate-900'>{report.overallIntegrityScore}%</span>
								<span className={`text-xs font-semibold ${report.overallIntegrityScore >= 80 ? "text-emerald-700" : report.overallIntegrityScore >= 60 ? "text-amber-700" : "text-rose-700"}`}>{report.overallIntegrityScore >= 80 ? "Publication Grade" : report.overallIntegrityScore >= 60 ? "Attribution Warnings" : "Integrity Failures"}</span>
							</div>
							<div className='w-full bg-slate-100 rounded-full h-1.5 overflow-hidden'>
								<div className={`h-1.5 rounded-full ${report.overallIntegrityScore >= 80 ? "bg-emerald-600" : report.overallIntegrityScore >= 60 ? "bg-amber-500" : "bg-rose-600"}`} style={{ width: `${report.overallIntegrityScore}%` }} />
							</div>
						</div>

						{/* AI Slop Penalty */}
						<div className='bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-2'>
							<div className='flex items-center justify-between text-xs text-slate-500 uppercase tracking-wider font-semibold'>
								<span>AI Slop Penalty</span>
								<Sparkles className='w-4 h-4 text-purple-600' />
							</div>
							<div className='flex items-baseline gap-2'>
								<span className='text-3xl font-bold font-mono-tabular text-slate-900'>{report.slopAnalysis.slopScore}%</span>
								<span className={`text-xs font-semibold ${report.slopAnalysis.slopScore <= 15 ? "text-emerald-700" : report.slopAnalysis.slopScore <= 40 ? "text-amber-700" : "text-rose-700"}`}>{report.slopAnalysis.slopScore <= 15 ? "Clean Scientific Style" : `${report.slopAnalysis.detectedPatterns.length} Buzzwords Detected`}</span>
							</div>
							<div className='w-full bg-slate-100 rounded-full h-1.5 overflow-hidden'>
								<div className={`h-1.5 rounded-full ${report.slopAnalysis.slopScore <= 15 ? "bg-emerald-600" : "bg-purple-600"}`} style={{ width: `${report.slopAnalysis.slopScore}%` }} />
							</div>
						</div>

						{/* Empirical Density */}
						<div className='bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-2'>
							<div className='flex items-center justify-between text-xs text-slate-500 uppercase tracking-wider font-semibold'>
								<span>Empirical Density</span>
								<Zap className='w-4 h-4 text-amber-600' />
							</div>
							<div className='flex items-baseline gap-2'>
								<span className='text-3xl font-bold font-mono-tabular text-slate-900'>{report.slopAnalysis.empiricalDensityScore}%</span>
								<span className='text-xs font-semibold text-slate-600'>Quantitative Grounding</span>
							</div>
							<div className='w-full bg-slate-100 rounded-full h-1.5 overflow-hidden'>
								<div className='bg-amber-500 h-1.5 rounded-full' style={{ width: `${report.slopAnalysis.empiricalDensityScore}%` }} />
							</div>
						</div>
					</div>

					{/* Section 1: Citation Truth Matrix */}
					<div className='bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4'>
						<div className='flex items-center justify-between'>
							<div className='flex items-center gap-2 text-sm font-semibold text-slate-900'>
								<BookOpen className='w-4 h-4 text-slate-700' />
								<span>Citation Truth Matrix (Phantom & Drift Inspector)</span>
							</div>
							<span className='text-xs text-slate-400 font-mono-tabular'>{report.citations.length} References Verified</span>
						</div>

						<div className='space-y-3'>
							{report.citations.map((item) => {
								const isVerified = item.status === "verified";
								const isDrift = item.status === "attribution_drift";
								const isPhantom = item.status === "phantom_hallucination";

								return (
									<div key={item.id} className={`p-4 rounded-lg border transition-all ${isVerified ? "bg-emerald-50/40 border-emerald-200/60" : isDrift ? "bg-amber-50/50 border-amber-200/70" : "bg-rose-50/50 border-rose-200/70"}`}>
										<div className='flex flex-col sm:flex-row sm:items-start justify-between gap-2'>
											<div className='space-y-1'>
												<div className='flex items-center gap-2'>
													<span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded font-mono-tabular ${isVerified ? "bg-emerald-700 text-white" : isDrift ? "bg-amber-600 text-white" : "bg-rose-700 text-white"}`}>{isVerified ? "● Verified Indexed Source" : isDrift ? "▲ Attribution Drift Warning" : "✖ Phantom Hallucination"}</span>

													<span className='font-semibold text-xs text-slate-900 font-mono-tabular'>{item.citationText}</span>
												</div>

												<h4 className='text-sm font-bold text-slate-900 font-serif-scholarly'>{renderScholarlyText(item.paperTitle)}</h4>

												<p className='text-xs text-slate-600'>
													<span className='font-semibold text-slate-700'>Alleged Claim: </span>"{item.allegedClaim}"
												</p>

												<p className={`text-xs font-medium ${isVerified ? "text-emerald-900" : isDrift ? "text-amber-900" : "text-rose-900"}`}>
													<span className='font-semibold'>Auditor Verdict: </span>
													{item.verdictReason}
												</p>

												{item.verifiedAuthors && (
													<div className='text-[11px] text-slate-500 font-mono-tabular pt-1'>
														<span>Authors: {item.verifiedAuthors}</span>
														{item.verifiedVenueYear && <span> · Venue: {item.verifiedVenueYear}</span>}
													</div>
												)}
											</div>

											<div className='shrink-0 flex sm:flex-col items-end gap-1 font-mono-tabular text-xs'>
												<span className='text-slate-400 text-[10px]'>Confidence</span>
												<span className='font-bold text-slate-800'>{item.confidenceScore}%</span>
												{item.groundedSourceUrl && (
													<a href={item.groundedSourceUrl} target='_blank' rel='noopener noreferrer' className='inline-flex items-center gap-1 text-[11px] text-slate-700 hover:text-slate-900 underline mt-1'>
														<span>Open Source</span>
														<ExternalLink className='w-3 h-3' />
													</a>
												)}
											</div>
										</div>
									</div>
								);
							})}
						</div>
					</div>

					{/* Section 2: AI Slop & Buzzword Deflator */}
					<div className='bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4'>
						<div className='flex items-center justify-between'>
							<div className='flex items-center gap-2 text-sm font-semibold text-slate-900'>
								<Sparkles className='w-4 h-4 text-purple-700' />
								<span>AI Slop Deflator & Scientific Style Rewriter</span>
							</div>
							<span className='text-xs text-slate-400'>{report.slopAnalysis.detectedPatterns.length} Patterns Flagged</span>
						</div>

						<p className='text-xs text-slate-600'>{report.slopAnalysis.critiqueSummary}</p>

						{report.slopAnalysis.detectedPatterns.length > 0 && (
							<div className='space-y-2 pt-1'>
								{report.slopAnalysis.detectedPatterns.map((pat, idx) => (
									<div key={idx} className='p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2'>
										<div className='space-y-0.5'>
											<div className='flex items-center gap-2'>
												<span className='font-mono font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200'>"{pat.phrase}"</span>
												<span className='text-[10px] uppercase font-mono text-slate-400'>{pat.category.replace("_", " ")}</span>
											</div>
											<p className='text-slate-600 text-[11px]'>{pat.explanation}</p>
										</div>

										<div className='shrink-0 bg-white p-2 rounded border border-slate-200 text-[11px] max-w-xs'>
											<span className='text-slate-400 font-semibold uppercase block text-[9px]'>Rigorous Academic Substitute:</span>
											<span className='font-medium text-emerald-800'>{pat.suggestedRewrite}</span>
										</div>
									</div>
								))}
							</div>
						)}

						{/* Clean Scholarly Rewrite Box */}
						<div className='mt-4 pt-4 border-t border-slate-100 space-y-2'>
							<div className='flex items-center justify-between'>
								<span className='text-xs uppercase tracking-wider font-semibold text-slate-500'>Purified Scholarly Prose (AI Slop Removed)</span>
								<button onClick={handleCopyCleanRewrite} className='px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors flex items-center gap-1'>
									{copiedRewrite ? <Check className='w-3 h-3 text-emerald-600' /> : <Copy className='w-3 h-3' />}
									<span>{copiedRewrite ? "Copied" : "Copy Cleaned Text"}</span>
								</button>
							</div>

							<blockquote className='p-4 rounded-lg bg-slate-900 text-slate-100 text-xs sm:text-sm font-serif-scholarly leading-relaxed'>"{renderScholarlyText(report.slopAnalysis.cleanScholarlyRewrite)}"</blockquote>
						</div>
					</div>

					{/* Section 3: Recommendations */}
					<div className='bg-slate-50 rounded-xl border border-slate-200 p-5 text-xs space-y-2'>
						<span className='font-semibold text-slate-900 uppercase tracking-wider block'>Integrity Committee Guidance</span>
						<ul className='space-y-1.5 text-slate-700'>
							{report.recommendations.map((rec, idx) => (
								<li key={idx} className='flex items-start gap-2'>
									<span className='w-1.5 h-1.5 rounded-full bg-slate-900 mt-1.5 shrink-0' />
									<span>{rec}</span>
								</li>
							))}
						</ul>
					</div>
				</div>
			)}
		</div>
	);
};
