import { LanguageCode } from '../types/i18n';

export interface TranslationDictionary {
  // Brand & Slogan
  appName: string;
  appTagline: string;
  apacRegionBadge: string;
  cloudTranslationBadge: string;
  poweredByGoogleCloud: string;

  // Navigation
  navIntake: string;
  navWorkspace: string;
  navProblem: string;
  navKnowledge: string;
  navTradeoffs: string;
  navExperiment: string;
  navBrief: string;
  navDefense: string;
  navAuditor: string;
  navCaseStudies: string;
  navMethodology: string;
  navSearchLit: string;

  // Action Buttons
  btnNewIntake: string;
  btnExportBrief: string;
  btnDepthMode: string;
  btnBeginner: string;
  btnExperienced: string;
  btnFindEvidence: string;
  btnTranslateBrief: string;
  btnTranslating: string;
  btnOriginalEnglish: string;
  btnAttachToBrief: string;
  btnSearch: string;
  btnCancel: string;
  btnClose: string;

  // Status & Badges
  statusSourceSupported: string;
  statusAiInferred: string;
  statusHypothesis: string;
  statusInsufficientEvidence: string;
  badgeContradictory: string;
  badgeSupporting: string;
  badgePrimarySource: string;
  badgePeerReviewed: string;

  // Workspace & Cards
  cardProblemTitle: string;
  cardEvidenceTitle: string;
  cardQuestionTitle: string;
  cardHypothesisTitle: string;
  cardExperimentTitle: string;
  socraticAdvisorTitle: string;
  socraticAdvisorSub: string;
  traceableSourcesTitle: string;
  traceableSourcesSub: string;
  disconfirmingEvidenceHeader: string;
  disconfirmingEvidenceDesc: string;
  askAdvisorPlaceholder: string;
  quickPromptsLabel: string;

  // Methodology & Principles
  methodologyTitle: string;
  evidencePrinciplesTitle: string;
  principle1Title: string;
  principle2Title: string;
  principle3Title: string;
  principle4Title: string;
  principle5Title: string;
  principle6Title: string;
  principle7Title: string;
  principle8Title: string;
  principle9Title: string;
  principle10Title: string;

  // Defense Lab & Auditor
  defenseTitle: string;
  defenseSub: string;
  defenseProbePlaceholder: string;
  submitDefenseAnswer: string;
  evaluatingDefense: string;
  auditorTitle: string;
  auditorSub: string;
  auditButton: string;
  auditingInProgress: string;
  slopScoreLabel: string;
  empiricalDensityLabel: string;
}

