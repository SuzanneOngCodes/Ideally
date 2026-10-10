import React, { useState, useMemo, useEffect, useRef } from "react";
import { Search, ArrowRight, ShieldCheck, FileText, Compass, ChevronRight, FolderOpen, Sparkles, CheckCircle2, X } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { LanguageCode } from "../types/i18n";
import { PRESET_SCENARIOS, PresetScenario } from "../data/presetScenarios";
import { classifyResearchIntent } from "../utils/classifyResearchIntent";

interface SmartSearchLandingProps {
	onRoute: (destination: "workspace" | "brief" | "defense" | "auditor", query: string) => void;
	onSelectPreset: (preset: PresetScenario) => void;
	onNewIntake: () => void;
	onOpenMethodology: () => void;
}

const TYPING_STATEMENTS_BY_LANG: Record<LanguageCode, string[]> = {
	en: ["research thesis", "paper hypothesis", "draft excerpt", "patent invention"],
	ja: ["研究論文の仮説", "未発表の草稿抜粋", "特許・発明アイデア", "学位論文の課題"],
	"zh-CN": ["研究论文课题", "前沿学术假说", "论文草稿段落", "专利发明构想"],
	"zh-TW": ["研究論文課題", "前沿學術假說", "論文草稿段落", "專利發明構想"],
	ko: ["연구 논문 가설", "초안 발췌문", "특허 발명 아이디어", "학위 논문 연구"],
	id: ["hipotesis riset", "draf makalah", "ide invensi paten", "rancangan skripsi"],
	vi: ["ý tưởng nghiên cứu", "giả thuyết khoa học", "trích đoạn bài báo", "sáng chế mới"],
	th: ["สมมติฐานงานวิจัย", "ข้อความร่างงานวิจัย", "แนวคิดสิทธิบัตร", "โครงงานวิทยานิพนธ์"],
};

const SUBTITLE_AFFIXES_BY_LANG: Record<LanguageCode, { prefix: string; suffix: string }> = {
	en: {
		prefix: "Describe any ",
		suffix: "",
	},
	ja: {
		prefix: "",
		suffix: " をご入力ください",
	},
	"zh-CN": {
		prefix: "描述任何 ",
		suffix: "",
	},
	"zh-TW": {
		prefix: "描述任何 ",
		suffix: "",
	},
	ko: {
		prefix: "어떤 ",
		suffix: "이든 설명해 보세요",
	},
	id: {
		prefix: "Jelaskan setiap ",
		suffix: "",
	},
	vi: {
		prefix: "Mô tả bất kỳ ",
		suffix: "",
	},
	th: {
		prefix: "อธิบาย ",
		suffix: "",
	},
};

