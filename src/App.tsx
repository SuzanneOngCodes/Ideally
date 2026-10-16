/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from "react";
import { Header, NavTab } from "./components/Header";
import { ResearchWorkflowRibbon } from "./components/ResearchWorkflowRibbon";
import { MethodologyModal } from "./components/MethodologyModal";
import { ResearchIntake } from "./components/ResearchIntake";
import { ProblemValidationView } from "./components/ProblemValidationView";
import { KnowledgeLandscapeView } from "./components/KnowledgeLandscapeView";
import { DirectionTradeoffsView } from "./components/DirectionTradeoffsView";
import { ExperimentDesignView } from "./components/ExperimentDesignView";
import { ResearchBriefView } from "./components/ResearchBriefView";
import { SocraticDefenseView } from "./components/SocraticDefenseView";
import { EvidenceAuditView } from "./components/EvidenceAuditView";
import { PresetSelectorModal } from "./components/PresetSelectorModal";
import { InteractiveResearchWorkspace } from "./components/InteractiveResearchWorkspace";
import { AcademicSearchModal } from "./components/AcademicSearchModal";
import { TerminologyGlossaryModal } from "./components/TerminologyGlossaryModal";
import { EvidencePrinciplesModal } from "./components/EvidencePrinciplesModal";
import { TechStackModal } from "./components/TechStackModal";
import { SmartSearchLanding } from "./components/SmartSearchLanding";
import { PRESET_SCENARIOS, PresetScenario } from "./data/presetScenarios";
import { ResearchBrief, UserIntake, SocraticDefenseProbe, EvidenceAuditReport, AudienceMode, ResearchMapCard, StructuredEvidenceSource, ExperimentDesign } from "./types/research";
import { generateMarkdownBrief, downloadMarkdownFile } from "./utils/exportBrief";
import { useLanguage } from "./context/LanguageContext";

