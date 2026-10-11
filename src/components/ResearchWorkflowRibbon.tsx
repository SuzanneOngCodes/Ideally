import React from "react";
import { ChevronRight, ChevronLeft, Compass, ArrowLeft } from "lucide-react";
import { NavTab } from "./Header";
import { ResearchBrief } from "../types/research";
import { useLanguage } from "../context/LanguageContext";

interface ResearchWorkflowRibbonProps {
	activeTab: NavTab;
	onSelectTab: (tab: NavTab) => void;
	brief: ResearchBrief;
}

export const ResearchWorkflowRibbon: React.FC<ResearchWorkflowRibbonProps> = ({ activeTab, onSelectTab, brief }) => {
	const { t } = useLanguage();

	const coreStages: { id: NavTab; step: number; label: string; shortLabel: string }[] = [
		{ id: "problem", step: 1, label: t("navProblem"), shortLabel: "Problem" },
		{ id: "knowledge", step: 2, label: t("navKnowledge"), shortLabel: "Knowledge" },
		{ id: "tradeoffs", step: 3, label: t("navTradeoffs"), shortLabel: "Trade-offs" },
		{ id: "experiment", step: 4, label: t("navExperiment"), shortLabel: "Experiment" },
		{ id: "brief", step: 5, label: t("navBrief"), shortLabel: "Brief" },
	];

	const currentStageIndex = coreStages.findIndex((s) => s.id === activeTab);
	const isCoreStage = currentStageIndex !== -1;

	const handlePrev = () => {
		if (currentStageIndex > 0) {
			onSelectTab(coreStages[currentStageIndex - 1].id);
		} else if (activeTab === "problem") {
			onSelectTab("workspace");
		}
	};

	const handleNext = () => {
		if (currentStageIndex >= 0 && currentStageIndex < coreStages.length - 1) {
			onSelectTab(coreStages[currentStageIndex + 1].id);
		} else if (activeTab === "brief") {
			onSelectTab("defense");
		}
	};

	return (
		<div className='bg-white border-b border-slate-200/90 shadow-2xs sticky top-16 z-30'>
			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-3 overflow-x-auto no-scrollbar'>
				{/* Left: Quick Return to Workspace & Context */}
				<div className='flex items-center gap-2.5 shrink-0'>
					<button onClick={() => onSelectTab("workspace")} className='flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 transition-all whitespace-nowrap cursor-pointer' title={t("navWorkspace")}>
						<Compass className='w-3.5 h-3.5 text-slate-700' />
						<span className='hidden sm:inline'>{t("navWorkspace")}</span>
					</button>

					<span className='text-slate-300 hidden md:inline' aria-hidden='true'>
						|
					</span>

					<div className='hidden md:flex items-center gap-1.5 text-xs text-slate-500'>
						<span className='font-semibold text-slate-800 font-serif-scholarly truncate max-w-[200px] lg:max-w-xs'>{brief.title}</span>
						<span className='text-slate-300'>·</span>
						<span className='font-mono-tabular text-[11px] text-slate-400'>Stage {isCoreStage ? currentStageIndex + 1 : 1} of 5</span>
					</div>
				</div>

				{/* Center: Clean 5-Stage Stepper */}
				<div className='flex items-center gap-1 sm:gap-1.5'>
					{coreStages.map((stage, idx) => {
						const isActive = activeTab === stage.id;
						const isCompleted = isCoreStage && currentStageIndex > idx;

						return (
							<React.Fragment key={stage.id}>
								<button onClick={() => onSelectTab(stage.id)} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap group ${isActive ? "bg-slate-900 text-white shadow-2xs font-semibold" : isCompleted ? "text-slate-700 hover:bg-slate-100" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"}`}>
									<span className={`w-4 h-4 rounded-full flex items-center justify-center font-mono-tabular text-[10px] shrink-0 ${isActive ? "bg-white text-slate-900 font-bold" : isCompleted ? "bg-emerald-100 text-emerald-700 font-bold" : "bg-slate-200/80 text-slate-600 group-hover:bg-slate-300"}`}>{isCompleted ? "✓" : stage.step}</span>
									<span className='hidden sm:inline'>{stage.label}</span>
									<span className='sm:hidden'>{stage.shortLabel}</span>
								</button>

								{idx < coreStages.length - 1 && <ChevronRight className='w-3 h-3 text-slate-300 shrink-0' />}
							</React.Fragment>
						);
					})}
				</div>

				{/* Right: Stage Navigation Steppers (< / >) */}
				<div className='flex items-center gap-1 shrink-0'>
					<button onClick={handlePrev} className='p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors' title='Previous Stage'>
						<ChevronLeft className='w-4 h-4' />
					</button>
					<button onClick={handleNext} className='p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors' title='Next Stage'>
						<ChevronRight className='w-4 h-4' />
					</button>
				</div>
			</div>
		</div>
	);
};