export const SmartSearchLanding: React.FC<SmartSearchLandingProps> = ({ onRoute, onSelectPreset, onNewIntake, onOpenMethodology }) => {
	const { currentLanguage } = useLanguage();
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const [query, setQuery] = useState("");
	const [manualOverride, setManualOverride] = useState<"workspace" | "brief" | "defense" | "auditor" | null>(null);

	const subtitleAffix = SUBTITLE_AFFIXES_BY_LANG[currentLanguage] || SUBTITLE_AFFIXES_BY_LANG.en;

	// Dynamic statements for typing effect:
	// "research thesis", "paper hypothesis", "draft excerpt", "patent invention"
	const statementList = useMemo(() => {
		return TYPING_STATEMENTS_BY_LANG[currentLanguage] || TYPING_STATEMENTS_BY_LANG.en;
	}, [currentLanguage]);

	const [statementIndex, setStatementIndex] = useState(0);
	const [typedStatement, setTypedStatement] = useState("");
	const [isDeletingStatement, setIsDeletingStatement] = useState(false);

	// Reset typewriter seamlessly whenever language is switched
	useEffect(() => {
		setStatementIndex(0);
		setTypedStatement("");
		setIsDeletingStatement(false);
	}, [currentLanguage]);

	useEffect(() => {
		const currentFullStatement = statementList[statementIndex % statementList.length] || statementList[0];
		let timer: NodeJS.Timeout;

		if (!isDeletingStatement && typedStatement.length < currentFullStatement.length) {
			// Type forward with natural cadence
			timer = setTimeout(() => {
				setTypedStatement(currentFullStatement.slice(0, typedStatement.length + 1));
			}, 95);
		} else if (!isDeletingStatement && typedStatement.length === currentFullStatement.length) {
			// Pause at full statement for 2.4 seconds
			timer = setTimeout(() => {
				setIsDeletingStatement(true);
			}, 2400);
		} else if (isDeletingStatement && typedStatement.length > 0) {
			// Delete backward smoothly
			timer = setTimeout(() => {
				setTypedStatement(currentFullStatement.slice(0, typedStatement.length - 1));
			}, 45);
		} else if (isDeletingStatement && typedStatement.length === 0) {
			// Pause briefly then move to next statement
			timer = setTimeout(() => {
				setIsDeletingStatement(false);
				setStatementIndex((prev) => (prev + 1) % statementList.length);
			}, 350);
		}

		return () => clearTimeout(timer);
	}, [typedStatement, isDeletingStatement, statementIndex, statementList]);

	// Dynamic intent classification with language awareness
	const autoIntent = useMemo(() => classifyResearchIntent(query, currentLanguage), [query, currentLanguage]);
	const activeDestination = manualOverride || autoIntent.targetTab;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onRoute(activeDestination, query.trim());
	};

	const handleSelectExample = (sampleText: string, forcedTab: "workspace" | "brief" | "defense" | "auditor") => {
		setQuery(sampleText);
		setManualOverride(forcedTab);
	};

	// Localized UI strings for the search landing page
	const localizedContent: Record<
		LanguageCode,
		{
			badge: string;
			placeholder: string;
			launchPrefix: string;
			destLabel: string;
			pressEnter: string;
			chooseLab: string;
			resetAuto: string;
			examplesHeader: string;
			examplesSub: string;
			presetsHeader: string;
			presetsSub: string;
			createCustom: string;
			openInWorkspace: string;
			multilingualNotice: string;
			destinations: {
				workspace: { label: string; tagline: string; description: string };
				brief: { label: string; tagline: string; description: string };
				defense: { label: string; tagline: string; description: string };
				auditor: { label: string; tagline: string; description: string };
			};
			prompts: Array<{
				title: string;
				dest: "workspace" | "brief" | "defense" | "auditor";
				query: string;
				targetName: string;
				actionLabel: string;
			}>;
		}
	> = {
		en: {
			badge: "AI Research Advisor & Patent Ideation Lab",
			placeholder: "What are you working on?",
			launchPrefix: "Launch",
			destLabel: "Destination:",
			pressEnter: "Press Enter ↵ to go",
			chooseLab: "Or Choose a Dedicated Laboratory:",
			resetAuto: "Reset to Auto-Detect",
			examplesHeader: "Example Research Queries & Intent Prompts",
			examplesSub: "Tap any example below to see how Ideally categorizes and routes your inquiry:",
			presetsHeader: "Authentic Pre-loaded Research Case Studies",
			presetsSub: "Jump straight into complete reasoning chains, verified literature, and pre-formulated defense probes:",
			createCustom: "+ Create Custom Intake",
			openInWorkspace: "Open in Workspace",
			multilingualNotice: "Search and formulate in English or any of the 7 supported APAC languages.",
			destinations: {
				workspace: {
					label: "Workspace",
					tagline: "Interactive Advisor",
					description: "Socratic chat & live 5-card reasoning chain",
				},
				brief: {
					label: "Proposal Brief",
					tagline: "5-Stage Scientific Plan",
					description: "Validation, literature gap, metrics & BibTeX",
				},
				defense: {
					label: "Defense Lab",
					tagline: "Reviewer #2 & Patent Examiner",
					description: "Adversarial grilling & § 103 obviousness challenge",
				},
				auditor: {
					label: "Citation Auditor",
					tagline: "Integrity Scanner",
					description: "Detects phantom citations, DOI errors & AI slop",
				},
			},
			prompts: [
				{
					title: "Patent Claim Non-Obviousness (§ 103)",
					dest: "defense",
					query: "Test my patent idea: Can an examiner reject our embedded NTT cryptographic accelerator under 35 U.S.C. 103 as an obvious combination of prior art?",
					targetName: "Patent Examiner Lab",
					actionLabel: "Test patent claim vs examiner",
				},
				{
					title: "Reviewer #2 Stress Test",
					dest: "defense",
					query: "Stress-test our non-autoregressive encoder hypothesis against Reviewer #2 confounding critiques",
					targetName: "Defense Lab",
					actionLabel: "Stress-test hypothesis",
				},
				{
					title: "Audit Text & Prior-Art Citations",
					dest: "auditor",
					query: "Audit Vaswani et al. (2017) and Smith et al. (2024) to detect phantom citations and AI slop",
					targetName: "Citation Auditor",
					actionLabel: "Scan for hallucinations",
				},
				{
					title: "Synthesize Proposal Brief",
					dest: "brief",
					query: "Generate a structured research proposal brief with falsifiable hypothesis on post-quantum lattice cryptography",
					targetName: "Proposal Brief",
					actionLabel: "Generate scientific brief",
				},
			],
		},
		ja: {
			badge: "AI学術研究アドバイザー & 知財・特許アイデア検証ラボ",
			placeholder: "どのような研究や特許アイデアに取り組んでいますか？",
			launchPrefix: "開始する:",
			destLabel: "案内先ラボ:",
			pressEnter: "Enter ↵ で確定",
			chooseLab: "または専用ラボを直接選択:",
			resetAuto: "自動判定に戻す",
			examplesHeader: "研究クエリと意図判定の入力例",
			examplesSub: "以下の例をタップすると、Ideallyが意図を判定して最適なラボへ接続します:",
			presetsHeader: "事前検証済みの学術研究ケーススタディ",
			presetsSub: "完全な論理展開チェーン、査読済み文献、および審査官ディフェンスをすぐにご覧いただけます:",
			createCustom: "+ 新規インテーク作成",
			openInWorkspace: "ワークスペースで開く",
			multilingualNotice: "日本語をはじめ、APAC 8言語での母国語入力と意図ルーティングに対応しています。",
			destinations: {
				workspace: {
					label: "対話型ワークスペース",
					tagline: "学術アドバイザー対話",
					description: "ソクラテス式対話と5段階の論理展開カード",
				},
				brief: {
					label: "研究計画・提案書",
					tagline: "5段階の学術提案書",
					description: "問題定義、先行研究ギャップ、評価指標、BibTeX出力",
				},
				defense: {
					label: "審査官・口頭試問防衛",
					tagline: "査読者2 & 特許審査官",
					description: "交絡因子、進歩性（非自明性）、対抗反論のストレステスト",
				},
				auditor: {
					label: "引用文献・整合性監査",
					tagline: "ハルシネーション検出",
					description: "架空引用、DOI実在性、AIスロップ（無根拠文）を監査",
				},
			},
			prompts: [
				{
					title: "特許の進歩性と非自明性の検証（35 U.S.C. § 103）",
					dest: "defense",
					query: "特許アイデアの検証: 組込みNTT暗号アクセラレータは先行技術の自明な組み合わせとして審査官に拒絶されるか？",
					targetName: "特許審査官防衛ラボ",
					actionLabel: "審査官の進歩性拒絶に対抗",
				},
				{
					title: "査読者（Reviewer #2）の反論ストレステスト",
					dest: "defense",
					query: "非自己回帰型エンコーダの推論速度向上仮説を査読者#2の交絡バイアス批判に対してストレステストする",
					targetName: "口頭試問防衛ラボ",
					actionLabel: "仮説の脆弱性を検証",
				},
				{
					title: "引用文献と先行技術の監査",
					dest: "auditor",
					query: "Vaswani et al. (2017) および架空の引用文献をスキャンしてハルシネーションを検出・監査する",
					targetName: "引用監査ラボ",
					actionLabel: "架空文献・AIスロップを検出",
				},
				{
					title: "耐量子格子暗号の研究計画書を生成",
					dest: "brief",
					query: "耐量子格子暗号ML-KEMのマイコン実装に関する反証可能な仮説付き5段階研究計画書を作成する",
					targetName: "研究計画書ビュー",
					actionLabel: "学術計画書・BibTeXを生成",
				},
			],
		},
		"zh-CN": {
			badge: "AI学术研究导师 & 专利发明构想验证室",
			placeholder: "您正在开展什么研究或专利构想？",
			launchPrefix: "进入:",
			destLabel: "目标实验室:",
			pressEnter: "按 Enter ↵ 前往",
			chooseLab: "或直接选择专属实验室:",
			resetAuto: "恢复自动识别",
			examplesHeader: "研究查询与意图调度示例",
			examplesSub: "点击以下示例，查看系统如何智能分类并调度至对应实验室:",
			presetsHeader: "真实严谨的预置科研案例库",
			presetsSub: "即刻体验完整的五步推理链条、同行评议文献及答辩对抗实战:",
			createCustom: "+ 创建新研究立项",
			openInWorkspace: "在工作区打开",
			multilingualNotice: "全面支持中文及亚太8种语言的原生自然语言查询与意图路由。",
			destinations: {
				workspace: {
					label: "交互式工作区",
					tagline: "导师苏格拉底对话",
					description: "五卡片动态推理链、文献支持与理论对比",
				},
				brief: {
					label: "研究提案简报",
					tagline: "五阶段结构化规划",
					description: "研究背景、文献缺口、技术路线与BibTeX导出",
				},
				defense: {
					label: "评审答辩实验室",
					tagline: "二审专家 & 专利审查员",
					description: "挑战交络变量、基线公平性与专利创造性",
				},
				auditor: {
					label: "文献引文审计",
					tagline: "反学术幻觉扫描器",
					description: "识别虚假引文、虚构DOI与AI套话灌水",
				},
			},
			prompts: [
				{
					title: "专利创造性与非显而易见性抗辩 (§ 103)",
					dest: "defense",
					query: "测试专利想法：审查员是否会以现有先验技术的显而易见组合为由，驳回我们的嵌入式NTT加速器权利要求？",
					targetName: "专利审查答辩室",
					actionLabel: "模拟专利审查员驳回",
				},
				{
					title: "审稿人二审严苛答辩测试",
					dest: "defense",
					query: "对非自回归编码器分类假设进行压力测试，反驳审稿人关于批处理吞吐量的质疑",
					targetName: "评审答辩实验室",
					actionLabel: "压力测试假说严密性",
				},
				{
					title: "审核论文引文与学术灌水",
					dest: "auditor",
					query: "审计论文草稿中的Vaswani et al. (2017)及引文，排查虚假幻觉文献和学术虚构",
					targetName: "文献引文审计",
					actionLabel: "扫描引文真实性",
				},
				{
					title: "生成后量子密码学开题报告",
					dest: "brief",
					query: "生成一份针对微控制器后量子格密码优化的结构化研究提案，包含可证伪假说",
					targetName: "研究提案简报",
					actionLabel: "生成五阶段规范方案",
				},
			],
		},
		"zh-TW": {
			badge: "AI學術研究導師 & 專利發明構想驗證室",
			placeholder: "您正在進行什麼研究或專利構想？",
			launchPrefix: "進入:",
			destLabel: "目標實驗室:",
			pressEnter: "按 Enter ↵ 前往",
			chooseLab: "或直接選擇專屬實驗室:",
			resetAuto: "恢復自動識別",
			examplesHeader: "研究查詢與意圖調度範例",
			examplesSub: "點擊以下範例，查看系統如何智能分類並調度至對應實驗室:",
			presetsHeader: "真實嚴謹的預置科研案例庫",
			presetsSub: "即刻體驗完整的五步推理鏈條、同行評議文獻及答辯對抗實戰:",
			createCustom: "+ 建立新研究立項",
			openInWorkspace: "在工作區打開",
			multilingualNotice: "全面支援繁體中文及亞太8種語言的原生自然語言查詢與意圖路由。",
			destinations: {
				workspace: {
					label: "互動式工作區",
					tagline: "導師蘇格拉底對話",
					description: "五卡片動態推理鏈、文獻支持與理論對比",
				},
				brief: {
					label: "研究提案簡報",
					tagline: "五階段結構化規劃",
					description: "研究背景、文獻缺口、技術路線與BibTeX匯出",
				},
				defense: {
					label: "評審答辯實驗室",
					tagline: "二審專家 & 專利審查員",
					description: "挑戰交絡變數、基準公平性與專利進步性",
				},
				auditor: {
					label: "文獻引文審計",
					tagline: "反學術幻覺掃描器",
					description: "識別虛假引文、虛構DOI與AI套話灌水",
				},
			},
			prompts: [
				{
					title: "專利進步性與非顯而易見性抗辯 (§ 103)",
					dest: "defense",
					query: "測試專利想法：審查員是否會以現有先前技術的顯而易見組合為由，駁回我們的嵌入式NTT加速器權利要求？",
					targetName: "專利審查答辯室",
					actionLabel: "模擬專利審查員駁回",
				},
				{
					title: "審稿人二審嚴苛答辯測試",
					dest: "defense",
					query: "對非自回歸編碼器分類假設進行壓力測試，反駁審稿人關於批次吞吐量的質疑",
					targetName: "評審答辯實驗室",
					actionLabel: "壓力測試假說嚴密性",
				},
				{
					title: "審核論文引文與學術灌水",
					dest: "auditor",
					query: "審計論文草稿中的Vaswani et al. (2017)及引文，排查虛假幻覺文獻和學術虛構",
					targetName: "文獻引文審計",
					actionLabel: "掃描引文真實性",
				},
				{
					title: "生成後量子密碼學開題報告",
					dest: "brief",
					query: "生成一份針對微控制器後量子格密碼優化的結構化研究提案，包含可證偽假說",
					targetName: "研究提案簡報",
					actionLabel: "生成五階段規範方案",
				},
			],
		},
		ko: {
			badge: "AI 학술 연구 자문 & 특허 아이디어 검증 랩",
			placeholder: "어떤 연구 또는 특허 아이디어를 검증하고 싶으신가요? ",
			launchPrefix: "시작:",
			destLabel: "이동 연구실:",
			pressEnter: "Enter ↵ 로 실행",
			chooseLab: "또는 원하는 연구실을 직접 선택:",
			resetAuto: "자동 감지로 리셋",
			examplesHeader: "연구 질의 및 의도 감지 예시",
			examplesSub: "아래 예시를 클릭하여 질의가 어떻게 분류되고 안내되는지 확인해 보세요:",
			presetsHeader: "사전 검증된 학술 연구 케이스 스터디",
			presetsSub: "완성된 5단계 추론 체인, 검증된 학술 문헌 및 심사위원 디펜스를 바로 확인하세요:",
			createCustom: "+ 새 연구 인테이크 작성",
			openInWorkspace: "워크스페이스에서 열기",
			multilingualNotice: "한국어를 비롯한 8개 글로벌 및 APAC 언어 자연어 질의를 지원합니다.",
			destinations: {
				workspace: {
					label: "인터랙티브 워크스페이스",
					tagline: "소크라테스식 연구 자문",
					description: "5단계 추론 체인 카드와 실시간 학술 근거 대조",
				},
				brief: {
					label: "연구 제안서 브리프",
					tagline: "5단계 과학적 연구 계획서",
					description: "문제 정의, 문헌 공백, 평가 지표 및 BibTeX 내보내기",
				},
				defense: {
					label: "디펜스 랩 (심사관 대응)",
					tagline: "리뷰어 #2 & 특허심사관",
					description: "교란 변수 반론, 특허 비자명성(진보성) 스트레스 테스트",
				},
				auditor: {
					label: "인용 문헌 감사기",
					tagline: "학술 환각 스캐너",
					description: "유령 인용문, 가짜 DOI, AI 슬롭(무근거 문장) 감사",
				},
			},
			prompts: [
				{
					title: "특허 청구항 진보성 및 비자명성 검증 (§ 103)",
					dest: "defense",
					query: "특허 아이디어 검증: 심사관이 우리의 임베디드 NTT 가속기 청구항을 선행기술의 자명한 결합으로 거절할 수 있는가?",
					targetName: "특허심사관 디펜스 랩",
					actionLabel: "특허 거절이유 대응 테스트",
				},
				{
					title: "리뷰어 #2 학술 심사 스트레스 테스트",
					dest: "defense",
					query: "비자귀 인코더 가설을 리뷰어 #2의 교란 변수 및 배치 지연 비판에 대해 스트레스 테스트",
					targetName: "디펜스 랩",
					actionLabel: "가설 취약점 방어",
				},
				{
					title: "인용 문헌 및 선행기술 허위 환각 감사",
					dest: "auditor",
					query: "Vaswani et al. (2017) 및 허위 인용 문헌을 감사하여 환각과 AI 슬롭을 탐지",
					targetName: "인용 문헌 감사기",
					actionLabel: "허위 인용 탐지",
				},
				{
					title: "양자내성암호 연구 제안서 브리프 생성",
					dest: "brief",
					query: "마이크로컨트롤러 환경의 양자내성 격자암호 최적화에 대한 반증 가능한 가설 포함 제안서 생성",
					targetName: "연구 제안서 브리프",
					actionLabel: "학술 계획서 생성",
				},
			],
		},
		id: {
			badge: "Penasihat Riset AI & Lab Validasi Ide Paten",
			placeholder: "Apa topik riset atau ide paten anda? ",
			launchPrefix: "Buka:",
			destLabel: "Tujuan Lab:",
			pressEnter: "Tekan Enter ↵ untuk membuka",
			chooseLab: "Atau Pilih Laboratorium Khusus:",
			resetAuto: "Reset ke Deteksi Otomatis",
			examplesHeader: "Contoh Kueri Riset & Perutean Niat",
			examplesSub: "Ketuk contoh di bawah untuk melihat bagaimana sistem mengkategorikan penyelidikan Anda:",
			presetsHeader: "Studi Kasus Penelitian Terverifikasi",
			presetsSub: "Jelajahi rantai penalaran lengkap, literatur terverifikasi, dan simulasi penguji:",
			createCustom: "+ Buat Proposal Baru",
			openInWorkspace: "Buka di Ruang Kerja",
			multilingualNotice: "Mendukung kueri dalam Bahasa Indonesia dan 7 bahasa APAC lainnya.",
			destinations: {
				workspace: {
					label: "Ruang Kerja",
					tagline: "Penasihat Interaktif",
					description: "Diskusi Sokrates dan rantai penalaran 5 kartu",
				},
				brief: {
					label: "Proposal Ilmiah",
					tagline: "Rencana Penelitian 5 Tahap",
					description: "Validasi masalah, kesenjangan literatur & ekspor BibTeX",
				},
				defense: {
					label: "Lab Ujian Pertahanan",
					tagline: "Reviewer #2 & Pemeriksa Paten",
					description: "Uji ketahanan hipotesis dan bantahan kebaruan paten",
				},
				auditor: {
					label: "Auditor Sitasi",
					tagline: "Pemindai Integritas",
					description: "Deteksi sitasi palsu, kesalahan DOI & teks generatif",
				},
			},
			prompts: [
				{
					title: "Uji Kebaruan & Non-Obviousness Paten (§ 103)",
					dest: "defense",
					query: "Uji ide paten: Apakah pemeriksa dapat menolak akselerator kriptografi NTT kami sebagai kombinasi jelas dari teknologi sebelumnya?",
					targetName: "Lab Pemeriksa Paten",
					actionLabel: "Uji bantahan klaim paten",
				},
				{
					title: "Uji Ketahanan Reviewer #2",
					dest: "defense",
					query: "Uji hipotesis encoder non-autoregresif kami terhadap kritik variabel pengganggu Reviewer #2",
					targetName: "Lab Ujian Pertahanan",
					actionLabel: "Uji ketahanan hipotesis",
				},
				{
					title: "Audit Sitasi & Referensi Fiktif",
					dest: "auditor",
					query: "Audit Vaswani et al. (2017) untuk mendeteksi sitasi palsu dan halusinasi AI",
					targetName: "Auditor Sitasi",
					actionLabel: "Pindai integritas sitasi",
				},
				{
					title: "Sintesis Proposal Riset Kriptografi",
					dest: "brief",
					query: "Buat proposal riset terstruktur dengan hipotesis yang dapat diuji pada kriptografi pasca-kuantum",
					targetName: "Proposal Ilmiah",
					actionLabel: "Buat proposal ilmiah",
				},
			],
		},
		vi: {
			badge: "Cố Vấn Nghiên Cứu AI & Phòng Thử Nghiệm Bằng Sáng Chế",
			placeholder: "Bạn đang nghiên cứu hoặc kiểm tra ý tưởng sáng chế nào? ",
			launchPrefix: "Bắt đầu:",
			destLabel: "Phòng thí nghiệm:",
			pressEnter: "Nhấn Enter ↵ để chuyển tiếp",
			chooseLab: "Hoặc chọn trực tiếp phòng nghiên cứu:",
			resetAuto: "Đặt lại tự động nhận diện",
			examplesHeader: "Ví Dụ Truy Vấn Nghiên Cứu",
			examplesSub: "Nhấn vào ví dụ dưới đây để xem cách hệ thống phân loại ý định nghiên cứu:",
			presetsHeader: "Nghiên Cứu Điển Hình Có Sẵn",
			presetsSub: "Truy cập ngay chuỗi lập luận khoa học, tài liệu bình duyệt và phòng phản biện:",
			createCustom: "+ Tạo Đề Cương Mới",
			openInWorkspace: "Mở trong Không Gian",
			multilingualNotice: "Hỗ trợ truy vấn bằng Tiếng Việt và 7 ngôn ngữ quốc tế / APAC.",
			destinations: {
				workspace: {
					label: "Không Gian Nghiên Cứu",
					tagline: "Cố Vấn Tương Tác",
					description: "Hội thoại Socrates và chuỗi 5 thẻ lập luận logic",
				},
				brief: {
					label: "Đề Cương Nghiên Cứu",
					tagline: "Kế Hoạch Khoa Học 5 Giai Đoạn",
					description: "Xác thực vấn đề, khoảng trống học thuật & xuất BibTeX",
				},
				defense: {
					label: "Phòng Phản Biện",
					tagline: "Phản Biện 2 & Thẩm Định Viên",
					description: "Thử nghiệm tính vững chắc và giải trình bước sáng tạo",
				},
				auditor: {
					label: "Kiểm Định Trích Dẫn",
					tagline: "Máy Quét Đạo Văn & Ảo Giác",
					description: "Phát hiện trích dẫn ảo, lỗi DOI và văn phong AI rỗng",
				},
			},
			prompts: [
				{
					title: "Đánh Giá Bước Sáng Tạo Của Bằng Sáng Chế (§ 103)",
					dest: "defense",
					query: "Kiểm tra ý tưởng sáng chế: Thẩm định viên có thể bác bỏ bộ tăng tốc NTT nhúng vì tính hiển nhiên không?",
					targetName: "Phòng Thẩm Định Sáng Chế",
					actionLabel: "Thử nghiệm giải trình sáng chế",
				},
				{
					title: "Phản Biện Áp Lực Với Reviewer #2",
					dest: "defense",
					query: "Kiểm tra giả thuyết encoder không tự hồi quy trước những chỉ trích về biến gây nhiễu",
					targetName: "Phòng Phản Biện",
					actionLabel: "Thử nghiệm giả thuyết",
				},
				{
					title: "Kiểm Định Trích Dẫn & Văn Phong AI",
					dest: "auditor",
					query: "Kiểm tra Vaswani et al. (2017) để phát hiện trích dẫn ảo và văn phong AI",
					targetName: "Kiểm Định Trích Dẫn",
					actionLabel: "Quét trích dẫn rác",
				},
				{
					title: "Tổng Hợp Đề Cương Mật Mã Hậu Lượng Tử",
					dest: "brief",
					query: "Tạo đề cương nghiên cứu khoa học có cấu trúc về tối ưu hóa mật mã mạng tinh thể",
					targetName: "Đề Cương Nghiên Cứu",
					actionLabel: "Tạo đề cương khoa học",
				},
			],
		},
		th: {
			badge: "ที่ปรึกษางานวิจัย AI & ห้องทดสอบแนวคิดสิทธิบัตร",
			placeholder: "คุณกำลังทำวิจัยหรือทดสอบแนวคิดสิทธิบัตรเรื่องใด? ",
			launchPrefix: "เปิดห้องแล็บ:",
			destLabel: "ปลายทางแล็บ:",
			pressEnter: "กด Enter ↵ เพื่อไปต่อ",
			chooseLab: "หรือเลือกห้องแล็บเฉพาะทาง:",
			resetAuto: "รีเซ็ตเป็นการตรวจจับอัตโนมัติ",
			examplesHeader: "ตัวอย่างข้อความค้นคว้าวิจัย",
			examplesSub: "แตะตัวอย่างด้านล่างเพื่อดูการจำแนกเจตนาและนำทางไปยังห้องวิจัย:",
			presetsHeader: "กรณีศึกษาการวิจัยจริงที่เตรียมไว้ล่วงหน้า",
			presetsSub: "เข้าถึงห่วงโซ่เหตุผล เอกสารอ้างอิง และการจำลองการซักค้านของกรรมการได้ทันที:",
			createCustom: "+ สร้างหัวข้อวิจัยใหม่",
			openInWorkspace: "เปิดในพื้นที่ทำงาน",
			multilingualNotice: "รองรับการค้นคว้าและส่งคำถามเป็นภาษาไทยและอีก 7 ภาษาในภูมิภาค APAC",
			destinations: {
				workspace: {
					label: "พื้นที่ทำงาน",
					tagline: "ที่ปรึกษาเชิงโต้ตอบ",
					description: "การสนทนาแบบโสเครตีสและการให้เหตุผล 5 ขั้นตอน",
				},
				brief: {
					label: "โครงร่างข้อเสนอ",
					tagline: "แผนวิทยาศาสตร์ 5 ขั้น",
					description: "การตรวจสอบปัญหา ช่องว่างวรรณกรรม และการส่งออก BibTeX",
				},
				defense: {
					label: "แล็บแก้ต่างวิทยานิพนธ์",
					tagline: "ผู้ประเมินคนที่ 2 & ผู้ตรวจสอบสิทธิบัตร",
					description: "ทดสอบความทนทานต่อข้อโต้แย้งและขั้นการประดิษฐ์สิทธิบัตร",
				},
				auditor: {
					label: "ผู้ตรวจสอบการอ้างอิง",
					tagline: "สแกนความถูกต้องของเอกสาร",
					description: "ตรวจจับการอ้างอิงหลอน ข้อผิดพลาด DOI และข้อความที่ไม่มีหลักฐาน",
				},
			},
			prompts: [
				{
					title: "ทดสอบขั้นการประดิษฐ์ที่สูงขึ้นของสิทธิบัตร (§ 103)",
					dest: "defense",
					query: "ทดสอบแนวคิดสิทธิบัตร: ผู้ตรวจสอบสามารถปฏิเสธตัวเร่งความเร็วการเข้ารหัส NTT ฝังตัวว่าเป็นสิ่งประดิษฐ์ที่ชัดเจนได้หรือไม่?",
					targetName: "แล็บผู้ตรวจสอบสิทธิบัตร",
					actionLabel: "ทดสอบข้อต่อสู้สิทธิบัตร",
				},
				{
					title: "ทดสอบความทนทานกับผู้ประเมินคนที่ 2",
					dest: "defense",
					query: "ทดสอบสมมติฐานโมเดลเข้ารหัสที่ไม่ใช่แบบถดถอยอัตโนมัติต่อข้อโต้แย้งตัวแปรสับสนของผู้ประเมิน",
					targetName: "แล็บแก้ต่าง",
					actionLabel: "ทดสอบความทนทานของสมมติฐาน",
				},
				{
					title: "ตรวจสอบการอ้างอิงหลอนและข้อความลอยๆ",
					dest: "auditor",
					query: "ตรวจสอบการอ้างอิงเอกสาร Vaswani et al. (2017) เพื่อตรวจหาการอ้างอิงหลอนของ AI",
					targetName: "ผู้ตรวจสอบการอ้างอิง",
					actionLabel: "สแกนหาการอ้างอิงหลอน",
				},
				{
					title: "สังเคราะห์ข้อเสนอโครงการวิจัยวิทยาการรหัสลับ",
					dest: "brief",
					query: "สร้างข้อเสนอการวิจัยที่มีโครงสร้างพร้อมสมมติฐานที่พิสูจน์ได้ว่าเท็จสำหรับวิทยาการรหัสลับหลังควอนตัม",
					targetName: "โครงร่างข้อเสนอ",
					actionLabel: "สร้างโครงร่างทางวิชาการ",
				},
			],
		},
	};

	const content = localizedContent[currentLanguage] || localizedContent.en;

	const destinations = [
		{
			id: "workspace" as const,
			label: content.destinations.workspace.label,
			icon: Compass,
			tagline: content.destinations.workspace.tagline,
			description: content.destinations.workspace.description,
			borderActive: "border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-2 ring-indigo-600/10",
		},
		{
			id: "brief" as const,
			label: content.destinations.brief.label,
			icon: FileText,
			tagline: content.destinations.brief.tagline,
			description: content.destinations.brief.description,
			borderActive: "border-emerald-600 bg-emerald-50/70 text-emerald-950 ring-2 ring-emerald-600/10",
		},
		{
			id: "defense" as const,
			label: content.destinations.defense.label,
			icon: ShieldCheck,
			tagline: content.destinations.defense.tagline,
			description: content.destinations.defense.description,
			borderActive: "border-amber-600 bg-amber-50/70 text-amber-950 ring-2 ring-amber-600/10",
		},
		{
			id: "auditor" as const,
			label: content.destinations.auditor.label,
			icon: Search,
			tagline: content.destinations.auditor.tagline,
			description: content.destinations.auditor.description,
			borderActive: "border-rose-600 bg-rose-50/70 text-rose-950 ring-2 ring-rose-600/10",
		},
	];

	const currentDestinationInfo = destinations.find((d) => d.id === activeDestination);

	return (
		<div className='w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16 flex flex-col items-center'>
			{/* Hero Header: Spacious, Clear, Scholarly */}
			<header className='text-center max-w-3xl mb-8 sm:mb-12 space-y-4'>
				<div className='inline-flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-widest px-3 py-1 bg-slate-100 rounded-full'>
					<span>{content.badge}</span>
				</div>

				<h1 className='text-3xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight font-serif-scholarly leading-tight'>Ideally</h1>

				<p className='text-base sm:text-lg md:text-xl text-slate-600 leading-relaxed font-sans max-w-2xl mx-auto min-h-[1.75em] text-center'>
					<span className='whitespace-pre'>{subtitleAffix.prefix}</span>
					<span className='font-semibold text-slate-900 inline-flex items-center'>
						<span>{typedStatement}</span>
						<span className='inline-block w-[2px] h-[0.9em] ml-0.5 bg-indigo-600 animate-pulse align-middle' aria-hidden='true' />
					</span>
					<span className='whitespace-pre'>{subtitleAffix.suffix}</span>
				</p>
			</header>

			{/* Main Search Input Section */}
			<section className='w-full max-w-3xl mb-8 sm:mb-12'>
				<form onSubmit={handleSubmit} className='w-full'>
					{/* Main Search Box */}
					<div className='bg-white rounded-2xl sm:rounded-3xl border-2 border-slate-300 hover:border-slate-400 focus-within:border-slate-900 focus-within:ring-4 focus-within:ring-slate-900/10 transition-all shadow-md sm:shadow-lg overflow-hidden'>
						{/* Input Row */}
						<div className='flex flex-col sm:flex-row items-stretch sm:items-center p-2.5 sm:p-3.5 gap-3'>
							<div className='flex items-start flex-1 px-2 gap-3 min-h-[48px] py-1.5'>
								{/* Aligned search icon to the top-start so it stays aligned when container grows */}
								<Search className='w-5 h-5 sm:w-6 sm:h-6 text-slate-400 shrink-0 mt-1' />

								<textarea
									rows={1}
									value={query}
									onChange={(e) => {
										setQuery(e.target.value);
										setManualOverride(null);

										// Dynamic auto-resize logic
										e.target.style.height = "auto";
										e.target.style.height = `${e.target.scrollHeight}px`;
									}}
									ref={(el) => {
										textareaRef.current = el;
										// Hook to trigger initial height check for the long placeholder on mount
										if (el && !query) {
											el.style.height = "auto";
											el.style.height = `${el.scrollHeight}px`;
										}
									}}
									placeholder={content.placeholder}
									className='w-full text-slate-900 text-base sm:text-lg placeholder:text-slate-400 bg-transparent focus:outline-none resize-none min-h-[28px] max-h-[200px] overflow-y-auto py-0.5 line-height-normal'
									autoFocus
									onKeyDown={(e) => {
										// Submits the form on Enter, but allows new lines with Shift + Enter
										if (e.key === "Enter" && !e.shiftKey) {
											e.preventDefault();
											e.currentTarget.form?.requestSubmit();
										}
									}}
								/>

								{query.trim() && (
									<button
										type='button'
										onClick={(e) => {
											setQuery("");
											setManualOverride(null);
											// Find the textarea to reset its height back to default
											if (textareaRef.current) {
												textareaRef.current.style.height = "auto";
											}
										}}
										className='p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer shrink-0 mt-0.5'
										aria-label='Clear query'>
										<X className='w-4 h-4' />
									</button>
								)}
							</div>

							{/* Action Button */}
							<button type='submit' className='w-full sm:w-auto px-6 py-3.5 sm:py-3 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white rounded-xl sm:rounded-2xl text-sm sm:text-base font-semibold transition-all flex items-center justify-center gap-2 shrink-0 shadow-sm cursor-pointer min-h-[44px] self-end sm:self-center'>
								<span>
									{content.launchPrefix} {currentDestinationInfo?.label || "Advisor"}
								</span>
								<ArrowRight className='w-4 h-4' />
							</button>
						</div>

						{/* Smart Route Status Banner */}
						<div className='px-4 sm:px-5 py-3 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm'>
							<div className='flex items-center gap-2'>
								<span className='text-slate-500 font-medium'>{content.destLabel}</span>
								<span className='font-bold text-slate-900 flex items-center gap-1.5'>{currentDestinationInfo?.label}</span>
								<span className='text-slate-400 hidden md:inline'>·</span>
								<span className='text-slate-500 hidden md:inline text-xs'>{manualOverride ? "Manual selection" : autoIntent.reason}</span>
							</div>

							<div className='text-[11px] sm:text-xs text-slate-400 flex items-center gap-1'>
								<span>{content.pressEnter}</span>
							</div>
						</div>
					</div>
				</form>

				{/* Destination Overrides */}
				<div className='mt-6'>
					<div className='flex items-center justify-between mb-3 px-1'>
						<span className='text-xs font-bold uppercase tracking-wider text-slate-500'>{content.chooseLab}</span>
						{manualOverride && (
							<button onClick={() => setManualOverride(null)} className='text-xs text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer'>
								{content.resetAuto}
							</button>
						)}
					</div>

					<div className='grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4'>
						{destinations.map((dest) => {
							const Icon = dest.icon;
							const isSelected = activeDestination === dest.id;
							return (
								<button
									key={dest.id}
									type='button'
									onClick={() => {
										setManualOverride(dest.id);
										onRoute(dest.id, query.trim());
									}}
									className={`text-left p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all flex flex-col justify-between cursor-pointer min-h-[96px] sm:min-h-[110px] ${isSelected ? dest.borderActive : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 shadow-2xs"}`}>
									<div className='flex items-start justify-between w-full mb-2'>
										<div className={`p-2 rounded-lg ${isSelected ? "bg-white text-slate-900 shadow-2xs" : "bg-slate-100 text-slate-700"}`}>
											<Icon className='w-4 h-4 sm:w-5 sm:h-5' />
										</div>
										{isSelected && <CheckCircle2 className='w-4 h-4 text-slate-900 shrink-0' />}
									</div>

									<div>
										<h3 className='text-xs sm:text-sm font-bold text-slate-900 leading-tight'>{dest.label}</h3>
										<p className='text-[11px] sm:text-xs text-slate-500 line-clamp-2 mt-0.5'>{dest.description}</p>
									</div>
								</button>
							);
						})}
					</div>
				</div>
			</section>

			{/* Suggested Prompts Section: Generous, Mobile-friendly Cards in Active Language */}
			<section className='w-full max-w-4xl mb-10 sm:mb-14'>
				<div className='flex items-center justify-between mb-4 px-1'>
					<div>
						<h2 className='text-sm sm:text-base font-bold text-slate-900'>{content.examplesHeader}</h2>
						<p className='text-xs sm:text-sm text-slate-500'>{content.examplesSub}</p>
					</div>
				</div>

				<div className='grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4'>
					{content.prompts.map((p, idx) => (
						<button key={idx} type='button' onClick={() => handleSelectExample(p.query, p.dest)} className='text-left p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all group cursor-pointer flex flex-col justify-between min-h-[110px]'>
							<div className='space-y-2 mb-3'>
								<div className='flex items-center justify-between gap-2'>
									<span className='text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors'>{p.title}</span>
									<span className='text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md shrink-0'>→ {p.targetName}</span>
								</div>
								<p className='text-xs sm:text-sm text-slate-600 leading-relaxed italic'>"{p.query}"</p>
							</div>

							<div className='flex items-center gap-1.5 text-xs font-semibold text-indigo-600 pt-2 border-t border-slate-100'>
								<span>{p.actionLabel}</span>
								<ChevronRight className='w-3.5 h-3.5 group-hover:translate-x-1 transition-transform' />
							</div>
						</button>
					))}
				</div>
			</section>

			{/* Pre-loaded Case Studies: Full-width, Accessible, High Contrast */}
			<section className='w-full max-w-4xl pt-8 sm:pt-10 border-t border-slate-200'>
				<div className='flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 px-1'>
					<div>
						<h2 className='text-sm sm:text-base font-bold text-slate-900'>{content.presetsHeader}</h2>
						<p className='text-xs sm:text-sm text-slate-500'>{content.presetsSub}</p>
					</div>
					<button onClick={onNewIntake} className='self-start sm:self-center px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer min-h-[36px]'>
						{content.createCustom}
					</button>
				</div>

				<div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
					{PRESET_SCENARIOS.map((preset) => (
						<button key={preset.id} onClick={() => onSelectPreset(preset)} className='text-left p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer'>
							<div className='space-y-2 mb-4'>
								<div className='flex items-center justify-between'>
									<span className='text-[11px] font-bold text-slate-400 uppercase tracking-wider'>{preset.domain.split("&")[0]}</span>
									<span className='text-xs text-slate-500 font-medium'>{preset.brief.intake.constraints.timeHorizonWeeks}w timeline</span>
								</div>
								<h3 className='text-sm sm:text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug'>{preset.name}</h3>
								<p className='text-xs text-slate-500 line-clamp-3 leading-relaxed'>{preset.tagline}</p>
							</div>

							<div className='flex items-center justify-between text-xs font-semibold text-slate-600 pt-3 border-t border-slate-100 group-hover:text-indigo-600 transition-colors'>
								<span>{content.openInWorkspace}</span>
								<ChevronRight className='w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all' />
							</div>
						</button>
					))}
				</div>
			</section>
		</div>
	);
};
