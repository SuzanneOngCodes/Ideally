import { ResearchBrief, SocraticDefenseProbe } from "../types/research";
import { LLM_CLASSIFICATION_LATENCY_PRESET } from "./demoCaseScenario";

export interface PresetScenario {
	id: string;
	name: string;
	tagline: string;
	domain: string;
	context: "capstone" | "academic_conference" | "industry_rnd" | "thesis";
	intakeSummary: string;
	brief: ResearchBrief;
	defenseProbes: SocraticDefenseProbe[];
}

export const PRESET_SCENARIOS: PresetScenario[] = [
	LLM_CLASSIFICATION_LATENCY_PRESET,
	{
		id: "healthcare-ehr-drift",
		name: "Clinical AI Diagnostic Drift",
		tagline: "Silent failure of 30-day readmission models triggered by hospital UI brevity shifts",
		domain: "Clinical Informatics & Machine Learning",
		context: "capstone",
		intakeSummary: "Observed that an ICU readmission predictor model had AUC drop from 0.84 to 0.69 following an EHR template change that encouraged shorter nursing notes.",
		brief: {
			id: "brief-ehr-drift-01",
			createdAt: "2026-09-18T14:30:00Z",
			title: "Combating Syntactic Brevity Drift: Robustness of Clinical Readmission Risk Predictors Under EHR Template Shifts",
			intake: {
				mode: "observation_hypothesis",
				domain: "Healthcare Informatics & Applied NLP",
				problemOrObservation: "Clinical staff transitioned to streamlined EHR macro-templates with checkboxes, reducing free-text nursing narrative length by 42%. Subsequent hospital readmission alert sensitivity dropped drastically despite unchanged patient demographics.",
				earlyHypothesis: "Existing transformer models rely heavily on token co-occurrence in unstructured clinical progress notes rather than standardized lab biomarker trajectories, causing catastrophic confidence collapse when note brevity changes.",
				targetContext: "capstone",
				constraints: {
					timeHorizonWeeks: 12,
					computeTier: "single_gpu",
					datasetAccess: "public_only",
					humanSubjects: false,
					budgetNotes: "Zero external funding; leveraging public MIMIC-IV and PhysioNet databases on campus GPU.",
				},
			},
			problemValidation: {
				coreProblemStatement: "Clinical machine learning models deployed for ICU 30-day readmission forecasting degrade silently when clinical documentation practices change, leading to missed early interventions for vulnerable cardiac and sepsis patients.",
				realWorldImpact: "Over 200,000 preventable ICU readmissions occur annually in the US alone. When prediction systems suffer covariate shift from UI updates, bedside alert fatigue increases and clinicians lose trust in algorithmic triaging.",
				stakeholdersAffected: ["ICU nurses and attending intensivists burdened by miscalibrated alarm thresholds", "Post-discharge patients at high risk of rapid decompensation", "Hospital quality officers facing Medicare 30-day readmission financial penalties"],
				failureModesOfStatusQuo: ["Static retraining on annualized batches misses rapid mid-year software template changes", "Blind text embeddings treat documentation style as patient phenotype", "Absence of documentation-invariant representation checks prior to alert generation"],
				evidencePoints: [
					{
						claim: "EHR macro-template adoption correlates with a 38-50% drop in unstructured narrative density across tertiary hospitals.",
						phenomenonOrSource: "Annals of Internal Medicine (2024 EHR Usability Study)",
						realWorldSignificance: "Models trained on verbose notes cannot transfer to modern structured-click documentation styles.",
					},
					{
						claim: "Clinical NLP models show up to a 0.17 AUC-ROC degradation when tested on synthetically compressed progress notes.",
						phenomenonOrSource: "PhysioNet Challenge Benchmark Empirical Observations",
						realWorldSignificance: "Confirms that token volume acts as an unintended shortcut feature in risk scoring.",
					},
				],
				urgencyVerdict: "High Urgency: Hospitals continuously redesign EHR interfaces to counter clinician burnout, unintentionally destabilizing deployed clinical AI pipelines.",
			},
			knowledgeLandscape: {
				establishedConsensus: ["Multimodal models combining structured vitals (HR, BP, lactate) with clinical notes outperform unimodal models by 6-9% AUROC.", "Domain adaptation via continual pre-training is standard but computationally prohibitive for resource-constrained community clinics.", "Shortcut learning on note length is a known vulnerability in clinical BERT variants (BioClinicalBERT, Med-PaLM)."],
				existingApproaches: [
					{
						approachName: "Adversarial Domain Generalization",
						representativeParadigm: "Gradient reversal layers penalizing style discriminators",
						primaryLimitation: "Destabilizes training dynamics and reduces peak accuracy on in-distribution patient cohorts.",
					},
					{
						approachName: "Rule-Based Entity Normalization Pipeline",
						representativeParadigm: "UMLS / SNOMED concept extraction prior to bag-of-concepts prediction",
						primaryLimitation: 'Discards nuanced linguistic hedging (e.g., "cannot rule out pulmonary embolism") critical to early diagnosis.',
					},
					{
						approachName: "Structured-Only Fallback Predictors",
						representativeParadigm: "Gradient boosted trees on laboratory and telemetry time-series only",
						primaryLimitation: "Lacks social determinants of health and nuanced functional status captured solely in nursing summaries.",
					},
				],
				criticalKnowledgeGap: "How to decouple clinical semantic content from syntactic documentation brevity without discarding clinical nuance or requiring multi-node GPU retraining.",
				whyUnsolvedUntilNow: "Previous academic benchmarks (e.g. MIMIC-III) featured static, legacy text corpora where documentation patterns were stationary across historical years.",
			},
			candidateDirections: [
				{
					id: "dir-1",
					title: "Direction A: Synthetically Perturbed Brevity Invariant Training (SPBIT)",
					directionType: "architectural_intervention",
					summary: "Apply controlled counterfactual brevity transformations (summarization, ellipsis, bulletizing) during contrastive learning to enforce embedding invariance across documentation styles.",
					whyPursue: "Directly addresses the root cause of shortcut learning with minimal computational overhead during inference.",
					tradeoffs: {
						noveltyScore: 8,
						feasibilityScore: 9,
						impactScore: 9,
						riskLevel: "Moderate",
					},
					requiredResources: ["Single RTX 4090 GPU", "MIMIC-IV de-identified dataset", "Open-source Mistral-7B for offline synthetic perturbation generation"],
					potentialPitfalls: "Synthetic perturbations might hallucinate clinical facts or strip critical rare clinical symptom tokens if not constrained.",
					suitabilityForContext: "Optimal for a 12-week capstone: mathematically rigorous, runnable on local hardware, and yields clear publishable empirical ablation tables.",
					isRecommended: true,
				},
				{
					id: "dir-2",
					title: "Direction B: Multi-Task Diagnostic Disentanglement Network",
					directionType: "theory_grounded",
					summary: 'Architect a dual-stream latent space that explicitly separates a "writer style vector" from a "pathology state vector" using mutual information minimization.',
					whyPursue: "Provides elegant mathematical guarantees of style invariance and interpretable clinical latent variables.",
					tradeoffs: {
						noveltyScore: 9,
						feasibilityScore: 5,
						impactScore: 8,
						riskLevel: "High",
					},
					requiredResources: ["High-performance cluster", "Multi-annotator clinical style corpus", "Extensive hyperparameter sweep time"],
					potentialPitfalls: "Mutual information estimators (e.g. MINE) are notoriously unstable and prone to trivial zero-information collapse in NLP.",
					suitabilityForContext: "Excessively risky for a capstone runway; better suited for a 2-year doctoral thesis.",
					isRecommended: false,
				},
				{
					id: "dir-3",
					title: "Direction C: Post-Hoc Calibrated Brevity Gating Mechanism",
					directionType: "empirical_diagnostic",
					summary: "Build a dynamic confidence gating module that detects when note brevity crosses a shift threshold and adjusts alerting thresholds or flags uncertainty to the clinician.",
					whyPursue: "Plug-and-play simplicity; does not require retraining base foundation models.",
					tradeoffs: {
						noveltyScore: 5,
						feasibilityScore: 9,
						impactScore: 6,
						riskLevel: "Low",
					},
					requiredResources: ["Standard CPU / Python environment", "Access to model logits and token counts"],
					potentialPitfalls: "Only mitigates symptoms of miscalibration without fixing the underlying predictive power loss.",
					suitabilityForContext: "Safe fallback, but lacks the academic ambition and methodological novelty expected for top-tier capstone honors.",
					isRecommended: false,
				},
			],
			selectedDirectionId: "dir-1",
			selectionRationale: "Direction A strikes the ideal Pareto frontier: it has high real-world applicability, can be executed within a 12-week capstone timeline on a single campus GPU, and addresses the root cause rather than applying a cosmetic post-hoc bandaid.",
			experimentDesign: {
				primaryResearchQuestion: "Can contrastive representation alignment over synthetically compressed clinical notes preserve 30-day readmission prediction sensitivity within 3% of baseline when tested against severe (40-60%) real-world documentation brevity shifts?",
				falsifiableHypothesis: "Enforcing embedding distance minimization (InfoNCE loss) between paired full-length and compressed clinical notes will reduce the AUROC degradation across varying brevity cohorts from 0.15 to less than 0.03, without reducing baseline predictive accuracy on uncompressed data by more than 1.5%.",
				independentVariables: ["Training Objective: Standard Cross-Entropy vs. Invariant Contrastive Alignment (SPBIT)", "Evaluation Brevity Ratio: 100% (original), 75%, 50%, 25% token retention", "Clinical Note Type: Nursing progress notes vs. Attending discharge summaries"],
				dependentVariablesAndMetrics: [
					{
						metric: "AUROC Degradation Delta (ΔAUROC)",
						targetBenchmark: "ΔAUROC < 0.03 between 100% and 50% brevity levels (Baseline model drops > 0.14)",
						evaluationMethod: "Stratified 5-fold cross-validation on MIMIC-IV test split",
					},
					{
						metric: "Expected Calibration Error (ECE)",
						targetBenchmark: "ECE < 0.05 across all brevity tiers",
						evaluationMethod: "Reliability diagrams with 10 equal-width risk bins",
					},
					{
						metric: "Sensitivity at 80% Specificity Operating Point",
						targetBenchmark: "Retention of > 72% sensitivity under 50% compression",
						evaluationMethod: "Fixed clinical threshold evaluation matching hospital ICU alert policy",
					},
				],
				baselinesAndControls: [
					{
						name: "Naive BioClinicalBERT",
						type: "naive_baseline",
						rationale: "Standard clinical baseline without brevity mitigation, demonstrating the scale of silent degradation.",
					},
					{
						name: "Length-Augmented Tabular Baseline (CatBoost)",
						type: "sota_benchmark",
						rationale: "Gradient boosted trees incorporating explicit word counts and structured labs to test if shallow models suffer less drift.",
					},
					{
						name: "Ablation: Random Token Dropout Control",
						type: "ablation_control",
						rationale: "Controls for whether semantic compression matters, or whether random token masking provides identical regularization.",
					},
				],
				datasetAndApparatus: {
					primaryDatasetOrSetup: "MIMIC-IV v2.2 (Beth Israel Deaconess Medical Center de-identified clinical records, ICU readmissions cohort n=48,200).",
					sourceAndLicensing: "PhysioNet Credentialed Access (DUA already approved, ethics CITI certification compliant).",
					sampleScale: "48,200 admissions; filtered to 28,400 adult ICU patients with at least 2 clinical notes within 48h prior to discharge.",
					fallbackIfUnavailable: "eICU Collaborative Research Database (secondary public multi-center benchmark).",
				},
				milestoneTimeline: [
					{
						phase: "Phase 1: Cohort Extraction & Synthetic Shift Benchmark",
						durationWeeks: 3,
						objective: "Build reproducible data loader, filter ICU readmission cohort, generate 3 tiers of syntactic compression using offline LLM prompt filters.",
						stopGoCriteria: "Verify that baseline BioClinicalBERT exhibits >0.10 AUROC drop on synthetic shift. If drop is <0.03, reformulate shift model.",
					},
					{
						phase: "Phase 2: SPBIT Loss Implementation & Tuning",
						durationWeeks: 4,
						objective: "Implement paired contrastive alignment objective; run ablation on projection head dimension and temperature coefficient.",
						stopGoCriteria: "Training convergence reached within 8 GPU hours per run; contrastive loss monotonically decreasing without representation collapse.",
					},
					{
						phase: "Phase 3: Robustness Stress-Testing & Subgroup Analysis",
						durationWeeks: 3,
						objective: "Evaluate across cardiac vs respiratory vs septic subcohorts; perform ECE calibration audits.",
						stopGoCriteria: "Demonstrate statistically significant improvement (p < 0.01 via Delong test) over baseline on high-compression tier.",
					},
					{
						phase: "Phase 4: Synthesis, Brief Packaging & Defense Preparation",
						durationWeeks: 2,
						objective: "Compile comprehensive empirical research brief, generate clinical safety checklist, and prepare interactive advisory defense slides.",
						stopGoCriteria: "All code, weights, and replication scripts packaged in Docker container with reproducible seed logs.",
					},
				],
				validityThreats: [
					{
						threatType: "internal",
						description: "Synthetic compression generated by LLMs may introduce unnatural artifact words that the contrastive loss overfits to.",
						mitigationStrategy: "Validate synthetic notes against a human-annotated sample of 100 genuine brevity-shifted clinical notes from clinical partner.",
					},
					{
						threatType: "external",
						description: "MIMIC-IV is single-center (Boston, MA); documentation vocabulary may not reflect rural community clinics.",
						mitigationStrategy: "Zero-shot cross-evaluation on an independent eICU subset from Midwest regional health systems.",
					},
					{
						threatType: "construct",
						description: "30-day readmission can be influenced by post-discharge socioeconomic factors not present in hospital notes.",
						mitigationStrategy: "Explicitly report subgroup metrics stratified by Area Deprivation Index (ADI) deciles.",
					},
				],
				negativeResultValue: "Even if SPBIT fails to beat baseline AUROC by more than 1%, proving that clinical transformers cannot overcome brevity drift via semantic contrastive learning conclusively shifts the field toward structured-only multimodal fusion, preventing wasted clinical deployments.",
				successDefinition: "Achieve ΔAUROC < 0.03 under 50% compression with p < 0.01 significance, while retaining >98% of original uncompressed AUROC.",
			},
			advisorCritiques: [
				{
					category: "Clinical Plausibility",
					critique: "Reviewers may argue that real nurses omit clinical context when busy, rather than simply summarizing cleanly.",
					actionableAdjustment: 'Incorporate an "information loss" noise channel in synthetic generation where optional secondary symptom observations are completely omitted.',
				},
				{
					category: "Compute Budget Feasibility",
					critique: "Fine-tuning full transformer parameters on 30k long documents will exceed a single RTX 4090 memory limit.",
					actionableAdjustment: "Adopt LoRA (Low-Rank Adaptation) with rank 16 on attention projection weights, reducing GPU VRAM requirement by 74%.",
				},
			],
			feasibilityAssessment: {
				runwayWeeks: 12,
				budgetVerdict: "Fully Feasible ($0 cloud cost; runnable on local workstation GPU).",
				keyPrerequisite: "Active PhysioNet CITI research ethics credential (already established).",
			},
			bibtexSnippet: `@article{ideally2026ehrdrift,
  title={Combating Syntactic Brevity Drift: Robustness of Clinical Readmission Risk Predictors Under EHR Template Shifts},
  author={Ideally Research Collective},
  journal={Proceedings of the Machine Learning for Healthcare Conference (MLHC)},
  year={2026}
}`,
		},
		defenseProbes: [
			{
				id: "probe-1",
				persona: "Reviewer #2 (Empirical Skeptic)",
				probingTopic: "Confounding of Note Length vs Patient Sickness",
				question: "Isn’t it true that sicker patients naturally generate longer clinical notes because they have more complications? How do you ensure your brevity-invariant model isn’t simply blinding itself to an inherently predictive feature?",
				exampleAnswers: ["We decompose length into policy-induced brevity (EHR template changes) versus pathology-induced complexity by conditioning on APACHE-IV severity scores.", "We explicitly measure the correlation between length and severity index in both pre-shift and post-shift cohorts."],
			},
			{
				id: "probe-2",
				persona: "ICU Department Chair (Clinical Practitioner)",
				probingTopic: "Actionability & Bedside Alarm Fatigue",
				question: "If your model maintains high AUROC but produces a 15% increase in false positive alerts during evening shifts, our bedside staff will disable it. How does your experiment protocol guarantee alert calibration?",
				exampleAnswers: ["We mandate Expected Calibration Error (ECE) < 0.05 and evaluate sensitivity at a fixed false-positive ceiling (Specificity >= 85%).", "We evaluate time-of-day shift performance as an explicit secondary stratification metric in Milestone Phase 3."],
			},
			{
				id: "probe-3",
				persona: "Methodology Committee (Senior Academic)",
				probingTopic: "Generalization to Novel Unseen EHR Vendors",
				question: "You are testing on MIMIC (an Epic/Metavision environment). If a hospital uses Cerner Millennium or an in-house ambulatory portal, does your contrastive objective transfer without complete retraining?",
				exampleAnswers: ["Because our contrastive objective trains on generic linguistic transformations rather than vendor-specific keyword dictionaries, the learned representation is syntax-agnostic.", "We conduct zero-shot evaluation on eICU which spans multiple distinct vendor systems across 200+ hospitals."],
			},
		],
	},
	{
		id: "post-quantum-edge",
		name: "Post-Quantum Crypto on Edge MCUs",
		tagline: "Memory pressure & side-channel leakage trade-offs in ML-KEM on microcontrollers",
		domain: "Embedded Systems & Applied Cryptography",
		context: "thesis",
		intakeSummary: "Exploring how to deploy NIST standardized Post-Quantum Key Encapsulation (ML-KEM/Kyber-512) onto memory-constrained Cortex-M4 nodes without opening power side-channel vulnerabilities.",
		brief: {
			id: "brief-pq-edge-02",
			createdAt: "2026-09-19T10:15:00Z",
			title: "Ephemeral Stack Pressure vs Side-Channel Leakage: Constant-Time Number Theoretic Transform for ML-KEM on 32-bit Microcontrollers",
			intake: {
				mode: "blank_canvas",
				domain: "Embedded Security & Post-Quantum Cryptography",
				problemOrObservation: "NIST standardized ML-KEM (Kyber) requires polynomial multiplications that exhaust SRAM on low-cost IoT nodes (STM32, 64KB RAM). Existing optimized assembly saves RAM by recomputing NTT twiddle factors on the fly, but introduces timing and power variation.",
				earlyHypothesis: "An interleaved inplace Number Theoretic Transform (NTT) using registers for butterfly stages can maintain constant-time execution while reducing peak dynamic stack allocation by >35%.",
				targetContext: "thesis",
				constraints: {
					timeHorizonWeeks: 16,
					computeTier: "laptop",
					datasetAccess: "public_only",
					humanSubjects: false,
					budgetNotes: "Hardware evaluation kit: ChipWhisperer-Nano ($90) + STM32F401RE development board ($15).",
				},
			},
			problemValidation: {
				coreProblemStatement: "Billions of deployed industrial smart meters and automotive ECUs cannot fit standardized post-quantum cryptography within their strict 32KB-64KB SRAM budgets without incurring severe side-channel vulnerabilities.",
				realWorldImpact: "Harvest-now-decrypt-later attacks target encrypted telemetry that must remain confidential for 15-20 years. Without viable edge PQC implementations, manufacturers delay updates until classical RSA/ECC is broken.",
				stakeholdersAffected: ["Embedded firmware engineers designing long-lifespan industrial grid hardware", "Critical infrastructure operators facing post-quantum compliance mandates (CNSA 2.0)", "Automotive Tier-1 suppliers securing CAN bus gateways against remote interception"],
				failureModesOfStatusQuo: ["Discarding post-quantum security entirely for elliptic curve cryptography due to RAM exhaustion", "Utilizing naive memory-saving assembly routines that leak secret keys via power trace fluctuations", "Crashing microcontrollers via silent stack-heap collisions during key generation"],
				evidencePoints: [
					{
						claim: "Standard reference ML-KEM-512 decapsulation requires ~2.8KB stack memory, exceeding 40% of available free RAM on Cortex-M4 RTOS environments.",
						phenomenonOrSource: "PQClean / pqm4 Benchmark Repository (2024 Audit)",
						realWorldSignificance: "Leaves inadequate memory headroom for real-time sensor tasks and network buffers.",
					},
					{
						claim: "Unmasked NTT polynomial multiplication implementations demonstrate 100% key recovery within 5,000 power traces via Correlation Power Analysis (CPA).",
						phenomenonOrSource: "CHES (Cryptographic Hardware and Embedded Systems Conference)",
						realWorldSignificance: "Proves that memory optimizations cannot be divorced from physical side-channel defenses.",
					},
				],
				urgencyVerdict: "High Urgency: NSA CNSA 2.0 timeline mandates post-quantum transition start by 2027; hardware design cycles require immediate reference designs.",
			},
			knowledgeLandscape: {
				establishedConsensus: ["The Number Theoretic Transform (NTT) accounts for over 60% of Kyber execution cycles and peak memory allocation.", "Memory-bounded Cortex-M4 platforms require hand-crafted ARMv7-E-M assembly utilizing dual-MAC SIMD instructions.", "First-order masking doubles RAM and triples execution cycles, making it inaccessible for sub-$2 microcontrollers."],
				existingApproaches: [
					{
						approachName: "Precomputed Twiddle Factor Lookup Tables",
						representativeParadigm: "Storing full bit-reversed roots in flash/ROM",
						primaryLimitation: "Consumes excessive flash memory and fails when firmware partitions are locked.",
					},
					{
						approachName: "On-the-Fly Dynamic Twiddle Generation",
						representativeParadigm: "Recomputing modular powers in registers",
						primaryLimitation: "Modular reductions introduce data-dependent branch timings or execution jitter unless painstakingly audited.",
					},
					{
						approachName: "Offloaded Cryptographic Co-Processor Architecture",
						representativeParadigm: "Hardware accelerators (RISC-V PQC extensions)",
						primaryLimitation: "Irrelevant for the 50+ billion legacy ARM Cortex-M microcontrollers currently in the field.",
					},
				],
				criticalKnowledgeGap: "Whether inplace polynomial arithmetic can achieve strict constant-time guarantees without exceeding 1.8KB peak stack usage on vanilla Cortex-M4.",
				whyUnsolvedUntilNow: "Prior academic efforts either prioritized raw cycle speed on high-end boards (STM32F4 with 192KB RAM) or theoretical side-channel proofs without real RTOS constraints.",
			},
			candidateDirections: [
				{
					id: "dir-pqc-1",
					title: "Direction A: Register-Budgeted Inplace NTT with Constant-Time Montgomery Reductions",
					directionType: "architectural_intervention",
					summary: "Formulate an assembly architecture that pipelines 4 butterfly operations simultaneously using ARM SIMD registers, keeping intermediate coefficients in registers and eliminating stack spills.",
					whyPursue: "Provides both deterministic timing and low stack footprint without needing specialized cryptographic silicon.",
					tradeoffs: {
						noveltyScore: 8,
						feasibilityScore: 9,
						impactScore: 9,
						riskLevel: "Moderate",
					},
					requiredResources: ["STM32F4 Nucleo board", "Open-source pqm4 framework", "ChipWhisperer-Nano for CPA validation"],
					potentialPitfalls: "Exhausting the 14 available general-purpose registers during Montgomery multiplication.",
					suitabilityForContext: "Superb for an engineering thesis: concrete deliverables, hardware measurements, and immediate industry adoption path.",
					isRecommended: true,
				},
				{
					id: "dir-pqc-2",
					title: "Direction B: Compressed Hybrid Ring-LWE Variant",
					directionType: "theory_grounded",
					summary: "Modify the underlying ring dimension $n$ from 256 to a custom modulus that fits into 16-bit register halves.",
					whyPursue: "Dramatically reduces memory requirements at a fundamental mathematical level.",
					tradeoffs: {
						noveltyScore: 9,
						feasibilityScore: 4,
						impactScore: 4,
						riskLevel: "High",
					},
					requiredResources: ["Supercomputer for lattice reduction analysis", "Cryptanalysis verification team"],
					potentialPitfalls: "Breaks NIST compliance completely; no commercial industry operator will deploy an unstandardized custom ring.",
					suitabilityForContext: "Inadvisable: contradicts real-world adoption constraints and invalidates interoperability.",
					isRecommended: false,
				},
				{
					id: "dir-pqc-3",
					title: "Direction C: Exhaustive Benchmark Comparison of Existing PQC Libraries",
					directionType: "benchmark_evaluation",
					summary: "Profile 6 open-source implementations on 4 Cortex-M variants under FreeRTOS, measuring stack watermarks and cycle counts.",
					whyPursue: "Provides a valuable reference survey for firmware developers.",
					tradeoffs: {
						noveltyScore: 4,
						feasibilityScore: 10,
						impactScore: 6,
						riskLevel: "Low",
					},
					requiredResources: ["Standard development boards and logic analyzer"],
					potentialPitfalls: "Pure measurement paper with zero novel algorithmic contribution; vulnerable to reviewer rejection.",
					suitabilityForContext: "Good companion study, but insufficient standalone contribution for top-tier defense.",
					isRecommended: false,
				},
			],
			selectedDirectionId: "dir-pqc-1",
			selectionRationale: "Direction A provides an original technical contribution while respecting NIST standardization constraints and hardware physical realities.",
			experimentDesign: {
				primaryResearchQuestion: "Can an inplace register-budgeted NTT implementation reduce peak dynamic stack consumption of ML-KEM-512 decapsulation to under 1.8KB on ARM Cortex-M4 while passing NIST constant-time test vectors and Welch’s t-test side-channel leakage detection?",
				falsifiableHypothesis: "Register-budgeted inplace butterfly scheduling will achieve <1,800 bytes peak stack memory without exceeding 1.25x the cycle count of standard pqm4 speed-optimized assembly, with zero t-statistic excursions beyond |t| > 4.5 across 100,000 power traces.",
				independentVariables: ["Implementation Variant: Reference C, pqm4 speed-optimized, and Proposed Inplace Register-Budgeted Assembly", "Compiler Optimization Flag: -O3, -Os (size-optimized)", "Cryptographic Operation: KeyGen, Encapsulation, Decapsulation"],
				dependentVariablesAndMetrics: [
					{
						metric: "Peak Dynamic Stack Watermark (Bytes)",
						targetBenchmark: "< 1,800 bytes (Baseline pqm4 requires ~2,780 bytes)",
						evaluationMethod: "Hardware stack paint technique with 0xAA memory fill and debugger inspection",
					},
					{
						metric: "Welch’s TVLA Side-Channel Leakage Score",
						targetBenchmark: "Max |t| < 4.5 across 100,000 power traces",
						evaluationMethod: "Non-specific Fixed-vs-Random t-test using ChipWhisperer oscilloscope capture",
					},
					{
						metric: "Execution Cycle Count",
						targetBenchmark: "< 650,000 clock cycles for decapsulation at 168MHz",
						evaluationMethod: "ARM DWT cycle counter register hardware profiling",
					},
				],
				baselinesAndControls: [
					{
						name: "pqm4 Speed-Optimized Assembly",
						type: "sota_benchmark",
						rationale: "The reigning benchmark standard in academic embedded PQC literature.",
					},
					{
						name: "Reference C Implementation (PQClean)",
						type: "naive_baseline",
						rationale: "Portable ANSI C baseline showing unoptimized baseline overhead.",
					},
					{
						name: "Deliberately Flawed Leaky Butterfly Routine",
						type: "ablation_control",
						rationale: "Validates that the ChipWhisperer TVLA setup correctly detects known timing and power leaks.",
					},
				],
				datasetAndApparatus: {
					primaryDatasetOrSetup: "NIST PQC Known Answer Test (KAT) vector suite for ML-KEM-512; STM32F401RE MCU (84MHz, 96KB SRAM).",
					sourceAndLicensing: "Public domain NIST PQC test vectors; open-source pqm4 framework.",
					sampleScale: "100,000 random-vs-fixed cryptographic operations captured at 4x oversampling (ChipWhisperer).",
					fallbackIfUnavailable: "Renode or QEMU ARM full-system emulator with instruction-level cache tracing.",
				},
				milestoneTimeline: [
					{
						phase: "Phase 1: Inplace Butterfly Assembly Kernel Development",
						durationWeeks: 4,
						objective: "Write and formally verify 32-bit register scheduling for Montgomery and Barrett multiplication kernels.",
						stopGoCriteria: "Kernel passes 10,000 randomized polynomial multiplication test vectors against GMP reference.",
					},
					{
						phase: "Phase 2: Stack Painting & Integration into pqm4",
						durationWeeks: 4,
						objective: "Embed assembly kernel into full ML-KEM-512 decapsulation pipeline; profile stack watermarks.",
						stopGoCriteria: "Demonstrate stack reduction below 1.8KB. If stack > 2.0KB, refactor buffer sharing.",
					},
					{
						phase: "Phase 3: Side-Channel Leakage Assessment (TVLA)",
						durationWeeks: 5,
						objective: "Connect ChipWhisperer-Nano; record 100k traces under fixed-vs-random inputs; compute Welch t-test.",
						stopGoCriteria: "|t| stays strictly within [-4.5, 4.5]. Any spike prompts microcode inspection for data-dependent register reuse.",
					},
					{
						phase: "Phase 4: Synthesis & Thesis Defense Compilation",
						durationWeeks: 3,
						objective: "Format research brief, package open-source GitHub artifact, prepare hardware live demonstration.",
						stopGoCriteria: "Artifact evaluation checklist completed with automated build and TVLA plotting scripts.",
					},
				],
				validityThreats: [
					{
						threatType: "internal",
						description: "Measurement noise from oscilloscope ground loops can mask subtle high-frequency power leakage.",
						mitigationStrategy: "Use differential SMA probe connection and verify with deliberate leak injection control.",
					},
					{
						threatType: "external",
						description: "Cortex-M4 results may not directly transfer to newer Cortex-M33 with TrustZone or Cortex-M55 with Helium.",
						mitigationStrategy: "Analyze pipeline hazards and document specific architectural assumptions in the brief.",
					},
					{
						threatType: "construct",
						description: "Passing TVLA does not formally prove mathematical immunity to higher-order multivariate machine learning attacks.",
						mitigationStrategy: "Clearly demarcate scope as first-order leakage detection and provide bounds for future masking.",
					},
				],
				negativeResultValue: "If register scheduling cannot achieve both constant-time guarantees and <1.8KB stack simultaneously, it empirically proves that sub-$1 microcontrollers require hardware cryptographic co-processors for post-quantum survival, invalidating software-only transition roadmaps.",
				successDefinition: "Peak stack < 1,800 bytes, execution cycles within 20% of SOTA, and clean TVLA (|t| < 4.5 across 100k traces).",
			},
			advisorCritiques: [
				{
					category: "Rigorous Verification",
					critique: "Hand-written assembly is notoriously prone to subtle edge-case arithmetic bugs under modular overflow.",
					actionableAdjustment: "Employ the Jasmin or Cryptoline formal verification tool to prove equivalence to the mathematical specification.",
				},
			],
			feasibilityAssessment: {
				runwayWeeks: 16,
				budgetVerdict: "Minimal Cost (<$120 hardware lab setup).",
				keyPrerequisite: "Basic familiarity with ARM assembly and oscilloscope probing.",
			},
			bibtexSnippet: `@article{ideally2026pqcedge,
  title={Ephemeral Stack Pressure vs Side-Channel Leakage: Constant-Time Number Theoretic Transform for ML-KEM on 32-bit Microcontrollers},
  author={Ideally Research Collective},
  journal={IEEE Transactions on Information Forensics and Security},
  year={2026}
}`,
		},
		defenseProbes: [
			{
				id: "probe-pq-1",
				persona: "Silicon Security Architect (Hardware Reviewer)",
				probingTopic: "Memory Hierarchy & Register Pressure",
				question: "The ARM Cortex-M4 has only 14 general-purpose registers accessible in Thumb-2 mode. When you interleave 4 butterfly calculations, what happens to compiler register spilling when an RTOS interrupt triggers?",
				exampleAnswers: ["We disable interrupts during the critical 1,200-cycle inner butterfly loop or dedicate caller-saved register pairs (r0-r3, r12).", "We evaluate interrupt latency impact and prove the critical section is shorter than standard SPI sensor buffer overruns."],
			},
			{
				id: "probe-pq-2",
				persona: "NIST Standards Committee Delegate",
				probingTopic: "FIPS 203 Compliance & Parameter Flexibility",
				question: "Does your register optimization lock the implementation strictly into ML-KEM-512, or does it generalize to the more secure ML-KEM-768 and ML-KEM-1024 parameter sets?",
				exampleAnswers: ["Because all ML-KEM parameter sets share the exact same polynomial degree n=256 and prime modulus q=3329, our NTT kernel is 100% parameter-reusable across 512, 768, and 1024.", "Only the outer matrix dimension k changes (k=2 for 512, k=3 for 768, k=4 for 1024), multiplying memory requirements linearly."],
			},
			{
				id: "probe-pq-3",
				persona: "Patent Examiner (USPTO / EPO Intellectual Property)",
				probingTopic: "Non-Obviousness (35 U.S.C. § 103) & Prior Art Combination",
				question: "Claim 1 combines inplace NTT butterfly indexing with Montgomery modular reduction. Both mechanisms exist separately in prior art (US Pat. 8,429,207 and IEEE Micro 2021). Why would a Person Having Ordinary Skill in the Art (PHOSITA) not find this combination obvious to try for embedded post-quantum microcontrollers?",
				exampleAnswers: ["Prior art teaches away from inplace scheduling on 16-bit register halves due to register pressure causing catastrophic spilling. Our invention achieves an unexpected synergy: by interleaving the modular reduction stages directly within the pipeline stalls of the load-multiple instructions, we eliminate both the memory buffer and the cycle penalty simultaneously without increasing side-channel leakage."],
			},
		],
	},
];
