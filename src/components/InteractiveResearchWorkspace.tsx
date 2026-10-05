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
import { liveReasoningCards, type LiveReasoningMap } from '../utils/liveReasoningMap';
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
  const { currentLanguage, activeLanguageInfo, t } = useLanguage();

  const [reasoningMap, setReasoningMap] = useState<LiveReasoningMap | null>(null);
  const cards = liveReasoningCards(reasoningMap);

  const [activeCardId, setActiveCardId] = useState<'problem' | 'evidence' | 'research_question' | 'hypothesis' | 'experiment'>('evidence');
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [inputText, setInputText] = useState(initialAdvisorQuery || '');
  const [isSending, setIsSending] = useState(false);
  const sendingRef = useRef(false);
  const loadedSessionRef = useRef<string | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(Boolean(chatSessionId));
  const [chatError, setChatError] = useState<string | null>(null);
  const [isSearchingEvidence, setIsSearchingEvidence] = useState(false);
  const [expandedSourceId, setExpandedSourceId] = useState<string | null>(null);

  useEffect(() => {
    if (!chatSessionId) {
      loadedSessionRef.current = null;
      setMessages([]);
      setReasoningMap(null);
      setIsHistoryLoading(false);
      return;
    }
    if (loadedSessionRef.current === chatSessionId) return;
    const controller = new AbortController();
    setIsHistoryLoading(true);
    const loadHistory = async () => {
      try {
        const response = await fetch(`/api/v1/sessions/${encodeURIComponent(chatSessionId)}`, {
          signal: controller.signal,
        });
        if (response.status === 404) {
          onChatSessionChange(null);
          return;
        }
        if (!response.ok) throw new Error(`Unable to load session history (${response.status})`);
        const session = await response.json();
        if (!Array.isArray(session.messages)) throw new Error('Invalid session history');
        setReasoningMap(session.research?.reasoning_map || null);
        loadedSessionRef.current = chatSessionId;
        setMessages(session.messages
          .filter((message: { role: string }) => ['user', 'assistant'].includes(message.role))
          .map((message: { id: string; role: string; content: string; created_at: string }) => ({
            id: message.id,
            sender: message.role === 'assistant' ? 'advisor' : 'user',
            text: message.content,
            timestamp: new Date(message.created_at).toLocaleTimeString([], {
              hour: '2-digit', minute: '2-digit',
            }),
          })));
      } catch (error) {
        if (!controller.signal.aborted) {
          setChatError(error instanceof Error ? error.message : 'Unable to load session history');
        }
      } finally {
        if (!controller.signal.aborted) setIsHistoryLoading(false);
      }
    };
    void loadHistory();
    return () => controller.abort();
  }, [chatSessionId, onChatSessionChange]);

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

  const handleSendMessage = async (textToSend?: string, research = false) => {
    const query = textToSend || inputText;
    if (!query.trim() || sendingRef.current || isHistoryLoading) return;
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
          research,
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
      if (data.research?.reasoning_map) setReasoningMap(data.research.reasoning_map);
      loadedSessionRef.current = data.session_id;
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
      setMessages(prev => prev.filter(message => message.id !== userMsg.id));
      setChatError(error instanceof Error ? error.message : 'Unable to connect to the chat API');
      if (!textToSend) setInputText(query);
    } finally {
      sendingRef.current = false;
      setIsSending(false);
    }
  };

  const handleFindEvidence = async (cardId: string) => {
    if ((!reasoningMap && !chatSessionId) || isSending || isHistoryLoading || isSearchingEvidence) return;
    setIsSearchingEvidence(true);
    await handleSendMessage(
      reasoningMap
        ? `Find external evidence for this ${cardId.replace('_', ' ')} in our current discussion: ${cards.find(card => card.id === cardId)?.summary}. Update the five reasoning cards using actual sources and explain limitations.`
        : 'Build a five-card reasoning map from our actual conversation: problem, evidence, research_question, hypothesis, experiment. Search for relevant external sources and keep unknown constraints and measurements explicit.',
      true,
    );
    setIsSearchingEvidence(false);
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
            {reasoningMap?.problem.title || 'Your Research Workspace'}
          </span>
          <span className="text-slate-300 hidden sm:inline" aria-hidden="true">·</span>
          <span className="text-xs text-slate-500 hidden sm:inline truncate max-w-xs font-medium">
            {chatSessionId ? 'Saved session' : 'New conversation'}
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
                  disabled={isSending || isHistoryLoading}
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

            {isHistoryLoading && (
              <div role="status" className="p-2 text-xs text-slate-500">Loading conversation history...</div>
            )}

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
                disabled={isSending || isHistoryLoading}
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isSending || isHistoryLoading || !inputText.trim()}
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
              disabled={(!reasoningMap && !chatSessionId) || isSearchingEvidence || isSending || isHistoryLoading}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
              title="Search verified primary literature, technical reports, and benchmarks for this card"
            >
              <Search className={`w-3.5 h-3.5 text-slate-500 ${isSearchingEvidence ? 'animate-spin' : ''}`} />
              <span>{isSearchingEvidence ? 'Searching Sources...' : reasoningMap ? 'Find Evidence' : 'Build Research Map'}</span>
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
            {!reasoningMap && (
              <div role="status" className="p-4 rounded-xl bg-slate-50 text-sm text-slate-600">
                {isSending ? 'Building your research map from this conversation...' : 'Ask a research question to build your map. No sample data is loaded.'}
              </div>
            )}
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
                      disabled={!reasoningMap || isSending || isSearchingEvidence || isHistoryLoading}
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
                                {isContradictory ? 'Contradictory Finding' : src.stance === 'unclassified' ? 'Retrieved Source' : 'Supporting Finding'}
                              </span>

                              <span className="text-[10px] text-slate-500 font-mono-tabular">
                                {src.yearOrDate} {src.venueOrPublisher ? `· ${src.venueOrPublisher}` : ''}
                              </span>

                              {src.reviewScope === 'search_snippet' && (<span className="text-[9px] text-slate-500">Search excerpt</span>)}
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


          </div>
        </section>
      </div>
    </div>
  );
};
