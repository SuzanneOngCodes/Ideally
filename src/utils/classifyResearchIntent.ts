export type LanguageCode = "en" | "ja" | "zh-CN" | "zh-TW" | "ko" | "id" | "vi" | "th";

export interface IntentRoutingResult {
	targetTab: "workspace" | "auditor" | "brief" | "defense";
	label: string;
	tagline: string;
	reason: string;
	matchedKeywords: string[];
}

// 1. Language-Isolated Multi-lingual Keywords Matrix
const AUDITOR_KEYWORDS: Record<string, string[]> = {
	global: ["doi.org", "arxiv:", "crossref", "et al."],
	en: ["audit", "citation", "cite", "reference", "hallucinat", "slop", "fake", "phantom", "doi", "arxiv check", "check sources", "attribution drift", "verify claim", "fact-check", "plagiarism", "fabricat", "invented citation", "anti-slop"],
	ja: ["引用", "監査", "参考文献", "ハルシネーション", "捏造", "架空の引用", "ファクトチェック", "doi検証"],
	"zh-CN": ["引文", "审计", "查重", "虚假引用", "学术幻觉", "伪造", "文献核查", "虚构引用", "学术不端"],
	"zh-TW": ["引文", "審計", "查重", "虛假引用", "學術幻覺", "偽造", "文獻核查", "虛構引用", "學術不端"],
	ko: ["인용", "감사", "참고문헌", "환각", "위조", "허위 인용", "팩트체크", "출처 검증"],
	id: ["sitasi", "rujukan", "palsu", "halusinasi", "fabrikasi", "cek sumber"],
	vi: ["trích dẫn", "tài liệu tham khảo", "ảo giác", "ngụy tạo", "kiểm chứng"],
	th: ["อ้างอิง", "การอ้างอิงหลอน", "ตรวจสอบเอกสาร", "ความถูกต้อง"],
};

const PATENT_KEYWORDS: Record<string, string[]> = {
	global: ["35 u.s.c", "ids"],
	en: ["patent", "prior art", "inventive step", "non-obvious", "non obvious", "patent examiner", "patent claim", "office action", "intellectual property", "novelty search", "freedom to operate", "patent idea", "patentability"],
	ja: ["特許", "先行技術", "進歩性", "非自明", "特許審査官", "請求項", "クレーム", "知財", "特許性", "出願"],
	"zh-CN": ["专利", "先验技术", "先前技术", "创造性", "发明性", "非显而易见", "专利审查员", "权利要求", "查新", "知识产权"],
	"zh-TW": ["專利", "先驗技術", "先前技術", "創造性", "發明性", "非顯而易見", "專利審查員", "權利要求", "查新", "知識產權"],
	ko: ["특허", "선행기술", "진보성", "비자명성", "특허심사관", "청구항", "지식재산", "특허성", "출원"],
	id: ["paten", "teknologi sebelumnya", "langkah inventif", "klaim paten", "pemeriksa paten", "kekayaan intelektual"],
	vi: ["bằng sáng chế", "sáng chế", "nghệ thuật trước", "bước sáng tạo", "yêu cầu bảo hộ", "thẩm định viên"],
	th: ["สิทธิบัตร", "ความใหม่", "ขั้นการประดิษฐ์", "ผู้ตรวจสอบสิทธิบัตร", "ข้อถือสิทธิ", "ทรัพย์สินทางปัญญา"],
};

const DEFENSE_KEYWORDS: Record<string, string[]> = {
	global: ["reviewer 2", "reviewer #2", "p-value"],
	en: ["defense", "defend", "reviewer", "committee", "grill", "stress-test", "stress test", "counter-argument", "counterargument", "challenge", "rebuttal", "critique", "vulnerability", "probe", "flaw", "confounding", "threat to validity", "falsifi", "refute"],
	ja: ["ディフェンス", "口頭試問", "防衛", "査読者", "査読", "反論", "反証", "突っ込み", "批判", "ストレステスト", "交絡因子"],
	"zh-CN": ["答辩", "口试", "答辩委员会", "评审人", "审稿人", "二审", "反驳", "辩护", "压力测试", "混淆变量", "反例"],
	"zh-TW": ["答辯", "口試", "答辯委員會", "評審人", "審稿人", "二審", "反駁", "辯護", "壓力測試", "混淆變量", "反例"],
	ko: ["디펜스", "구두시험", "논문심사", "심사위원", "리뷰어2", "반론", "반박", "비판", "스트레스테스트", "교란변수"],
	id: ["pertahanan", "sidang", "penguji", "rebuttal", "sanggahan", "kritik", "bantahan"],
	vi: ["phản biện", "bảo vệ luận án", "hội đồng", "phản biện 2", "bác bỏ", "chất vấn"],
	th: ["แก้ต่าง", "ป้องกันวิทยานิพนธ์", "กรรมการ", "ผู้ประเมิน", "ข้อโต้แย้ง", "การซักค้าน"],
};