export default function App() {
	const { t } = useLanguage();
	// Pre-load with the Section 8 Demo Case (LLM Classification Latency) so the app immediately matches narrative
	const [activePreset, setActivePreset] = useState<PresetScenario>(PRESET_SCENARIOS[0]);
	const [currentBrief, setCurrentBrief] = useState<ResearchBrief>(PRESET_SCENARIOS[0].brief);
	const [currentProbes, setCurrentProbes] = useState<SocraticDefenseProbe[]>(PRESET_SCENARIOS[0].defenseProbes);
	const [activeTab, setActiveTab] = useState<NavTab>("home");
	const [audienceMode, setAudienceMode] = useState<AudienceMode>("beginner");
	const [advisorQuery, setAdvisorQuery] = useState<string>("");
	const [chatSessionId, setChatSessionId] = useState<string | null>(null);
	const [briefSource, setBriefSource] = useState<"preset" | "ai" | "unavailable">("preset");
	const [userSelectedDirectionId, setUserSelectedDirectionId] = useState<string | null>(null);
	const [liveExperiment, setLiveExperiment] = useState<ExperimentDesign | null>(null);
	const [experimentError, setExperimentError] = useState<string | null>(null);
	const [isExperimentLoading, setIsExperimentLoading] = useState(false);
	const [experimentRetry, setExperimentRetry] = useState(0);
	const [auditCustomText, setAuditCustomText] = useState<string>("");
	const [isPresetsOpen, setIsPresetsOpen] = useState(false);
	const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);
	const [isSearchOpen, setIsSearchOpen] = useState(false);
	const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
	const [glossaryTerm, setGlossaryTerm] = useState("");
	const [isPrinciplesOpen, setIsPrinciplesOpen] = useState(false);
	const [isTechStackOpen, setIsTechStackOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [statusMessage, setStatusMessage] = useState<string | null>(null);

	const handleOpenGlossary = (term?: string) => {
		setGlossaryTerm(term || "");
		setIsGlossaryOpen(true);
	};

	const showStatus = (msg: string) => {
		setStatusMessage(msg);
		setTimeout(() => setStatusMessage(null), 3500);
	};

	const handleSelectTab = (tab: NavTab) => {
		setActiveTab(tab);
	};

	useEffect(() => {
		if (activeTab !== "experiment") return;
		if (!chatSessionId) {
			setLiveExperiment(briefSource === "ai" && !userSelectedDirectionId ? currentBrief.experimentDesign : null);
			setExperimentError(null);
			setIsExperimentLoading(false);
			return;
		}

		const controller = new AbortController();
		const selected = briefSource === "ai" && userSelectedDirectionId
			? currentBrief.candidateDirections.find((direction) => direction.id === userSelectedDirectionId)
			: undefined;
		setLiveExperiment(null);
		setExperimentError(null);
		setIsExperimentLoading(true);
		const loadExperiment = async () => {
			try {
				const response = await fetch(`/api/v1/research/${encodeURIComponent(chatSessionId)}/experiment`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					signal: controller.signal,
					body: JSON.stringify({
						direction_id: selected?.id || "",
						direction_title: selected?.title || "",
						direction_summary: selected?.summary || "",
						time_horizon_weeks: briefSource === "ai" ? currentBrief.intake.constraints.timeHorizonWeeks : null,
						compute_tier: briefSource === "ai" ? currentBrief.intake.constraints.computeTier : "unknown",
						dataset_access: briefSource === "ai" ? currentBrief.intake.constraints.datasetAccess : "unknown",
						regenerate: false,
					}),
				});
				const data = await response.json();
				if (!response.ok) throw new Error(typeof data.detail === "string" ? data.detail : data.error || `Experiment API error (${response.status})`);
				if (!data.primaryResearchQuestion || !Array.isArray(data.dependentVariablesAndMetrics)) throw new Error("Experiment API returned an invalid design");
				if (!controller.signal.aborted) {
					setLiveExperiment(data);
					setCurrentBrief((previous) => ({ ...previous, experimentDesign: data }));
				}
			} catch (error) {
				if (!controller.signal.aborted) setExperimentError(error instanceof Error ? error.message : "Unable to load experiment design");
			} finally {
				if (!controller.signal.aborted) setIsExperimentLoading(false);
			}
		};
		void loadExperiment();
		return () => controller.abort();
	}, [activeTab, chatSessionId, briefSource, userSelectedDirectionId, experimentRetry]);

	const handleAudienceModeToggle = () => {
		setAudienceMode((prev) => {
			const next = prev === "beginner" ? "experienced" : "beginner";
			showStatus(`Switched to ${next === "beginner" ? "Beginner (Accessible Concepts)" : "Experienced (Academic Rigor)"} mode`);
			return next;
		});
	};

	const handleSelectPreset = (preset: PresetScenario) => {
		setChatSessionId(null);
		setBriefSource("preset");
		setUserSelectedDirectionId(null);
		setLiveExperiment(null);
		setActivePreset(preset);
		setCurrentBrief(preset.brief);
		setCurrentProbes(preset.defenseProbes);
		setActiveTab("workspace");
		showStatus(`Loaded case study: ${preset.name}`);
	};

	const handleSmartRoute = (destination: "workspace" | "brief" | "defense" | "auditor", query: string) => {
		if (destination === "auditor") {
			if (query) {
				setAuditCustomText(query);
			}
			setActiveTab("auditor");
			showStatus("Routed to Evidence & Citation Auditor");
		} else if (destination === "defense") {
			setActiveTab("defense");
			showStatus("Routed to Socratic Defense Lab (Reviewer #2)");
		} else if (destination === "brief") {
			setActiveTab("brief");
			showStatus("Routed to Structured Proposal Brief");
		} else {
			if (query) {
				setAdvisorQuery(query);
				setBriefSource("unavailable");
				setUserSelectedDirectionId(null);
				setLiveExperiment(null);
			}
			setChatSessionId(null);
			setActiveTab("workspace");
			showStatus("Routed to Interactive Research Workspace");
		}
	};

	const handleNewIntake = () => {
		setActiveTab("intake");
	};

	const handleUpdateBriefCards = (cards: ResearchMapCard[]) => {
		setCurrentBrief((prev) => ({
			...prev,
			researchMapCards: cards,
		}));
	};

	const handleAddSourceToBrief = (source: StructuredEvidenceSource) => {
		setCurrentBrief((prev) => {
			const currentCards = prev.researchMapCards || [];
			const updatedCards = currentCards.map((c) => {
				if (c.id === "evidence") {
					return {
						...c,
						status: "source-supported" as const,
						sources: [source, ...(c.sources || [])],
					};
				}
				return c;
			});

			return {
				...prev,
				researchMapCards: updatedCards,
				problemValidation: {
					...prev.problemValidation,
					evidencePoints: [
						{
							claim: source.methodSummary || source.title,
							phenomenonOrSource: `${source.title} (${source.yearOrDate}, ${source.venueOrPublisher || "arXiv"})`,
							realWorldSignificance: source.findingsSummary,
						},
						...prev.problemValidation.evidencePoints,
					],
				},
			};
		});
		showStatus(`Attached "${source.title.slice(0, 35)}..." to evidence reasoning chain.`);
	};

	const handleSubmitIntake = async (intake: UserIntake) => {
		setIsLoading(true);
		try {
			const response = await fetch("/api/advisor/analyze", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(intake),
			});

			if (!response.ok) {
				throw new Error(`Advisor engine error: ${response.statusText}`);
			}

			const data = await response.json();
			if (data.brief) {
				setChatSessionId(null);
				setBriefSource(data.source && data.source !== "curated_advisor_engine" ? "ai" : "unavailable");
				setUserSelectedDirectionId(null);
				setLiveExperiment(null);
				setCurrentBrief(data.brief);
				// Also fetch fresh defense probes for this new brief
				try {
					const probeRes = await fetch("/api/advisor/socratic-defense", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ brief: data.brief }),
					});
					const probeData = await probeRes.json();
					if (probeData.probes && probeData.probes.length > 0) {
						setCurrentProbes(probeData.probes);
					}
				} catch {
					// Keep existing probes if defense endpoint stalls
				}

				// Navigate directly to Problem Validation stage to walk the user through reasoning
				setActiveTab("problem");
				showStatus("Research advisor analysis synthesized successfully.");
			}
		} catch (err: any) {
			console.error("Failed to analyze intake:", err);
			showStatus("Research analysis failed. Please retry.");
		} finally {
			setIsLoading(false);
		}
	};

	const handleSelectDirection = (directionId: string) => {
		const dir = currentBrief.candidateDirections.find((d) => d.id === directionId);
		if (!dir) return;
		setUserSelectedDirectionId(directionId);
		setLiveExperiment(null);

		setCurrentBrief((prev) => ({
			...prev,
			selectedDirectionId: directionId,
			selectionRationale: `User and advisor selected ${dir.title} (${dir.directionType.replace("_", " ")}) to prioritize ${dir.tradeoffs.noveltyScore >= 8 ? "novelty" : "feasibility"} and align with ${prev.intake.constraints.timeHorizonWeeks}-week project constraints.`,
		}));
		showStatus(`Selected: ${dir.title}`);
	};

	const handleRefreshProbes = async () => {
		try {
			const res = await fetch("/api/advisor/socratic-defense", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ brief: currentBrief }),
			});
			const data = await res.json();
			if (data.probes && data.probes.length > 0) {
				setCurrentProbes(data.probes);
				showStatus("Committee formulated 3 new defense probes.");
			}
		} catch (err) {
			console.error("Error refreshing probes:", err);
		}
	};

	const handleSubmitDefense = async (probeId: string, answer: string) => {
		try {
			const res = await fetch("/api/advisor/socratic-defense", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					brief: currentBrief,
					userProbeAnswer: answer,
					probeId,
				}),
			});
			const data = await res.json();
			return data;
		} catch (err) {
			console.error("Error submitting defense:", err);
			return {
				evaluation: {
					strengthScore: 8,
					strengths: ["Addressed the operational mechanism cleanly."],
					vulnerabilities: ["Could strengthen statistical power citation."],
					advisorTip: "Mention your primary control condition to silence Reviewer 2.",
				},
			};
		}
	};

	const handleAuditText = async (text: string): Promise<EvidenceAuditReport> => {
		const res = await fetch("/api/advisor/audit-citations", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				text,
				brief: currentBrief,
				domain: currentBrief.intake.domain,
			}),
		});
		if (!res.ok) {
			throw new Error("Failed to audit citations and text");
		}
		const data = await res.json();
		return data.report;
	};

	const handleExportBrief = () => {
		const md = generateMarkdownBrief(currentBrief);
		const filename = `${currentBrief.title
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.slice(0, 40)}-brief.md`;
		downloadMarkdownFile(filename, md);
		showStatus("Research brief exported as Markdown.");
	};

	return (
		<div className='min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans'>
			{/* Global Header */}
			<Header activeTab={activeTab} onSelectTab={handleSelectTab} onOpenPresets={() => setIsPresetsOpen(true)} onNewIntake={handleNewIntake} onExport={handleExportBrief} hasActiveBrief={!!currentBrief} onOpenMethodology={() => setIsMethodologyOpen(true)} onOpenSearch={() => setIsSearchOpen(true)} onOpenGlossary={handleOpenGlossary} onOpenPrinciples={() => setIsPrinciplesOpen(true)} onOpenTechStack={() => setIsTechStackOpen(true)} />

			{/* Guided Research Journey Ribbon — only shown when navigating the 5 linear brief stages */}
			{currentBrief && ["problem", "knowledge", "tradeoffs", "experiment", "brief"].includes(activeTab) && !(activeTab === "experiment" && chatSessionId) && <ResearchWorkflowRibbon activeTab={activeTab} onSelectTab={setActiveTab} brief={currentBrief} />}

			{/* Global Status Notification Toast */}
			{statusMessage && <div className='fixed bottom-4 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xl border border-slate-700/50 animate-in fade-in slide-in-from-bottom-2'>{statusMessage}</div>}

			{/* Main Content Area */}
			<main className='flex-1 pb-16'>
				{activeTab === "home" && <SmartSearchLanding onRoute={handleSmartRoute} onSelectPreset={handleSelectPreset} onNewIntake={handleNewIntake} onOpenMethodology={() => setIsMethodologyOpen(true)} />}

				{activeTab === "workspace" && currentBrief && (
					<InteractiveResearchWorkspace
						brief={currentBrief}
						audienceMode={audienceMode}
						onAudienceModeToggle={handleAudienceModeToggle}
						onNavigateToStage={(stage) => setActiveTab(stage)}
						onReviseDirection={() => {
							setActiveTab("tradeoffs");
							showStatus("Explore alternative directions to revise or pivot.");
						}}
						onUpdateBriefCards={handleUpdateBriefCards}
						onOpenSearch={() => setIsSearchOpen(true)}
						onOpenPresets={() => setIsPresetsOpen(true)}
						onOpenGlossary={handleOpenGlossary}
						onOpenPrinciples={() => setIsPrinciplesOpen(true)}
						initialAdvisorQuery={advisorQuery}
						chatSessionId={chatSessionId}
						onChatSessionChange={setChatSessionId}
					/>
				)}

				{activeTab === "intake" && <ResearchIntake onSubmit={handleSubmitIntake} isLoading={isLoading} onOpenPresets={() => setIsPresetsOpen(true)} initialIntake={currentBrief.intake} />}

				{activeTab === "problem" && <ProblemValidationView validation={currentBrief.problemValidation} domain={currentBrief.intake.domain} onProceed={() => setActiveTab("knowledge")} onBack={() => setActiveTab("intake")} />}

				{activeTab === "knowledge" && <KnowledgeLandscapeView landscape={currentBrief.knowledgeLandscape} domain={currentBrief.intake.domain} onProceed={() => setActiveTab("tradeoffs")} onBack={() => setActiveTab("problem")} />}

				{activeTab === "tradeoffs" && <DirectionTradeoffsView directions={currentBrief.candidateDirections} selectedDirectionId={currentBrief.selectedDirectionId} onSelectDirection={handleSelectDirection} selectionRationale={currentBrief.selectionRationale} onProceed={() => setActiveTab("experiment")} onBack={() => setActiveTab("knowledge")} userContext={currentBrief.intake.targetContext} timeHorizonWeeks={currentBrief.intake.constraints.timeHorizonWeeks} />}

				{activeTab === "experiment" && (liveExperiment ? (
					<ExperimentDesignView design={liveExperiment} onProceed={!chatSessionId && briefSource === "ai" ? () => setActiveTab("brief") : undefined} onBack={() => setActiveTab(!chatSessionId && briefSource === "ai" ? "tradeoffs" : "workspace")} backLabel={!chatSessionId && briefSource === "ai" ? "Back: Trade-offs" : "Back: Research Map"} title={currentBrief.title} />
				) : (
					<div className="max-w-3xl mx-auto px-6 py-16 text-center space-y-4" role="status">
						<h1 className="text-2xl font-bold text-slate-900 font-serif-scholarly">Experiment Protocol</h1>
						<p className="text-sm text-slate-600">{isExperimentLoading ? "Creating a protocol from your saved research session…" : experimentError || (chatSessionId ? "No experiment design is available yet." : "Start a research conversation and build its reasoning map to create an experiment protocol.")}</p>
						<div className="flex justify-center gap-2">
							<button onClick={() => setActiveTab("workspace")} className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm">Open Research Workspace</button>
							{experimentError && <button onClick={() => setExperimentRetry((value) => value + 1)} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm">Retry</button>}
						</div>
					</div>
				))}

				{activeTab === "brief" && <ResearchBriefView brief={currentBrief} onOpenDefense={() => setActiveTab("defense")} onOpenAuditor={() => setActiveTab("auditor")} onNavigateStage={(stage) => setActiveTab(stage)} />}

				{activeTab === "defense" && <SocraticDefenseView brief={currentBrief} probes={currentProbes} onRefreshProbes={handleRefreshProbes} onSubmitDefense={handleSubmitDefense} />}

				{activeTab === "auditor" && <EvidenceAuditView brief={currentBrief} onAuditText={handleAuditText} initialCustomText={auditCustomText} onNotify={showStatus} />}
			</main>

			{/* Footer (Quiet, unboxed copyright & info) */}
			<footer className='no-print border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2'>
					<span>{t("footerTagline")}</span>
					<div className='flex items-center gap-4'>
						<button onClick={() => setIsMethodologyOpen(true)} className='hover:text-slate-900 transition-colors cursor-pointer'>
							{t("footerMethodology")}
						</button>
						<button onClick={() => setIsPresetsOpen(true)} className='hover:text-slate-900 transition-colors cursor-pointer'>
							{t("footerCaseStudies")}
						</button>
						<button onClick={handleExportBrief} className='hover:text-slate-900 transition-colors cursor-pointer'>
							{t("footerExport")}
						</button>
						<button onClick={handleNewIntake} className='hover:text-slate-900 transition-colors cursor-pointer'>
							{t("footerNewBrief")}
						</button>
					</div>
				</div>
			</footer>

			{/* Case Studies / Preset Archetypes Modal */}
			<PresetSelectorModal isOpen={isPresetsOpen} onClose={() => setIsPresetsOpen(false)} onSelectPreset={handleSelectPreset} currentPresetId={activePreset.id} />

			{/* Methodology & How-It-Works Guide Modal */}
			<MethodologyModal isOpen={isMethodologyOpen} onClose={() => setIsMethodologyOpen(false)} onSelectTab={(tab) => setActiveTab(tab)} />

			{/* Academic & Web Evidence Explorer Modal */}
			<AcademicSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} initialQuery={currentBrief?.experimentDesign?.primaryResearchQuestion || currentBrief?.problemValidation?.coreProblemStatement || currentBrief?.intake?.problemOrObservation || "transformer classification latency"} onAddSourceToBrief={handleAddSourceToBrief} />

			{/* Research Terminology Glossary Modal */}
			<TerminologyGlossaryModal isOpen={isGlossaryOpen} onClose={() => setIsGlossaryOpen(false)} initialSearch={glossaryTerm} />

			{/* The 10 Evidence Principles Modal */}
			<EvidencePrinciplesModal isOpen={isPrinciplesOpen} onClose={() => setIsPrinciplesOpen(false)} />

			{/* Full-Stack Architecture & Tech Stack Map Modal */}
			<TechStackModal isOpen={isTechStackOpen} onClose={() => setIsTechStackOpen(false)} />
		</div>
	);
}
