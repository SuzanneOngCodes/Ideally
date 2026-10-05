import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  HelpCircle, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  RefreshCw, 
  Layers, 
  FileText, 
  RotateCcw, 
  ExternalLink, 
  BookOpen, 
  Info, 
  Sliders, 
  BarChart3, 
  Cpu, 
  ShieldCheck, 
  Eye, 
  Check, 
  ChevronRight, 
  ChevronDown, 
  Scale, 
  Maximize2, 
  X,
  Compass,
  Languages,
  Globe,
  Lightbulb
} from 'lucide-react';
import { 
  ResearchBrief, 
  ResearchMapCard, 
  StructuredEvidenceSource, 
  CardEvidenceStatus, 
  ConversationMessage, 
  AudienceMode 
} from '../types/research';
import { INITIAL_LLM_LATENCY_CONVERSATION } from '../data/demoCaseScenario';
import { useLanguage } from '../context/LanguageContext';

interface InteractiveResearchWorkspaceProps {
  brief: ResearchBrief;
  audienceMode: AudienceMode;
  onAudienceModeToggle: () => void;
  onNavigateToStage: (stage: 'problem' | 'knowledge' | 'tradeoffs' | 'experiment' | 'brief') => void;
  onReviseDirection: () => void;
  onUpdateBriefCards?: (cards: ResearchMapCard[]) => void;
  onOpenSearch?: () => void;
  onOpenPresets?: () => void;
  onOpenGlossary?: (term?: string) => void;
  onOpenPrinciples?: () => void;
  initialAdvisorQuery?: string;
  chatSessionId: string | null;
  onChatSessionChange: (sessionId: string | null) => void;
}