// Helper function to extract and match contextually bound phrases
function getTargetMatches(text: string, lang: LanguageCode, record: Record<string, string[]>): string[] {
	const targets = new Set([...(record.global || []), ...(record[lang] || []), ...(record.en || [])]);
	const matched: string[] = [];

	// 1. Clean and tokenize the user input string
	const cleanText = text.trim().toLowerCase();
	if (!cleanText) return [];

	// Helper to extract structural components out of CJK text strings
	const getCjkTokens = (str: string) => {
		// Matches Chinese, Japanese Kanji/Kana characters
		return str.match(/[\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff\u1100-\u11ff\u3130-\u318f\uac00-\ud7af]/g) || [];
	};

	// Helper to tokenize alphanumeric Latin/Germanic spaces (English, Indonesian, etc.)
	const getLatinTokens = (str: string) => {
		return str.split(/[^a-z0-9#\-\.\/]+/i).filter((t) => t.length > 0);
	};

	const textCjkTokens: string[] = getCjkTokens(cleanText);
	const textLatinTokens: string[] = getLatinTokens(cleanText);

	for (const keyword of targets) {
		const cleanKeyword = keyword.toLowerCase();

		// --- ALPHANUMERIC / LATIN BOUNDARY CHECKING ---
		if (/^[a-z0-9\s#\-\.\/]+$/i.test(cleanKeyword)) {
			const kwTokens = getLatinTokens(cleanKeyword);
			if (kwTokens.length === 0) continue;

			// All tokens in the latin keyword must exist cleanly as full words in user text
			const hasAllTokens = kwTokens.every((kwToken) => textLatinTokens.includes(kwToken));

			if (hasAllTokens) {
				matched.push(keyword);
			}
		}
		// --- LOGOGRAPHIC MATCHING MATRIX for Chinese, Japanese or Korean ---
		else {
			const kwCjkTokens: string[] = getCjkTokens(cleanKeyword);
			if (kwCjkTokens.length === 0) continue;

			// Prevent single-character input matching a longer keyword (Fixes the "文" issue)
			if (textCjkTokens.length === 1 && kwCjkTokens.length > 1) {
				// Only match if it's an exact standalone keyword match
				if (cleanText === cleanKeyword) {
					matched.push(keyword);
				}
				continue;
			}

			// Token intersection checks: count how many characters overlap regardless of syntax layout order
			const matchingChars = kwCjkTokens.filter((char) => textCjkTokens.includes(char));

			// If the user inputs 2+ characters, and they match at least 2 characters of the core concept
			if (matchingChars.length >= Math.min(2, kwCjkTokens.length)) {
				matched.push(keyword);
			}
		}
	}
	return matched;
}

// Multilingual Intent Classification
export function classifyResearchIntent(input: string, lang: LanguageCode = "en"): IntentRoutingResult {
	const text = (input || "").trim().toLowerCase();

	// Handle Empty State
	if (!text) {
		const defaultLabels: Record<LanguageCode, { label: string; tagline: string; reason: string }> = {
			en: { label: "Interactive Workspace", tagline: "Socratic dialogue & live 5-card reasoning chain", reason: "Explore problems, compare candidate directions, and ground claims with literature." },
			ja: { label: "対話型ワークスペース", tagline: "ソクラテス式アドバイザー対話と5段階の論理展開チェーン", reason: "研究課題の探究、アプローチ比較、先行文献とのエビデンス照合を行います。" },
			"zh-CN": { label: "交互式研究工作区", tagline: "苏格拉底式导师对话与5张核心推理逻辑卡片", reason: "系统性探索研究瓶颈、权衡候选技术路径并核查核心文献依据。" },
			"zh-TW": { label: "互動式研究工作區", tagline: "蘇格拉底式導師對話與5張核心推理邏輯卡片", reason: "系統性探索研究瓶頸、權衡候選技術路徑並核查核心文獻依據。" },
			ko: { label: "인터랙티브 워크스페이스", tagline: "소크라테스식 연구 자문과 5단계 추론 체인 캔버스", reason: "연구 문제 구체화, 후보 방법론 비교 분석 및 학술 문헌 검증을 수행합니다." },
			id: { label: "Ruang Kerja Interaktif", tagline: "Dialog Sokrates dan rantai penalaran 5 kartu terarah", reason: "Eksplorasi masalah penelitian, analisis komparatif, dan verifikasi literatur primer." },
			vi: { label: "Không Gian Nghiên Cứu Tương Tác", tagline: "Đối thoại Socrates và chuỗi lập luận 5 thẻ khoa học", reason: "Khám phá vấn đề nghiên cứu, so sánh các hướng tiếp cận và đối chiếu tài liệu." },
			th: { label: "พื้นที่ทำงานเชิงโต้ตอบ", tagline: "การสนทนาแบบโสเครตีสและแผนผังเหตุผล 5 ขั้นตอน", reason: "สำรวจปัญหาการวิจัย เปรียบเทียบแนวทางที่เป็นไปได้ และตรวจสอบวรรณกรรมหลัก" },
		};
		const def = defaultLabels[lang] || defaultLabels.en;
		return { targetTab: "workspace", label: def.label, tagline: def.tagline, reason: def.reason, matchedKeywords: [] };
	}

	// 2. Perform Smart Scoping Matching
	const matchedAuditor = getTargetMatches(text, lang, AUDITOR_KEYWORDS);
	const hasCitationSyntax = /([a-z]+ et al\.?|\([1-9][0-9]?\)|doi\.org|arxiv:\d)/i.test(text);

	if (matchedAuditor.length > 0 || hasCitationSyntax) {
		return {
			targetTab: "auditor",
			label: "Evidence & Citation Auditor",
			tagline: "DOI verification, phantom citation scan & anti-slop audit",
			reason: "Detected citation verification, hallucinated reference scan, or draft integrity audit.",
			matchedKeywords: matchedAuditor,
		};
	}

	const matchedPatent = getTargetMatches(text, lang, PATENT_KEYWORDS);
	if (matchedPatent.length > 0) {
		// Smart Sub-Intent Routing Matrix
		const textHas = (keywords: string[]) => keywords.some((k) => text.includes(k));

		if (textHas(["audit", "citation", "ids", "verify", "引用", "인용", "sitasi"])) {
			return {
				targetTab: "auditor",
				label: "Citation & Prior-Art Auditor",
				tagline: "Prior-art verification & Information Disclosure Statement (IDS) integrity",
				reason: "Detected patent prior-art audit: verifying references against published patents and literature.",
				matchedKeywords: matchedPatent,
			};
		}
		if (textHas(["brief", "draft", "spec", "claims", "proposal", "提案", "計画", "제안"])) {
			return {
				targetTab: "brief",
				label: "Proposal & Patent Specification",
				tagline: "Technical disclosure, claims architecture & reduction-to-practice protocol",
				reason: "Detected patent idea specification: drafting technical claims, mechanisms, and benchmark validation.",
				matchedKeywords: matchedPatent,
			};
		}
		if (textHas(["stress", "examiner", "obvious", "reject", "defend", "test", "審査官", "進歩性", "创造性", "심사관", "진보성"])) {
			return {
				targetTab: "defense",
				label: "Defense Lab (Patent Examiner)",
				tagline: "35 U.S.C. § 102/103 Novelty & Non-Obviousness Defense",
				reason: "Detected patent claim stress-test: defending against simulated Patent Examiner 102/103 prior-art rejections.",
				matchedKeywords: matchedPatent,
			};
		}
		return {
			targetTab: "workspace",
			label: "Interactive Workspace (Patent Novelty)",
			tagline: "Prior-art differentiation & inventive step formulation",
			reason: "Detected patent ideation: mapping technical delta from known prior art and establishing inventive step.",
			matchedKeywords: matchedPatent,
		};
	}

	const matchedDefense = getTargetMatches(text, lang, DEFENSE_KEYWORDS);
	if (matchedDefense.length > 0) {
		return {
			targetTab: "defense",
			label: "Socratic Defense Lab",
			tagline: "Reviewer #2 simulation & methodological stress-testing",
			reason: "Detected hypothesis stress-testing or Reviewer #2 adversarial critique.",
			matchedKeywords: matchedDefense,
		};
	}

	// Fallback Default routing block
	const fallbackDef = {
		en: { label: "Interactive Workspace", tagline: "Socratic dialogue & live 5-card reasoning chain", reason: "Standard research prompt routed to workspace query exploration." },
		ja: { label: "対話型ワークスペース", tagline: "ソクラテス式アドバイザー対話と5段階の論理展開チェーン", reason: "標準的なプロンプトをワークスペースでの探究にルーティングしました。" },
		"zh-CN": { label: "交互式研究工作区", tagline: "苏格拉底式导师对话与5张核心推理逻辑卡片", reason: "常规研究提示词已引导至工作区进行深入探索。" },
		"zh-TW": { label: "互動式研究工作區", tagline: "蘇格拉底式導師對話與5張核心推理邏輯卡片", reason: "常規研究提示詞已引導至工作區進行深入探索。" },
		ko: { label: "인터랙티브 워크스페이스", tagline: "소크라테스식 연구 자문과 5단계 추론 체인 캔버스", reason: "일반 연구 질의가 워크스페이스 탐색으로 라우팅되었습니다." },
		id: { label: "Ruang Kerja Interaktif", tagline: "Dialog Sokrates dan rantai penalaran 5 kartu terarah", reason: "Kueri penelitian standar diarahkan ke ruang eksplorasi kerja." },
		vi: { label: "Không Gian Nghiên Cứu Tương Tác", tagline: "Đối thoại Socrates và chuỗi lập luận 5 thẻ khoa học", reason: "Yêu cầu nghiên cứu tiêu chuẩn được chuyển đến không gian khám phá." },
		th: { label: "พื้นที่ทำงานเชิงโต้ตอบ", tagline: "การสนทนาแบบโสเครตีสและแผนผังเหตุผล 5 ขั้นตอน", reason: "คำสั่งวิจัยทั่วไปถูกส่งไปยังพื้นที่ทำงานเพื่อการสำรวจ" },
	};
	const currentFallback = fallbackDef[lang] || fallbackDef.en;

	return {
		targetTab: "workspace",
		label: currentFallback.label,
		tagline: currentFallback.tagline,
		reason: currentFallback.reason,
		matchedKeywords: [],
	};
}