export const TRANSLATIONS: Record<LanguageCode, TranslationDictionary> = {
  en: {
    appName: 'Ideally',
    appTagline: 'Evidence-Backed AI Research Advisor',
    apacRegionBadge: 'Japan & APAC',
    cloudTranslationBadge: 'Google Cloud Translation',
    poweredByGoogleCloud: 'Powered by Google Cloud Translation & Gemini',

    navIntake: 'Research Intake',
    navWorkspace: 'Reasoning Map',
    navProblem: 'Problem Validation',
    navKnowledge: 'Literature Map',
    navTradeoffs: 'Direction Trade-offs',
    navExperiment: 'Experiment Design',
    navBrief: 'Research Brief',
    navDefense: 'Defense Lab',
    navAuditor: 'Evidence Auditor',
    navCaseStudies: 'Case Studies',
    navMethodology: 'Methodology',
    navSearchLit: 'Literature & APIs',

    btnNewIntake: 'New Inquiry',
    btnExportBrief: 'Export Brief',
    btnDepthMode: 'Depth',
    btnBeginner: 'Beginner',
    btnExperienced: 'Experienced',
    btnFindEvidence: 'Mine Evidence',
    btnTranslateBrief: 'Translate Brief',
    btnTranslating: 'Translating...',
    btnOriginalEnglish: 'View Original English',
    btnAttachToBrief: 'Attach to Brief',
    btnSearch: 'Search',
    btnCancel: 'Cancel',
    btnClose: 'Close',

    statusSourceSupported: 'Source-Supported',
    statusAiInferred: 'AI-Inferred',
    statusHypothesis: 'Falsifiable Hypothesis',
    statusInsufficientEvidence: 'Insufficient Evidence',
    badgeContradictory: 'Contradictory / Nuanced',
    badgeSupporting: 'Supporting',
    badgePrimarySource: 'Primary Source',
    badgePeerReviewed: 'Peer-Reviewed',

    cardProblemTitle: 'Problem & Observation',
    cardEvidenceTitle: 'Traceable Literature',
    cardQuestionTitle: 'Primary Research Question',
    cardHypothesisTitle: 'Falsifiable Hypothesis',
    cardExperimentTitle: 'Controlled Experiment',
    socraticAdvisorTitle: 'Socratic Research Advisor',
    socraticAdvisorSub: 'Validating assumptions and operationalizing research directions',
    traceableSourcesTitle: 'Traceable Sources & Findings',
    traceableSourcesSub: 'Separating existence, prevalence, causes, and solution efficacy',
    disconfirmingEvidenceHeader: 'Evidence Principle #6: Disconfirming Findings',
    disconfirmingEvidenceDesc: 'We explicitly surface counter-evidence and negative results to prevent confirmation bias.',
    askAdvisorPlaceholder: 'Ask the research advisor (e.g., clarify context, request contradictory papers, challenge assumptions)...',
    quickPromptsLabel: 'Guiding Prompts',

    methodologyTitle: 'Methodology & Research Architecture',
    evidencePrinciplesTitle: 'The 10 Evidence Principles',
    principle1Title: 'Observation ≠ Fact',
    principle2Title: 'Primary Literature First',
    principle3Title: 'Anecdote ≠ Prevalence',
    principle4Title: 'Traceable Limitations',
    principle5Title: 'Causal Disambiguation',
    principle6Title: 'Mandatory Contradictory Evidence',
    principle7Title: 'AI Inference vs Proven Truth',
    principle8Title: 'Lack of Papers ≠ Novelty',
    principle9Title: 'Zero Hallucinated Citations',
    principle10Title: 'Simulations Must Be Labeled',

    defenseTitle: 'Socratic Defense Lab',
    defenseSub: 'Simulate high-stakes defense before Reviewer #2 and your advisory committee',
    defenseProbePlaceholder: 'Defend your methodological choice against this committee probe...',
    submitDefenseAnswer: 'Submit Defense Argument',
    evaluatingDefense: 'Advisory Committee Reviewing...',
    auditorTitle: 'Evidence & Slop Auditor',
    auditorSub: 'Detect vacuous AI rhetoric, phantom citations, and ungrounded claims',
    auditButton: 'Audit Proposal Integrity',
    auditingInProgress: 'Running Scholarly Integrity Audit...',
    slopScoreLabel: 'AI Slop & Rhetoric Score',
    empiricalDensityLabel: 'Empirical Density Score',
  },

  ja: {
    appName: 'Ideally',
    appTagline: 'エビデンスに基づくAI研究アドバイザー',
    apacRegionBadge: '日本・アジア太平洋',
    cloudTranslationBadge: 'Google Cloud 翻訳',
    poweredByGoogleCloud: 'Google Cloud Translation & Gemini による高精度翻訳',

    navIntake: '研究インテーク',
    navWorkspace: '推論マップ',
    navProblem: '課題の妥当性検証',
    navKnowledge: '先行文献マップ',
    navTradeoffs: '研究方針のトレードオフ',
    navExperiment: '実証実験デザイン',
    navBrief: '研究提案書（ブリーフ）',
    navDefense: '口頭試問・査読防衛ラボ',
    navAuditor: 'エビデンス監査・品質検証',
    navCaseStudies: '実例ケーススタディ',
    navMethodology: '研究手法ガイド',
    navSearchLit: '学術文献・外部API検索',

    btnNewIntake: '新規研究インテーク',
    btnExportBrief: '提案書を出力',
    btnDepthMode: '詳細度',
    btnBeginner: '初学者向け',
    btnExperienced: '研究者・専門家向け',
    btnFindEvidence: 'エビデンスを自動発掘',
    btnTranslateBrief: '提案書を日本語に翻訳',
    btnTranslating: '翻訳中...',
    btnOriginalEnglish: '原文（英語）を表示',
    btnAttachToBrief: '提案書に添付',
    btnSearch: '検索',
    btnCancel: 'キャンセル',
    btnClose: '閉じる',

    statusSourceSupported: '学術文献・根拠あり',
    statusAiInferred: 'AIによる推論仮説',
    statusHypothesis: '反証可能な仮説',
    statusInsufficientEvidence: 'エビデンス不足（要調査）',
    badgeContradictory: '反証・相反する見解',
    badgeSupporting: '支持する文献',
    badgePrimarySource: '一次情報源 (Primary Source)',
    badgePeerReviewed: '査読付き論文 (Peer-Reviewed)',

    cardProblemTitle: '課題認識と実世界の観察',
    cardEvidenceTitle: '追跡可能な先行文献',
    cardQuestionTitle: '中核となる研究設問 (RQ)',
    cardHypothesisTitle: '反証可能な科学的仮説',
    cardExperimentTitle: '対照実験・検証計画',
    socraticAdvisorTitle: 'ソクラテス式 AI研究アドバイザー',
    socraticAdvisorSub: '前提の疑義申し立て、変数操作化、および学術的方向性の防衛',
    traceableSourcesTitle: '追跡可能な文献根拠と知見',
    traceableSourcesSub: '課題の存在・有病率・原因・解決策の有効性を明確に区分',
    disconfirmingEvidenceHeader: 'エビデンス原則 #6: 反証データの積極的探索',
    disconfirmingEvidenceDesc: '確証バイアスを防ぐため、仮説に相反する論文や否定的結果（Negative Results）を必ず提示します。',
    askAdvisorPlaceholder: 'アドバイザーに質問する（例：文脈の明確化、反証論文の要求、前提条件の批判的検証）...',
    quickPromptsLabel: '示唆プロンプト',

    methodologyTitle: '学術研究手法とアーキテクチャ',
    evidencePrinciplesTitle: '10のエビデンス原則（審査規準）',
    principle1Title: '観察 ≠ 確立された事実',
    principle2Title: '一次文献を最優先',
    principle3Title: '個人の体験談 ≠ 統計的普及率',
    principle4Title: '追跡可能な前提と限界の明示',
    principle5Title: '因果関係と相関の厳密な区別',
    principle6Title: '反証的知見の提示義務',
    principle7Title: '文献根拠とAI推論の明確な分離',
    principle8Title: '文献不在 ≠ 新規性の証明',
    principle9Title: '架空引用の絶対禁止',
    principle10Title: 'シミュレーション内容の明示',

    defenseTitle: '口頭試問・査読防衛シミュレータ',
    defenseSub: '査読者2（Reviewer #2）や審査委員会からの厳しい試問に対する論理的防衛',
    defenseProbePlaceholder: '審査員からの厳しい質問に対して、実証的根拠をもとに回答してください...',
    submitDefenseAnswer: '防衛回答を提出',
    evaluatingDefense: '審査委員会が回答を評価中...',
    auditorTitle: '学術品質・AI修辞監査器',
    auditorSub: '内容の空虚なAI修辞、幻覚引用（ハルシネーション）、根拠なき主張を検出',
    auditButton: '論文・提案書の信頼性を監査',
    auditingInProgress: '学術的整合性を厳密に検査中...',
    slopScoreLabel: 'AI修辞・空虚度スコア (Slop Score)',
    empiricalDensityLabel: '実証的密度スコア (Empirical Density)',
  },

  'zh-CN': {
    appName: 'Ideally',
    appTagline: '基于证据的 AI 学术研究顾问',
    apacRegionBadge: '亚太地区 & 日本',
    cloudTranslationBadge: 'Google Cloud 翻译',
    poweredByGoogleCloud: '由 Google Cloud Translation & Gemini 强力驱动',

    navIntake: '研究立项',
    navWorkspace: '推理图谱',
    navProblem: '问题验证',
    navKnowledge: '文献图景',
    navTradeoffs: '方向权衡',
    navExperiment: '实验设计',
    navBrief: '研究方案简报',
    navDefense: '答辩实验室',
    navAuditor: '证据合规审计',
    navCaseStudies: '经典案例库',
    navMethodology: '研究方法学',
    navSearchLit: '文献与开放 API 检索',

    btnNewIntake: '新建研究课题',
    btnExportBrief: '导出方案简报',
    btnDepthMode: '深度模式',
    btnBeginner: '初学入门',
    btnExperienced: '资深学者',
    btnFindEvidence: '自动挖掘证据',
    btnTranslateBrief: '方案翻译为中文',
    btnTranslating: '正在翻译...',
    btnOriginalEnglish: '查看英文原文',
    btnAttachToBrief: '附入方案',
    btnSearch: '检索',
    btnCancel: '取消',
    btnClose: '关闭',

    statusSourceSupported: '文献强证据支持',
    statusAiInferred: 'AI 逻辑推论',
    statusHypothesis: '可证伪科学假说',
    statusInsufficientEvidence: '现有证据不足（待补充）',
    badgeContradictory: '反证 / 细分边界',
    badgeSupporting: '支持性证据',
    badgePrimarySource: '第一手原始文献',
    badgePeerReviewed: '同行评审学术论文',

    cardProblemTitle: '核心问题与现实观察',
    cardEvidenceTitle: '可溯源文献证据',
    cardQuestionTitle: '首要核心研究问题 (RQ)',
    cardHypothesisTitle: '可证伪科学假说',
    cardExperimentTitle: '对照实验与验证计划',
    socraticAdvisorTitle: '苏格拉底式 AI 研究顾问',
    socraticAdvisorSub: '质疑前设假设、严密化操作性定义、捍卫学术研究方向',
    traceableSourcesTitle: '可溯源文献与研究发现',
    traceableSourcesSub: '清晰区分：存在性、普遍性、因果机制与解决方案有效性',
    disconfirmingEvidenceHeader: '证据原则 #6：强制检索反驳与冲突发现',
    disconfirmingEvidenceDesc: '坚决防止证实偏差（Confirmation Bias），明确展示相反证据与负面结果。',
    askAdvisorPlaceholder: '向学术顾问提问（例如：界定具体业务场景、索取反驳文献、审查混杂变量）...',
    quickPromptsLabel: '启发式提问',

    methodologyTitle: '学术研究方法论规范',
    evidencePrinciplesTitle: '十大学术证据基本原则',
    principle1Title: '客观观察 ≠ 既成事实',
    principle2Title: '原始第一手文献优先',
    principle3Title: '个案传闻 ≠ 统计普遍性',
    principle4Title: '清晰可追溯的局限性说明',
    principle5Title: '因果机制与相关性的严格区分',
    principle6Title: '强制纳入反驳与冲突研究',
    principle7Title: '文献证据与 AI 推断泾渭分明',
    principle8Title: '缺乏文献 ≠ 具有学术创新性',
    principle9Title: '严厉禁止虚构学术文献',
    principle10Title: '模拟与推演内容必须明确标注',

    defenseTitle: '苏格拉底学术答辩实验室',
    defenseSub: '模拟面对二审评审人（Reviewer #2）与答辩委员会的高难度学术质疑',
    defenseProbePlaceholder: '针对答辩委员会的尖锐质疑，陈述您的论据与控制机制...',
    submitDefenseAnswer: '提交答辩论述',
    evaluatingDefense: '答辩委员会审核中...',
    auditorTitle: '学术规范与套话审计器',
    auditorSub: '严查空洞 AI 套话修辞、幻觉虚构文献与缺乏依据的夸大论断',
    auditButton: '一键审计学术合规性',
    auditingInProgress: '正在执行严谨学术诚信审计...',
    slopScoreLabel: 'AI 空洞修辞得分 (Slop Score)',
    empiricalDensityLabel: '实证证据密度 (Empirical Density)',
  },

  'zh-TW': {
    appName: 'Ideally',
    appTagline: '基於實證的 AI 學術研究顧問',
    apacRegionBadge: '亞太地區 & 日本',
    cloudTranslationBadge: 'Google Cloud 翻譯',
    poweredByGoogleCloud: '由 Google Cloud Translation & Gemini 專業驅動',

    navIntake: '研究立項',
    navWorkspace: '推理圖譜',
    navProblem: '問題驗證',
    navKnowledge: '文獻地圖',
    navTradeoffs: '方向權衡',
    navExperiment: '實驗設計',
    navBrief: '研究方案簡報',
    navDefense: '答辯實驗室',
    navAuditor: '證據合規審計',
    navCaseStudies: '經典案例庫',
    navMethodology: '研究方法學',
    navSearchLit: '文獻與開放 API 檢索',

    btnNewIntake: '新建研究課題',
    btnExportBrief: '匯出方案簡報',
    btnDepthMode: '深度模式',
    btnBeginner: '初學入門',
    btnExperienced: '資深學者',
    btnFindEvidence: '自動挖掘證據',
    btnTranslateBrief: '方案翻譯為繁體中文',
    btnTranslating: '正在翻譯...',
    btnOriginalEnglish: '查看英文原文',
    btnAttachToBrief: '附入方案',
    btnSearch: '檢索',
    btnCancel: '取消',
    btnClose: '關閉',

    statusSourceSupported: '文獻強證據支援',
    statusAiInferred: 'AI 邏輯推論',
    statusHypothesis: '可證偽科學假說',
    statusInsufficientEvidence: '現有證據不足（待補充）',
    badgeContradictory: '反證 / 細分邊界',
    badgeSupporting: '支援性證據',
    badgePrimarySource: '第一手原始文獻',
    badgePeerReviewed: '同行評審學術論文',

    cardProblemTitle: '核心問題與現實觀察',
    cardEvidenceTitle: '可溯原文獻證據',
    cardQuestionTitle: '首要核心研究問題 (RQ)',
    cardHypothesisTitle: '可證偽科學假說',
    cardExperimentTitle: '對照實驗與驗證計劃',
    socraticAdvisorTitle: '蘇格拉底式 AI 研究顧問',
    socraticAdvisorSub: '質疑前設假設、嚴密化操作性定義、捍衛學術研究方向',
    traceableSourcesTitle: '可溯原文獻與研究發現',
    traceableSourcesSub: '清晰區分：存在性、普遍性、因果機制與解決方案有效性',
    disconfirmingEvidenceHeader: '證據原則 #6：強制檢索反駁與衝突發現',
    disconfirmingEvidenceDesc: '堅決防止證實偏差（Confirmation Bias），明確展示相反證據與負面結果。',
    askAdvisorPlaceholder: '向學術顧問提問（例如：界定具體業務場景、索取反駁文獻、審查混雜變數）...',
    quickPromptsLabel: '啟發式提問',

    methodologyTitle: '學術研究方法論規範',
    evidencePrinciplesTitle: '十大學術證據基本原則',
    principle1Title: '客觀觀察 ≠ 既成事實',
    principle2Title: '原始第一手文獻優先',
    principle3Title: '個案傳聞 ≠ 統計普遍性',
    principle4Title: '清晰可追溯的局限性說明',
    principle5Title: '因果機制與相關性的嚴格區分',
    principle6Title: '強制納入反駁與衝突研究',
    principle7Title: '文獻證據與 AI 推斷涇渭分明',
    principle8Title: '缺乏文獻 ≠ 具有學術創新性',
    principle9Title: '嚴厲禁止虛構學術文獻',
    principle10Title: '模擬與推演內容必須明確標註',

    defenseTitle: '蘇格拉底學術答辯實驗室',
    defenseSub: '模擬面對二審評審人（Reviewer #2）與答辯委員會的高難度學術質疑',
    defenseProbePlaceholder: '針對答辯委員會的尖銳質疑，陳述您的論據與控制機制...',
    submitDefenseAnswer: '提交答辯論述',
    evaluatingDefense: '答辯委員會審核中...',
    auditorTitle: '學術規範與套話審計器',
    auditorSub: '嚴查空洞 AI 套話修辭、幻覺虛構文獻與缺乏依據的誇大論斷',
    auditButton: '一鍵審計學術合規性',
    auditingInProgress: '正在執行嚴謹學術誠信審計...',
    slopScoreLabel: 'AI 空洞修辭得分 (Slop Score)',
    empiricalDensityLabel: '實證證據密度 (Empirical Density)',
  },

  ko: {
    appName: 'Ideally',
    appTagline: '근거 기반 AI 연구 어드바이저',
    apacRegionBadge: '일본 및 아시아·태평양 (APAC)',
    cloudTranslationBadge: 'Google Cloud 번역',
    poweredByGoogleCloud: 'Google Cloud Translation 및 Gemini 기반 번역',

    navIntake: '연구 인테이크',
    navWorkspace: '추론 맵',
    navProblem: '문제 타당성 검증',
    navKnowledge: '선행 연구 지형도',
    navTradeoffs: '연구 방향 트레이드오프',
    navExperiment: '실험 설계',
    navBrief: '연구 제안서(Brief)',
    navDefense: '디펜스 랩 (심사 시뮬레이션)',
    navAuditor: '연구 근거 감사관',
    navCaseStudies: '실제 사례집',
    navMethodology: '연구 방법론 가이드',
    navSearchLit: '문헌 및 오픈 API 검색',

    btnNewIntake: '새 연구 시작',
    btnExportBrief: '제안서 내보내기',
    btnDepthMode: '학술 깊이',
    btnBeginner: '입문자 모드',
    btnExperienced: '연구자 모드',
    btnFindEvidence: '근거 문헌 마이닝',
    btnTranslateBrief: '제안서 한국어 번역',
    btnTranslating: '번역 중...',
    btnOriginalEnglish: '영문 원본 보기',
    btnAttachToBrief: '제안서에 첨부',
    btnSearch: '검색',
    btnCancel: '취소',
    btnClose: '닫기',

    statusSourceSupported: '문헌 근거 확보',
    statusAiInferred: 'AI 논리적 추론',
    statusHypothesis: '반증 가능한 가설',
    statusInsufficientEvidence: '근거 부족 (보완 필요)',
    badgeContradictory: '반증 / 상충 결과',
    badgeSupporting: '지지 문헌',
    badgePrimarySource: '1차 원본 출처 (Primary Source)',
    badgePeerReviewed: '동료 심사 논문 (Peer-Reviewed)',

    cardProblemTitle: '핵심 연구 문제 및 현실 관찰',
    cardEvidenceTitle: '추적 가능한 선행 문헌',
    cardQuestionTitle: '주요 연구 질문 (RQ)',
    cardHypothesisTitle: '반증 가능한 과학적 가설',
    cardExperimentTitle: '통제 실험 및 검증 계획',
    socraticAdvisorTitle: '소크라테스식 AI 연구 어드바이저',
    socraticAdvisorSub: '암묵적 가정 검증, 변수 조작적 정의 및 학술 방향성 방어',
    traceableSourcesTitle: '추적 가능한 출처 및 연구 발견',
    traceableSourcesSub: '문제의 존재, 유병률, 원인 및 해결책 유효성을 엄밀히 분리',
    disconfirmingEvidenceHeader: '근거 원칙 #6: 반증 및 상충 데이터 필수 탐색',
    disconfirmingEvidenceDesc: '확증 편향을 원천 차단하기 위해 반대되는 문헌과 부정적 결과(Negative Results)를 투명하게 제시합니다.',
    askAdvisorPlaceholder: '연구 어드바이저에게 질문하세요 (예: 구체적 맥락 정의, 반증 문헌 요구, 교란 변수 점검)...',
    quickPromptsLabel: '추천 프롬프트',

    methodologyTitle: '학술 연구 방법론 프레임워크',
    evidencePrinciplesTitle: '10대 학술 근거 원칙',
    principle1Title: '관찰 ≠ 입증된 사실',
    principle2Title: '1차 학술 문헌 최우선',
    principle3Title: '일화적 보고 ≠ 통계적 보편성',
    principle4Title: '추적 가능한 한계 명시',
    principle5Title: '인과관계와 상관관계의 엄밀한 구분',
    principle6Title: '반증적 발견의 의무적 탐색',
    principle7Title: '문헌 근거와 AI 추론의 명확한 분리',
    principle8Title: '문헌의 부재 ≠ 연구의 독창성',
    principle9Title: '허위 인용 및 날조 절대 금지',
    principle10Title: '시뮬레이션 내용 필수 라벨링',

    defenseTitle: '소크라테스식 연구 디펜스 랩',
    defenseSub: 'Reviewer #2 및 학위 심사위원회의 날카로운 질문에 대한 논리적 방어 훈련',
    defenseProbePlaceholder: '심사위원의 비판적 질문에 대해 통제 변수와 학술적 근거를 바탕으로 답변하세요...',
    submitDefenseAnswer: '디펜스 답변 제출',
    evaluatingDefense: '심사위원단 평가 중...',
    auditorTitle: '학술 진실성 및 상투어 감사관',
    auditorSub: '공허한 AI 수사, 환각 인용, 근거 없는 주장을 엄밀히 감지',
    auditButton: '제안서 진실성 감사 실행',
    auditingInProgress: '학술 건전성 심층 감사 중...',
    slopScoreLabel: 'AI 상투어 지수 (Slop Score)',
    empiricalDensityLabel: '실증 근거 밀도 (Empirical Density)',
  },

  id: {
    appName: 'Ideally',
    appTagline: 'Penasihat Riset Ilmiah Berbasis Bukti Nyata',
    apacRegionBadge: 'Jepang & Asia-Pasifik (APAC)',
    cloudTranslationBadge: 'Google Cloud Translation',
    poweredByGoogleCloud: 'Didukung oleh Google Cloud Translation & Gemini',

    navIntake: 'Penerimaan Riset',
    navWorkspace: 'Peta Penalaran',
    navProblem: 'Validasi Masalah',
    navKnowledge: 'Peta Literatur',
    navTradeoffs: 'Kompromi Arah Riset',
    navExperiment: 'Desain Eksperimen',
    navBrief: 'Dokumen Riset (Brief)',
    navDefense: 'Lab Sidang & Ujian',
    navAuditor: 'Auditor Bukti',
    navCaseStudies: 'Studi Kasus Nyata',
    navMethodology: 'Metodologi Riset',
    navSearchLit: 'Pencarian Literatur & API',

    btnNewIntake: 'Mulai Riset Baru',
    btnExportBrief: 'Ekspor Proposal',
    btnDepthMode: 'Kedalaman',
    btnBeginner: 'Pemula',
    btnExperienced: 'Peneliti Ahli',
    btnFindEvidence: 'Gali Bukti Literatur',
    btnTranslateBrief: 'Terjemahkan Proposal ke BI',
    btnTranslating: 'Menerjemahkan...',
    btnOriginalEnglish: 'Lihat Teks Asli (Inggris)',
    btnAttachToBrief: 'Lampirkan ke Dokumen',
    btnSearch: 'Cari',
    btnCancel: 'Batal',
    btnClose: 'Tutup',

    statusSourceSupported: 'Didukung Literatur Sah',
    statusAiInferred: 'Inferensi Logis AI',
    statusHypothesis: 'Hipotesis Teruji (Falsifiable)',
    statusInsufficientEvidence: 'Bukti Belum Cukup',
    badgeContradictory: 'Temuan Kontradiktif',
    badgeSupporting: 'Mendukung',
    badgePrimarySource: 'Sumber Primer',
    badgePeerReviewed: 'Ditelaah Sejawat (Peer-Reviewed)',

    cardProblemTitle: 'Validasi Masalah & Observasi Nyata',
    cardEvidenceTitle: 'Literatur yang Dapat Ditelusuri',
    cardQuestionTitle: 'Pertanyaan Riset Utama (RQ)',
    cardHypothesisTitle: 'Hipotesis Ilmiah yang Dapat Diuji',
    cardExperimentTitle: 'Eksperimen Terkontrol',
    socraticAdvisorTitle: 'Penasihat Riset Sokrates AI',
    socraticAdvisorSub: 'Menguji asumsi, mengoperasionalkan variabel, dan mempertahankan arah ilmiah',
    traceableSourcesTitle: 'Sumber Terlacak & Temuan Empiris',
    traceableSourcesSub: 'Membedakan keberadaan masalah, prevalensi, penyebab, dan efikasi solusi',
    disconfirmingEvidenceHeader: 'Prinsip Bukti #6: Penelusuran Bukti Kontradiktif',
    disconfirmingEvidenceDesc: 'Mencegah bias konfirmasi dengan secara sengaja memunculkan temuan yang berlawanan dan hasil negatif.',
    askAdvisorPlaceholder: 'Tanyakan penasihat riset (misal: klarifikasi konteks, minta literatur tandingan, periksa variabel perancu)...',
    quickPromptsLabel: 'Panduan Pertanyaan',

    methodologyTitle: 'Kerangka Metodologi Riset',
    evidencePrinciplesTitle: '10 Prinsip Bukti Ilmiah',
    principle1Title: 'Observasi ≠ Fakta Mutlak',
    principle2Title: 'Utamakan Literatur Primer',
    principle3Title: 'Anekdot Komunitas ≠ Prevalensi Statistik',
    principle4Title: 'Batasan & Konteks Harus Terlacak',
    principle5Title: 'Pisahkan Kausalitas dari Korelasi',
    principle6Title: 'Wajib Menyertakan Temuan Berlawanan',
    principle7Title: 'Pisahkan Bukti Literatur dari Inferensi AI',
    principle8Title: 'Ketiadaan Makalah ≠ Bukti Kebaruan',
    principle9Title: 'Nol Halusinasi Sitasi Fiktif',
    principle10Title: 'Simulasi Wajib Diberi Label Jelas',

    defenseTitle: 'Lab Ujian Sidang Sokrates',
    defenseSub: 'Simulasi ujian mempertahankan tesis di hadapan Reviewer #2 dan dewan penguji',
    defenseProbePlaceholder: 'Pertahankan argumen ilmiah Anda dengan bukti dan variabel kontrol...',
    submitDefenseAnswer: 'Kirim Jawaban Pembelaan',
    evaluatingDefense: 'Dewan Penguji Menilai...',
    auditorTitle: 'Auditor Integritas & Retorika Kosong',
    auditorSub: 'Mendeteksi klaim tanpa dasar, sitasi palsu, dan retorika AI yang tidak berbobot',
    auditButton: 'Audit Kualitas Proposal',
    auditingInProgress: 'Memeriksa Integritas Akademik...',
    slopScoreLabel: 'Skor Retorika Kosong (Slop Score)',
    empiricalDensityLabel: 'Kepadatan Bukti Empiris',
  },

  vi: {
    appName: 'Ideally',
    appTagline: 'Cố vấn Nghiên cứu Khoa học Dựa trên Bằng chứng',
    apacRegionBadge: 'Nhật Bản & Khu vực APAC',
    cloudTranslationBadge: 'Google Cloud Dịch',
    poweredByGoogleCloud: 'Được hỗ trợ bởi Google Cloud Translation & Gemini',

    navIntake: 'Tiếp nhận Đề tài',
    navWorkspace: 'Sơ đồ Lập luận',
    navProblem: 'Xác thực Vấn đề',
    navKnowledge: 'Bản đồ Tổng quan Tài liệu',
    navTradeoffs: 'Đánh đổi Hướng nghiên cứu',
    navExperiment: 'Thiết kế Thí nghiệm',
    navBrief: 'Tóm lược Nghiên cứu (Brief)',
    navDefense: 'Phòng Bảo vệ Khóa luận',
    navAuditor: 'Kiểm toán Tính Liêm chính',
    navCaseStudies: 'Nghiên cứu Điển hình',
    navMethodology: 'Phương pháp luận',
    navSearchLit: 'Tìm kiếm Tài liệu & API',

    btnNewIntake: 'Tạo Đề tài Mới',
    btnExportBrief: 'Xuất Báo cáo',
    btnDepthMode: 'Độ sâu',
    btnBeginner: 'Nhập môn',
    btnExperienced: 'Chuyên gia',
    btnFindEvidence: 'Tự động Khai phá Bằng chứng',
    btnTranslateBrief: 'Dịch Báo cáo sang Tiếng Việt',
    btnTranslating: 'Đang dịch...',
    btnOriginalEnglish: 'Xem Bản gốc Tiếng Anh',
    btnAttachToBrief: 'Đính kèm vào Báo cáo',
    btnSearch: 'Tìm kiếm',
    btnCancel: 'Hủy',
    btnClose: 'Đóng',

    statusSourceSupported: 'Có Tài liệu Xác thực',
    statusAiInferred: 'AI Suy luận Hợp lý',
    statusHypothesis: 'Giả thuyết Khả bác (Falsifiable)',
    statusInsufficientEvidence: 'Chưa đủ Bằng chứng (Cần bổ sung)',
    badgeContradictory: 'Bằng chứng Trái chiều / Giới hạn',
    badgeSupporting: 'Ủng hộ',
    badgePrimarySource: 'Nguồn Sơ cấp (Primary Source)',
    badgePeerReviewed: 'Phản biện Đồng cấp (Peer-Reviewed)',

    cardProblemTitle: 'Vấn đề Cốt lõi & Quan sát Thực tiễn',
    cardEvidenceTitle: 'Tài liệu Khảo sát có Nguồn gốc',
    cardQuestionTitle: 'Câu hỏi Nghiên cứu Trọng tâm (RQ)',
    cardHypothesisTitle: 'Giả thuyết Khoa học Khả bác',
    cardExperimentTitle: 'Thí nghiệm Đối chứng',
    socraticAdvisorTitle: 'Cố vấn Nghiên cứu AI Phương pháp Socrates',
    socraticAdvisorSub: 'Chất vấn giả định ngầm, thao tác hóa biến số, bảo vệ hướng nghiên cứu',
    traceableSourcesTitle: 'Nguồn Tài liệu có thể Truy xuất',
    traceableSourcesSub: 'Phân định rõ sự tồn tại, mức độ phổ biến, nguyên nhân và hiệu quả giải pháp',
    disconfirmingEvidenceHeader: 'Nguyên tắc Bằng chứng #6: Bắt buộc Tìm kiếm Bằng chứng Ngược chiều',
    disconfirmingEvidenceDesc: 'Chống thiên kiến xác nhận bằng cách chủ động công bố các phát hiện mâu thuẫn và kết quả âm tính.',
    askAdvisorPlaceholder: 'Đặt câu hỏi cho cố vấn (ví dụ: làm rõ ngữ cảnh, tìm bài báo trái chiều, kiểm tra biến gây nhiễu)...',
    quickPromptsLabel: 'Gợi ý Câu hỏi',

    methodologyTitle: 'Khung Phương pháp Luận Khoa học',
    evidencePrinciplesTitle: '10 Nguyên tắc Bằng chứng Học thuật',
    principle1Title: 'Quan sát Hiện tượng ≠ Chân lý Đã chứng minh',
    principle2Title: 'Ưu tiên Tài liệu Sơ cấp',
    principle3Title: 'Hiện tượng Cá biệt ≠ Mức độ Phổ biến',
    principle4Title: 'Giới hạn Phạm vi Phải Truy xuất được',
    principle5Title: 'Tách bạch Tuyệt đối Quan hệ Nhân quả và Tương quan',
    principle6Title: 'Bắt buộc Khảo sát Nghiên cứu Trái chiều',
    principle7Title: 'Phân định Minh bạch Tài liệu và Suy luận AI',
    principle8Title: 'Thiếu Tài liệu ≠ Nghiên cứu có Tính Mới',
    principle9Title: 'Tuyệt đối Không Bịa đặt Trích dẫn',
    principle10Title: 'Nội dung Mô phỏng Phải Ghi nhãn Rõ ràng',

    defenseTitle: 'Phòng Tập dượt Bảo vệ Đề tài Socrates',
    defenseSub: 'Mô phỏng phản biện trước Người phản biện số 2 và Hội đồng chấm luận án',
    defenseProbePlaceholder: 'Trả lời chất vấn học thuật dựa trên biến kiểm soát và số liệu thực nghiệm...',
    submitDefenseAnswer: 'Nộp Lập luận Bảo vệ',
    evaluatingDefense: 'Hội đồng đang Đánh giá...',
    auditorTitle: 'Công cụ Kiểm toán Liêm chính & Lời sáo rỗng',
    auditorSub: 'Phát hiện câu từ AI sáo rỗng, tài liệu trích dẫn ảo và luận điểm thiếu căn cứ',
    auditButton: 'Kiểm toán Liêm chính Học thuật',
    auditingInProgress: 'Đang rà soát Tính liêm chính...',
    slopScoreLabel: 'Điểm Sáo rỗng AI (Slop Score)',
    empiricalDensityLabel: 'Mật độ Bằng chứng Thực nghiệm',
  },

  th: {
    appName: 'Ideally',
    appTagline: 'ที่ปรึกษางานวิจัย AI บนฐานหลักฐานเชิงประจักษ์',
    apacRegionBadge: 'ญี่ปุ่นและเอเชียแปซิฟิก (APAC)',
    cloudTranslationBadge: 'Google Cloud แปลภาษา',
    poweredByGoogleCloud: 'ขับเคลื่อนด้วย Google Cloud Translation & Gemini',

    navIntake: 'รับโจทย์วิจัย',
    navWorkspace: 'แผนผังการให้เหตุผล',
    navProblem: 'การพิสูจน์ปัญหา',
    navKnowledge: 'ภูมิทัศน์วรรณกรรม',
    navTradeoffs: 'ข้อดีข้อเสียของทิศทาง',
    navExperiment: 'การออกแบบการทดลอง',
    navBrief: 'เอกสารสรุปข้อเสนอวิจัย (Brief)',
    navDefense: 'ห้องซ้อมสอบป้องกันวิทยานิพนธ์',
    navAuditor: 'ตรวจสอบความน่าเชื่อถือของหลักฐาน',
    navCaseStudies: 'กรณีศึกษาจริง',
    navMethodology: 'ระเบียบวิธีวิจัย',
    navSearchLit: 'สืบค้นวรรณกรรมและ API',

    btnNewIntake: 'เริ่มงานวิจัยใหม่',
    btnExportBrief: 'ส่งออกเอกสารสรุป',
    btnDepthMode: 'ระดับความลึก',
    btnBeginner: 'ระดับเริ่มต้น',
    btnExperienced: 'นักวิจัยผู้เชี่ยวชาญ',
    btnFindEvidence: 'ค้นหาหลักฐานอัตโนมัติ',
    btnTranslateBrief: 'แปลข้อเสนอวิจัยเป็นภาษาไทย',
    btnTranslating: 'กำลังแปลภาษา...',
    btnOriginalEnglish: 'ดูต้นฉบับภาษาอังกฤษ',
    btnAttachToBrief: 'แนบเข้ากับข้อเสนอวิจัย',
    btnSearch: 'ค้นหา',
    btnCancel: 'ยกเลิก',
    btnClose: 'ปิด',

    statusSourceSupported: 'มีวรรณกรรมรองรับชัดเจน',
    statusAiInferred: 'ข้ออนุมานเชิงตรรกะของ AI',
    statusHypothesis: 'สมมติฐานที่สามารถพิสูจน์ว่าเป็นเท็จได้',
    statusInsufficientEvidence: 'หลักฐานยังไม่เพียงพอ (ต้องหาเพิ่ม)',
    badgeContradictory: 'หลักฐานแย้ง / ข้อจำกัด',
    badgeSupporting: 'สนับสนุน',
    badgePrimarySource: 'แหล่งข้อมูลปฐมภูมิ',
    badgePeerReviewed: 'ผ่านการประเมินโดยผู้ทรงคุณวุฒิ',

    cardProblemTitle: 'ปัญหาหลักและการสังเกตในโลกจริง',
    cardEvidenceTitle: 'วรรณกรรมที่สามารถตรวจสอบย้อนกลับได้',
    cardQuestionTitle: 'คำถามวิจัยหลัก (RQ)',
    cardHypothesisTitle: 'สมมติฐานทางวิทยาศาสตร์ที่ทดสอบได้',
    cardExperimentTitle: 'การทดลองแบบมีกลุ่มควบคุม',
    socraticAdvisorTitle: 'ที่ปรึกษาวิจัย AI แบบโสเครตีส (Socratic)',
    socraticAdvisorSub: 'ท้าทายข้อสมมติ กำหนดนิยามเชิงปฏิบัติการ และปกป้องทิศทางวิชาการ',
    traceableSourcesTitle: 'แหล่งข้อมูลและข้อค้นพบที่ตรวจสอบได้',
    traceableSourcesSub: 'แยกแยะการมีอยู่จริง ความชุก สาเหตุ และประสิทธิภาพของทางออกอย่างเคร่งครัด',
    disconfirmingEvidenceHeader: 'หลักการข้อที่ 6: ต้องค้นหาหลักฐานที่ขัดแย้งเสมอ',
    disconfirmingEvidenceDesc: 'ป้องกันอคติเข้าข้างตนเอง (Confirmation Bias) โดยระบุผลลัพธ์ที่เป็นลบและข้อค้นพบที่ขัดแย้งอย่างชัดเจน',
    askAdvisorPlaceholder: 'ถามที่ปรึกษาวิจัย (เช่น ระบุบริบทให้แคบลง ขอเอกสารแย้ง ตรวจสอบตัวแปรกวน)...',
    quickPromptsLabel: 'คำถามแนะนำ',

    methodologyTitle: 'กรอบระเบียบวิธีวิจัยทางวิชาการ',
    evidencePrinciplesTitle: 'หลักการด้านหลักฐานทางวิชาการ 10 ประการ',
    principle1Title: 'การสังเกต ≠ ข้อเท็จจริงที่สรุปแล้ว',
    principle2Title: 'ให้ความสำคัญกับวรรณกรรมปฐมภูมิเป็นอันดับแรก',
    principle3Title: 'คำบอกเล่าทั่วไป ≠ ความชุกทางสถิติ',
    principle4Title: 'ต้องระบุข้อจำกัดและบริบทที่ตรวจสอบย้อนกลับได้',
    principle5Title: 'แยกแยะความเป็นเหตุเป็นผลออกจากความสัมพันธ์เชิงสหสัมพันธ์',
    principle6Title: 'บังคับให้สำรวจข้อค้นพบที่ขัดแย้ง',
    principle7Title: 'แยกแยะหลักฐานวรรณกรรมกับข้ออนุมานของ AI อย่างเด็ดขาด',
    principle8Title: 'การขาดแคลนงานวิจัย ≠ ความแปลกใหม่ของงาน',
    principle9Title: 'ห้ามกุรายการอ้างอิงปลอมโดยเด็ดขาด',
    principle10Title: 'เนื้อหาที่มาจากการจำลองต้องติดป้ายกำกับชัดเจน',

    defenseTitle: 'ห้องซ้อมสอบป้องกันวิทยานิพนธ์แบบโสเครตีส',
    defenseSub: 'จำลองการสอบป้องกันวิทยานิพนธ์ต่อหน้า Reviewer #2 และคณะกรรมการสอบ',
    defenseProbePlaceholder: 'ตอบข้อซักถามเชิงวิชาการโดยอิงหลักฐานและตัวแปรควบคุม...',
    submitDefenseAnswer: 'ส่งคำตอบการสอบป้องกัน',
    evaluatingDefense: 'คณะกรรมการกำลังประเมินคำตอบ...',
    auditorTitle: 'ระบบตรวจสอบความสมบูรณ์และสำนวนกลวงของ AI',
    auditorSub: 'ตรวจจับสำนวนกลวงของ AI รายการอ้างอิงลอย และข้ออ้างที่ไร้หลักฐานรองรับ',
    auditButton: 'ตรวจสอบความน่าเชื่อถือทางวิชาการ',
    auditingInProgress: 'กำลังตรวจสอบความถูกต้องทางวิชาการ...',
    slopScoreLabel: 'คะแนนสำนวนกลวงของ AI (Slop Score)',
    empiricalDensityLabel: 'ความหนาแน่นของหลักฐานเชิงประจักษ์',
  },
};