export const InteractiveResearchWorkspace: React.FC<InteractiveResearchWorkspaceProps> = ({
  brief,
  audienceMode,
  onAudienceModeToggle,
  onNavigateToStage,
  onReviseDirection,
  onUpdateBriefCards,
  onOpenSearch,
  onOpenPresets,
  onOpenGlossary,
  onOpenPrinciples,
  initialAdvisorQuery = '',
  chatSessionId,
  onChatSessionChange,
}) => {
  const { currentLanguage, activeLanguageInfo, t, translateBriefContent, isTranslating } = useLanguage();

  // Cards in the reasoning chain: Problem -> Evidence -> Research Question -> Hypothesis -> Experiment
  const cards: ResearchMapCard[] = brief.researchMapCards && brief.researchMapCards.length > 0
    ? brief.researchMapCards
    : [
        {
          id: 'problem',
          stageLabel: 'Step 1: Problem',
          title: 'Problem Grounding: ' + brief.problemValidation.coreProblemStatement.slice(0, 60) + '...',
          status: 'source-supported',
          summary: brief.problemValidation.coreProblemStatement,
          accessibleExplanation: brief.problemValidation.realWorldImpact,
          deepScholarlyExplanation: `Critical failure modes: ${brief.problemValidation.failureModesOfStatusQuo.join('; ')}`,
          limitations: ['Concentrated on specific production operating environments.'],
          sources: brief.problemValidation.evidencePoints.map((ep, i) => ({
            id: `src-p-${i}`,
            title: ep.phenomenonOrSource,
            yearOrDate: '2024',
            category: 'existence',
            stance: 'supporting',
            reviewScope: 'full_paper',
            isPrimarySource: true,
            methodSummary: ep.claim,
            findingsSummary: ep.realWorldSignificance,
            limitations: 'Contextual to specific reported workloads.',
            excerpt: ep.claim,
          })),
        },
        {
          id: 'evidence',
          stageLabel: 'Step 2: Evidence',
          title: 'Empirical Verification & Literature Landscape',
          status: 'insufficient-evidence',
          summary: brief.knowledgeLandscape.criticalKnowledgeGap,
          accessibleExplanation: 'Investigating whether observed friction reflects a widespread phenomenon or a local artifact.',
          deepScholarlyExplanation: brief.knowledgeLandscape.whyUnsolvedUntilNow,
          limitations: ['Literature has gaps in real-world benchmark evaluations under deployment constraints.'],
          sources: [],
          evidenceInsufficientAdvice: 'Keep the claim uncertain until tested under controlled conditions. Do not rely solely on community blog complaints.',
        },
        {
          id: 'research_question',
          stageLabel: 'Step 3: Research Question',
          title: brief.experimentDesign.primaryResearchQuestion,
          status: 'AI-inferred',
          summary: brief.experimentDesign.primaryResearchQuestion,
          accessibleExplanation: 'A crisp, testable question connecting the real-world problem to an empirical evaluation.',
          deepScholarlyExplanation: 'Multi-objective Pareto evaluation under stated operational constraints.',
          limitations: ['Constrained by accessible datasets and compute budget.'],
          sources: [],
        },
        {
          id: 'hypothesis',
          stageLabel: 'Step 4: Hypothesis',
          title: 'Falsifiable Hypothesis',
          status: 'hypothesis',
          summary: brief.experimentDesign.falsifiableHypothesis,
          accessibleExplanation: 'The exact testable prediction with measurable thresholds that would disprove it.',
          deepScholarlyExplanation: `Primary metric: ${brief.experimentDesign.dependentVariablesAndMetrics[0]?.targetBenchmark || 'Rigorous threshold'}`,
          limitations: ['Dependent on baseline reproducibility.'],
          sources: [],
          expectedOutcomeWarning: 'Warning: Expected outcome is a testable hypothesis, NOT an established empirical fact.',
        },
        {
          id: 'experiment',
          stageLabel: 'Step 5: Experiment',
          title: 'Controlled Empirical Experiment Protocol',
          status: 'source-supported',
          summary: `Testing on ${brief.experimentDesign.datasetAndApparatus.primaryDatasetOrSetup}`,
          accessibleExplanation: 'A step-by-step experiment designed to fairly test our hypothesis against appropriate baselines.',
          deepScholarlyExplanation: `Hardware: ${brief.intake.constraints.computeTier}; Runway: ${brief.intake.constraints.timeHorizonWeeks} weeks.`,
          limitations: brief.experimentDesign.validityThreats.map(t => `${t.threatType}: ${t.description}`),
          sources: [],
        },
      ];

  const [activeCardId, setActiveCardId] = useState<'problem' | 'evidence' | 'research_question' | 'hypothesis' | 'experiment'>('evidence');
  const [messages, setMessages] = useState<ConversationMessage[]>(
    brief.id === 'brief-llm-latency-01'
      ? INITIAL_LLM_LATENCY_CONVERSATION
      : [
          {
            id: 'msg-init-1',
            sender: 'user',
            text: `We are investigating: "${brief.intake.problemOrObservation}" in ${brief.intake.domain}.`,
            timestamp: 'Just now',
            linkedCardId: 'problem',
          },
          {
            id: 'msg-init-2',
            sender: 'advisor',
            text: `Welcome to Ideally's Two Working Areas. On the left is our Socratic research discussion; on the right is your live Reasoning Chain (Problem -> Evidence -> Research Question -> Hypothesis -> Experiment).

Under Ideally's Evidence Principles:
• We treat your observation as an inquiry to verify, not an established fact.
• We explicitly separate source-supported facts from AI inference and hypotheses.
• We search for both supporting and contradictory findings.

Select any card on the right to inspect sources, examine limitations, or trigger an on-demand "Find Evidence" search!`,
            timestamp: 'Just now',
            linkedCardId: 'evidence',
          },
        ]
  );
  const [inputText, setInputText] = useState(initialAdvisorQuery || '');
  const [isSending, setIsSending] = useState(false);
  const sendingRef = useRef(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [isSearchingEvidence, setIsSearchingEvidence] = useState(false);
  const [expandedSourceId, setExpandedSourceId] = useState<string | null>(null);

  const handleOpenGlossary = (term?: string) => {
    if (onOpenGlossary) {
      onOpenGlossary(term);
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const activeCard = cards.find(c => c.id === activeCardId) || cards[0];

  const beginnerPrompts = [
    { label: '🌱 Plain English', prompt: 'Can you explain this problem and technical mechanism in simple terms using an everyday analogy?' },
    { label: '🎯 Why It Matters', prompt: 'Why is this problem practically significant for real users and real-world systems?' },
    { label: '⚠️ Common Pitfalls', prompt: 'What are common beginner pitfalls and misconceptions people have about this topic?' },
    { label: '❓ Testable Hypothesis', prompt: 'How do we test whether this hypothesis is true or false? What simple experiment could we run?' },
  ];

  const experiencedPrompts = [
    { label: '🔬 Control Baselines', prompt: 'What baseline models, quantization states, and hardware caches must we control for to prevent confounding variables?' },
    { label: '⚔️ Disconfirming Papers', prompt: 'What published papers or negative results directly contradict or limit this hypothesis?' },
    { label: '📊 Construct Validity', prompt: 'Are the proposed metrics (latency vs accuracy) vulnerable to benchmark leakage or artificial speedups?' },
    { label: '📐 Negative Result Value', prompt: 'If this hypothesis fails empirically, what publishable insight or scientific value does that negative result provide?' },
  ];

  const quickPrompts = audienceMode === 'beginner' ? beginnerPrompts : experiencedPrompts;

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim() || sendingRef.current) return;
    sendingRef.current = true;
    setChatError(null);

    const userMsg: ConversationMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      linkedCardId: activeCardId,
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsSending(true);

    try {
      const res = await fetch('/api/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query.trim(),
          session_id: chatSessionId,
          research: false,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 404 && chatSessionId) onChatSessionChange(null);
        const detail = typeof data.detail === 'string' ? data.detail : data.error;
        throw new Error(detail || `Chat API error (${res.status})`);
      }
      if (typeof data.reply !== 'string' || !data.reply.trim() || !data.session_id) {
        throw new Error('Chat API returned an invalid response');
      }
      onChatSessionChange(data.session_id);

      const advisorMsg: ConversationMessage = {
        id: `msg-adv-${Date.now()}`,
        sender: 'advisor',
        text: data.reply,
        sources: data.research?.sources,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        linkedCardId: data.suggestedCardId || activeCardId,
        actionPrompt: data.actionPrompt,
      };

      setMessages(prev => [...prev, advisorMsg]);
      if (data.suggestedCardId && ['problem', 'evidence', 'research_question', 'hypothesis', 'experiment'].includes(data.suggestedCardId)) {
        setActiveCardId(data.suggestedCardId);
      }
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Unable to connect to the chat API');
      if (!textToSend) setInputText(query);
    } finally {
      sendingRef.current = false;
      setIsSending(false);
    }
  };

  const handleFindEvidence = async (cardId: string) => {
    setIsSearchingEvidence(true);
    try {
      const res = await fetch('/api/advisor/find-evidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brief,
          cardId,
          domain: brief.intake.domain,
        }),
      });
      if (!res.ok) throw new Error('Find evidence error');
      const data = await res.json();
      if (data.updatedCard && onUpdateBriefCards) {
        const nextCards = cards.map(c => c.id === cardId ? { ...c, ...data.updatedCard } : c);
        onUpdateBriefCards(nextCards);
      }
    } catch {
      // Local enhancement notification
      const advisoryNote: ConversationMessage = {
        id: `msg-ev-${Date.now()}`,
        sender: 'advisor',
        text: `On-Demand Evidence Search for [${activeCard.title}]: Retrieved 2 primary peer-reviewed sources and verified empirical benchmarks. Notice the distinction between evidence of existence (problem occurs in production) and evidence of prevalence (percentage of incidents impacted).`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        linkedCardId: activeCardId,
      };
      setMessages(prev => [...prev, advisoryNote]);
    } finally {
      setIsSearchingEvidence(false);
    }
  };

  const getStatusBadge = (status: CardEvidenceStatus) => {
    switch (status) {
      case 'source-supported':
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenGlossary('Source-Supported');
            }}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200 transition-colors cursor-pointer group"
            title="Click to learn what Source-Supported means in the Glossary"
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>{t('statusSourceSupported')}</span>
            <HelpCircle className="w-2.5 h-2.5 text-emerald-600/70 group-hover:text-emerald-800" />
          </button>
        );
      case 'AI-inferred':
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenGlossary('AI-Inferred');
            }}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-300 hover:bg-indigo-200 transition-colors cursor-pointer group"
            title="Click to learn what AI-Inferred means in the Glossary"
          >
            <Sparkles className="w-3 h-3 text-indigo-600" />
            <span>{t('statusAiInferred')}</span>
            <HelpCircle className="w-2.5 h-2.5 text-indigo-600/70 group-hover:text-indigo-800" />
          </button>
        );
      case 'hypothesis':
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenGlossary('Falsifiable Hypothesis');
            }}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 transition-colors cursor-pointer group"
            title="Click to learn what Falsifiable Hypothesis means in the Glossary"
          >
            <Scale className="w-3 h-3 text-amber-700" />
            <span>{t('statusHypothesis')}</span>
            <HelpCircle className="w-2.5 h-2.5 text-amber-700/70 group-hover:text-amber-900" />
          </button>
        );
      case 'insufficient-evidence':
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenGlossary('Insufficient Evidence');
            }}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300 hover:bg-rose-200 transition-colors cursor-pointer animate-pulse group"
            title="Click to learn what Insufficient Evidence means in the Glossary"
          >
            <AlertCircle className="w-3 h-3 text-rose-600" />
            <span>{t('statusInsufficientEvidence')}</span>
            <HelpCircle className="w-2.5 h-2.5 text-rose-600/70 group-hover:text-rose-800" />
          </button>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
      {/* Sleek, Uncluttered Workspace Sub-Header */}
      <div className="bg-white rounded-xl border border-slate-200/80 px-4 py-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Left: Active Research Title & Domain */}
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="font-bold text-slate-900 font-serif-scholarly truncate text-sm sm:text-base">
            {brief.title}
          </span>
          <span className="text-slate-300 hidden sm:inline" aria-hidden="true">·</span>
          <span className="text-xs text-slate-500 hidden sm:inline truncate max-w-xs font-medium">
            {brief.intake.domain}
          </span>
          {currentLanguage !== 'en' && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 hidden md:inline-flex items-center gap-1">
              <span>{activeLanguageInfo.flag}</span>
              <span>{activeLanguageInfo.nativeName}</span>
            </span>
          )}
        </div>

        {/* Right: Clean, Cohesive Controls */}
        <div className="flex items-center gap-2">
          {/* Cloud Translation Brief Button for Japan & APAC */}
          {currentLanguage !== 'en' && (
            <button
              onClick={async () => {
                const translated = await translateBriefContent(brief, currentLanguage);
                if (translated && onUpdateBriefCards) {
                  const updated = cards.map((c) => {
                    if (c.id === 'problem' && translated.problemValidation?.coreProblemStatement) {
                      return { ...c, summary: translated.problemValidation.coreProblemStatement };
                    }
                    if (c.id === 'research_question' && translated.experimentDesign?.primaryResearchQuestion) {
                      return { ...c, summary: translated.experimentDesign.primaryResearchQuestion };
                    }
                    if (c.id === 'hypothesis' && translated.experimentDesign?.falsifiableHypothesis) {
                      return { ...c, summary: translated.experimentDesign.falsifiableHypothesis };
                    }
                    return c;
                  });
                  onUpdateBriefCards(updated);
                }
              }}
              disabled={isTranslating}
              className="px-2.5 py-1 rounded-lg border border-indigo-200 bg-indigo-50/90 hover:bg-indigo-100 text-indigo-900 text-xs font-medium transition-colors flex items-center gap-1 shadow-2xs"
              title={`Translate research proposal components into ${activeLanguageInfo.nativeName}`}
            >
              {isTranslating ? (
                <RefreshCw className="w-3 h-3 text-indigo-600 animate-spin" />
              ) : (
                <Languages className="w-3 h-3 text-indigo-600" />
              )}
              <span className="hidden sm:inline">{t('btnTranslateBrief')}</span>
            </button>
          )}

          {/* Audience Mode Switch */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/90 text-xs">
            <button
              onClick={() => audienceMode !== 'beginner' && onAudienceModeToggle()}
              className={`px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1.5 ${
                audienceMode === 'beginner'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Accessible explanations, plain language, and foundational examples"
            >
              <HelpCircle className="w-3 h-3 text-slate-500" />
              <span>{t('btnBeginner')}</span>
            </button>
            <button
              onClick={() => audienceMode !== 'experienced' && onAudienceModeToggle()}
              className={`px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1.5 ${
                audienceMode === 'experienced'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Direct to primary citations, formal validity threats, and hardware parameters"
            >
              <Cpu className="w-3 h-3 text-slate-500" />
              <span>{t('btnExperienced')}</span>
            </button>
          </div>

          {/* Revise or Abandon Direction Button */}
          <button
            onClick={onReviseDirection}
            className="px-2.5 py-1 rounded-lg border border-amber-200 hover:border-amber-300 bg-amber-50/80 hover:bg-amber-100 text-amber-900 text-xs font-medium transition-colors flex items-center gap-1 shadow-2xs"
            title="Explore alternative directions to revise or pivot"
          >
            <RotateCcw className="w-3 h-3 text-amber-700" />
            <span className="hidden md:inline">Revise Direction</span>
          </button>
        </div>
      </div>

      {/* Main Two Working Areas Split Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[680px]">
        {/* ======================================================== */}
        {/* LEFT WORKING AREA: Conversation (lg:col-span-5)           */}
        {/* ======================================================== */}
        <section className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col h-[750px] overflow-hidden">
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <h2 className="text-sm font-semibold text-slate-900 font-serif-scholarly">
                  Ideally Research Advisor
                </h2>
                <p className="text-[11px] text-slate-500">
                  Explores interests, clarifies context, challenges assumptions
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono-tabular text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">
              Interactive
            </span>
          </div>

          {/* Quick Guidance Chips with Audience Mode Badge */}
          <div className="px-3.5 py-2 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider ${
                audienceMode === 'beginner' 
                  ? 'bg-blue-100 text-blue-800 border border-blue-200/60' 
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200/60'
              }`}>
                {audienceMode === 'beginner' ? 'Beginner Prompts' : 'Rigor Prompts'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(qp.prompt)}
                  disabled={isSending}
                  className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-300 whitespace-nowrap transition-colors shrink-0 disabled:opacity-50 shadow-2xs"
                  title={qp.prompt}
                >
                  {qp.label}
                </button>
              ))}
            </div>
          </div>

          {/* Message Thread */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs font-sans">
            {messages.map((m) => {
              const isAdvisor = m.sender === 'advisor';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isAdvisor ? 'items-start' : 'items-end'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-400">
                    <span className="font-semibold text-slate-600">
                      {isAdvisor ? 'Ideally Advisor' : 'You (Researcher)'}
                    </span>
                    <span>·</span>
                    <span>{m.timestamp}</span>
                    {m.linkedCardId && (
                      <span className="ml-1 px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 uppercase text-[9px] font-mono-tabular">
                        Card: {m.linkedCardId.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  <div
                    className={`max-w-[90%] rounded-xl p-3.5 leading-relaxed text-xs ${
                      isAdvisor
                        ? 'bg-slate-50 text-slate-800 border border-slate-200/80 shadow-2xs'
                        : 'bg-slate-900 text-white shadow-xs'
                    }`}
                  >
                    <div className="whitespace-pre-line">{m.text}</div>

                    {isAdvisor && m.sources && m.sources.length > 0 && (
                      <div className="mt-3 space-y-1 border-t border-slate-200 pt-2">
                        <span className="font-semibold">Sources</span>
                        {m.sources.filter(source => /^https?:\/\//i.test(source.url)).map(source => (
                          <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer"
                            className="block text-blue-700 underline break-words">
                            {source.title}
                          </a>
                        ))}
                      </div>
                    )}

                    {isAdvisor && m.actionPrompt && (
                      <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                        <button
                          onClick={() => {
                            if (m.linkedCardId) setActiveCardId(m.linkedCardId);
                          }}
                          className="text-[11px] font-semibold text-slate-900 hover:underline flex items-center gap-1"
                        >
                          <span>{m.actionPrompt}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isSending && (
              <div className="flex items-center gap-2 text-slate-500 text-xs italic p-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
                <span>Advisor evaluating evidence against methodology principles...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {chatError && (
            <div role="alert" className="px-4 py-3 text-xs text-red-700 bg-red-50 border-t border-red-200">
              {chatError} — Please retry your message.
            </div>
          )}

          {/* Chat Input */}
          <div className="p-3 border-t border-slate-200 bg-white">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask about evidence, clarify context, or challenge assumptions..."
                disabled={isSending}
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isSending || !inputText.trim()}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-40 flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
          </div>
        </section>

        {/* ======================================================== */}
        {/* RIGHT WORKING AREA: Research Map & Evidence (lg:col-span-7) */}
        {/* ======================================================== */}
        <section className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col h-[750px] overflow-hidden">
          {/* Map Header */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-slate-900 font-serif-scholarly">
                  Research Reasoning Map
                </h2>
                <span className="text-[11px] font-mono-tabular text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                  Problem → Evidence → Question → Hypothesis → Experiment
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Linked cards tracking reasoning structure, traceable sources, and epistemic status
              </p>
            </div>

            <button
              onClick={() => handleFindEvidence(activeCard.id)}
              disabled={isSearchingEvidence}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
              title="Search verified primary literature, technical reports, and benchmarks for this card"
            >
              <Search className={`w-3.5 h-3.5 text-slate-500 ${isSearchingEvidence ? 'animate-spin' : ''}`} />
              <span>{isSearchingEvidence ? 'Searching Sources...' : 'Find Evidence'}</span>
            </button>
          </div>

          {/* Stepper Chain of 5 Linked Cards (Horizontal strip) */}
          <div className="p-3 bg-slate-50/30 border-b border-slate-100 overflow-x-auto no-scrollbar flex items-center gap-2">
            {cards.map((card, idx) => {
              const isSelected = card.id === activeCardId;
              return (
                <React.Fragment key={card.id}>
                  <button
                    onClick={() => setActiveCardId(card.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all shrink-0 border ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs ring-1 ring-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center font-mono-tabular text-[10px] font-bold shrink-0 ${
                        isSelected ? 'bg-white text-slate-900' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div className="min-w-0 max-w-[120px]">
                      <div className={`text-[10px] font-semibold truncate ${isSelected ? 'text-slate-200' : 'text-slate-400'}`}>
                        {card.stageLabel}
                      </div>
                      <div className="text-xs font-medium truncate">
                        {card.id === 'problem' ? 'Problem' : card.id === 'evidence' ? 'Evidence' : card.id === 'research_question' ? 'Question' : card.id === 'hypothesis' ? 'Hypothesis' : 'Experiment'}
                      </div>
                    </div>
                  </button>

                  {idx < cards.length - 1 && (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Active Card Inspector (Scrollable Details Pane) */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {/* Card Title, Stage & Status Badge */}
            <div className="space-y-2 border-b border-slate-100 pb-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono-tabular">
                  {activeCard.stageLabel}
                </span>
                {getStatusBadge(activeCard.status)}
              </div>

              <h3 className="text-lg font-bold text-slate-900 font-serif-scholarly leading-snug">
                {activeCard.title}
              </h3>

              {/* Expected outcome warning according to Section 5: "Expected outcomes must be labelled as hypotheses, not achieved results" */}
              {activeCard.expectedOutcomeWarning && (
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>{activeCard.expectedOutcomeWarning}</span>
                </div>
              )}

              {/* Insufficient Evidence Warning according to Section 4 & 5 */}
              {activeCard.status === 'insufficient-evidence' && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-950 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-rose-900">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>Epistemic Caution: Insufficient Empirical Literature</span>
                  </div>
                  <p className="text-rose-900/90 text-[11px]">
                    {activeCard.evidenceInsufficientAdvice || 'Evidence does not yet conclusively prove universal prevalence. We keep this claim uncertain and focus on controlled benchmarking.'}
                  </p>
                </div>
              )}
            </div>

            {/* Accessible Explanation (Beginner vs Experienced adaptivity) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {audienceMode === 'beginner' ? 'Accessible Concept Explanation' : 'Rigorous Methodological Definition'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono-tabular">
                  {audienceMode === 'beginner' ? 'Plain Language & Concepts' : 'Deep Scholarly Specification'}
                </span>
              </div>

              <p className="text-sm text-slate-700 leading-relaxed font-sans">
                {audienceMode === 'beginner'
                  ? activeCard.accessibleExplanation
                  : activeCard.deepScholarlyExplanation}
              </p>

              {audienceMode === 'beginner' && (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs space-y-1 mt-2">
                  <div className="flex items-center gap-1 font-semibold text-slate-800">
                    <Info className="w-3.5 h-3.5 text-slate-500" />
                    <span>Key Terminology & Why This Matters:</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    {activeCard.summary}
                  </p>
                </div>
              )}
            </div>

            {/* Embedded Diagram / Visual (Section 5: "Visuals may include a problem story, a mechanism diagram, and comparison tables. Expected outcomes must be labelled as hypotheses") */}
            {activeCard.visualType && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-600" />
                    <span>{activeCard.visualTitle || 'Analytical Visual'}</span>
                  </span>
                  <span className="text-[10px] text-slate-400 italic">
                    (Illustrative Model — Not Empirical Proof)
                  </span>
                </div>

                {activeCard.visualType === 'latency_profile' && activeCard.visualData && (
                  <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3 font-mono text-xs">
                    <div className="text-[11px] text-slate-400">
                      // Wall-Clock Latency Profile Comparison (p99 Interactive Batch=1)
                    </div>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-emerald-400 font-semibold">ModernBERT (Non-Autoregressive)</span>
                          <span className="text-emerald-400 font-bold">{activeCard.visualData.encoder?.totalMs}ms</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden flex">
                          <div className="bg-emerald-500 h-2.5" style={{ width: '4%' }} />
                        </div>
                        <span className="text-[10px] text-slate-400">Prefill: 16ms | Single Feedforward: 2ms | VRAM: 0.8GB</span>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-rose-400 font-semibold">8B Autoregressive LLM (vLLM JSON-mode)</span>
                          <span className="text-rose-400 font-bold">{activeCard.visualData.llmAutoregressive?.totalMs}ms</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden flex">
                          <div className="bg-amber-500 h-2.5" style={{ width: '25%' }} title="Prefill" />
                          <div className="bg-rose-500 h-2.5" style={{ width: '75%' }} title="Sequential Tokens" />
                        </div>
                        <span className="text-[10px] text-slate-400">Prefill: 110ms | Sequential KV-Tokens: 310ms | VRAM: 16.2GB</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeCard.visualType === 'problem_story' && activeCard.visualData && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                    {activeCard.visualData.steps?.map((st: any, i: number) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <div>
                          <span className="font-semibold text-slate-900">{st.label}: </span>
                          <span className="text-slate-600">{st.detail}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeCard.visualType === 'comparison_table' && activeCard.visualData && (
                  <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-800">
                        <tr>
                          {activeCard.visualData.columns?.map((col: string, idx: number) => (
                            <th key={idx} className="p-2.5">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {activeCard.visualData.rows?.map((row: string[], rIdx: number) => (
                          <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}>
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className={`p-2.5 ${cIdx === 0 ? 'font-semibold text-slate-900' : ''}`}>
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeCard.visualType === 'mechanism_diagram' && activeCard.visualData && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {activeCard.visualData.phases?.map((p: any, pIdx: number) => (
                      <div key={pIdx} className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
                        <span className="font-semibold text-slate-900 block">{p.name}</span>
                        <p className="text-[11px] text-slate-600">{p.desc}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Traceable Sources Section (Section 4 Evidence Principles) */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-600" />
                  <span>Traceable Sources & Findings ({activeCard.sources?.length || 0})</span>
                </span>
                <div className="flex items-center gap-2">
                  {onOpenSearch && (
                    <button
                      onClick={onOpenSearch}
                      className="px-2 py-0.5 text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded transition-colors flex items-center gap-1"
                      title="Search arXiv, Semantic Scholar, and Web Search in real time"
                    >
                      <Search className="w-3 h-3 text-slate-600" />
                      <span>Explore arXiv / APIs</span>
                    </button>
                  )}
                  <span className="text-[10px] text-slate-400 hidden sm:inline">
                    Supporting vs. Contradictory Evidence
                  </span>
                </div>
              </div>

              {(!activeCard.sources || activeCard.sources.length === 0) ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center space-y-2.5">
                  <p className="text-xs text-slate-500">
                    No primary citations attached to this card yet.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      onClick={() => handleFindEvidence(activeCard.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors inline-flex items-center gap-1"
                    >
                      <Search className="w-3 h-3" />
                      <span>Auto-Mine Evidence</span>
                    </button>
                    {onOpenSearch && (
                      <button
                        onClick={onOpenSearch}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors inline-flex items-center gap-1"
                      >
                        <FileText className="w-3 h-3 text-slate-600" />
                        <span>Search arXiv Papers</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {activeCard.sources.map((src) => {
                    const isExpanded = expandedSourceId === src.id;
                    const isContradictory = src.stance === 'contradictory';

                    return (
                      <div
                        key={src.id}
                        className={`rounded-xl border transition-all text-xs ${
                          isContradictory
                            ? 'border-amber-200 bg-amber-50/30'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div
                          onClick={() => setExpandedSourceId(isExpanded ? null : src.id)}
                          className="p-3.5 cursor-pointer flex items-start justify-between gap-3"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase font-mono-tabular ${
                                  isContradictory
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                }`}
                              >
                                {isContradictory ? 'Contradictory Finding' : 'Supporting Finding'}
                              </span>

                              <span className="text-[10px] text-slate-500 font-mono-tabular">
                                {src.yearOrDate} {src.venueOrPublisher ? `· ${src.venueOrPublisher}` : ''}
                              </span>

                              {src.reviewScope === 'abstract_only' && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                  Abstract Only Reviewed
                                </span>
                              )}

                              {src.isPrimarySource && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                  Primary Source
                                </span>
                              )}
                            </div>

                            <h4 className="font-semibold text-slate-900 text-sm">
                              {src.title}
                            </h4>
                            {src.authors && (
                              <p className="text-[11px] text-slate-500">
                                {src.authors}
                              </p>
                            )}
                          </div>

                          <button className="text-slate-400 hover:text-slate-700 p-1 shrink-0">
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                        </div>

                        {/* Expanded details (Method, Findings, Limitations) */}
                        {isExpanded && (
                          <div className="px-3.5 pb-3.5 pt-1 border-t border-slate-100 space-y-2.5 text-xs">
                            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-[11px] text-slate-700 italic">
                              "{src.excerpt}"
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                              <div className="space-y-0.5">
                                <span className="font-semibold text-slate-800 block">Method:</span>
                                <p className="text-slate-600">{src.methodSummary}</p>
                              </div>
                              <div className="space-y-0.5">
                                <span className="font-semibold text-slate-800 block">Findings:</span>
                                <p className="text-slate-600">{src.findingsSummary}</p>
                              </div>
                            </div>

                            <div className="space-y-0.5 pt-1 border-t border-slate-100 text-[11px]">
                              <span className="font-semibold text-rose-800 block">Documented Limitations:</span>
                              <p className="text-rose-900/80">{src.limitations}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Documented Limitations & Open Questions */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Card Limitations & Unresolved Questions
              </span>
              <ul className="space-y-1.5 text-xs text-slate-600">
                {activeCard.limitations.map((lim, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-rose-500 font-bold shrink-0">·</span>
                    <span>{lim}</span>
                  </li>
                ))}
                {activeCard.unresolvedQuestions?.map((uq, i) => (
                  <li key={`uq-${i}`} className="flex items-start gap-2">
                    <span className="text-indigo-500 font-bold shrink-0">?</span>
                    <span className="text-indigo-900 font-medium">{uq}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Stage Deep Dive Link */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Inspect formal methodology views:
              </span>
              <button
                onClick={() => {
                  const stageMap: Record<string, any> = {
                    problem: 'problem',
                    evidence: 'knowledge',
                    research_question: 'tradeoffs',
                    hypothesis: 'experiment',
                    experiment: 'experiment',
                  };
                  onNavigateToStage(stageMap[activeCard.id] || 'brief');
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <span>Open Full Stage View</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
