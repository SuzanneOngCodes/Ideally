import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ActionBarPrimitive,
  AuiIf,
  AssistantRuntimeProvider,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useExternalStoreRuntime,
  type AppendMessage,
  type AssistantRuntime,
  type ThreadMessageLike,
} from '@assistant-ui/react';
import { 
  ArrowUp,
  Plus,
  Mic,
  Sparkles, 
  HelpCircle, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Copy,
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
  ThumbsUp,
  ThumbsDown,
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
import { isDiagramRequestText, liveReasoningCards, type LiveReasoningMap, type ReasoningMapUI } from '../utils/liveReasoningMap';
import { useLanguage } from '../context/LanguageContext';
import { MarkdownContent } from './MarkdownContent';

type ChatProgressStage =
  | 'analyzing'
  | 'reviewing_method'
  | 'searching_sources'
  | 'reading_sources'
  | 'composing_answer'
  | 'saving_response';

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
}

const chatProgressLabels: Record<ChatProgressStage, { vi: string; en: string }> = {
  analyzing: { vi: 'Đang phân tích yêu cầu…', en: 'Analyzing your request…' },
  reviewing_method: { vi: 'Đang chọn phương pháp phù hợp…', en: 'Reviewing the research approach…' },
  searching_sources: { vi: 'Đang tìm nguồn nghiên cứu…', en: 'Searching research sources…' },
  reading_sources: { vi: 'Đang đọc tài liệu…', en: 'Reading source material…' },
  composing_answer: { vi: 'Đang tổng hợp câu trả lời…', en: 'Preparing the response…' },
  saving_response: { vi: 'Đang lưu phản hồi…', en: 'Saving the response…' },
};

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
  const [reasoningDiagram, setReasoningDiagram] = useState<ReasoningMapUI | null>(null);
  const cards = liveReasoningCards(reasoningMap);

  const [activeCardId, setActiveCardId] = useState<'problem' | 'evidence' | 'research_question' | 'hypothesis' | 'experiment'>('evidence');
  const [reasoningPanelTab, setReasoningPanelTab] = useState<'activity' | 'sources' | 'diagram'>('activity');
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [thinkingStage, setThinkingStage] = useState<ChatProgressStage>('analyzing');
  const sendingRef = useRef(false);
  const loadedSessionRef = useRef<string | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(Boolean(chatSessionId));
  const [chatError, setChatError] = useState<string | null>(null);
  const [isSearchingEvidence, setIsSearchingEvidence] = useState(false);
  const [composerExpanded, setComposerExpanded] = useState(false);
  const [composerMode, setComposerMode] = useState<'instant' | 'research'>('instant');
  const [isListening, setIsListening] = useState(false);
  const [feedbackVote, setFeedbackVote] = useState<'up' | 'down' | null>(null);
  const [dismissedFeedbackFor, setDismissedFeedbackFor] = useState<string | null>(null);
  const hasReadyReasoningMap = Boolean(
    !isHistoryLoading &&
    reasoningMap &&
    (['problem', 'evidence', 'research_question', 'hypothesis', 'experiment'] as const).every((id) => {
      const card = reasoningMap[id];
      return Boolean(card?.title?.trim() && card?.summary?.trim());
    }),
  );

  useEffect(() => {
    if (!chatSessionId) {
      loadedSessionRef.current = null;
      setMessages([]);
      setReasoningMap(null);
      setReasoningDiagram(null);
      setReasoningPanelTab('activity');
      setIsHistoryLoading(false);
      return;
    }
    if (loadedSessionRef.current === chatSessionId) return;
    const controller = new AbortController();
    setReasoningMap(null);
    setReasoningDiagram(null);
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
        const savedDiagram = session.research?.ui;
        setReasoningDiagram(savedDiagram?.type === 'reasoning-map-diagram' && savedDiagram.trigger === 'user-request' ? savedDiagram : null);
        setReasoningPanelTab('activity');
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

  const activeCard = cards.find(c => c.id === activeCardId) || cards[0];
  const allReasoningSources = cards.flatMap((card) => (card.sources || []).map((source) => ({ source, card })))
    .filter(({ source }, index, all) => !source.url || all.findIndex(({ source: candidate }) => candidate.url === source.url) === index);
  const diagramNodes = reasoningDiagram?.nodes || [];
  const diagramEdges = reasoningDiagram?.edges || [];

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
  const latestAdvisorMessageId = [...messages].reverse().find((message) => message.sender === 'advisor')?.id;

  const handleSendMessage = async (textToSend?: string, research = false) => {
    const query = textToSend || '';
    if (!query.trim() || sendingRef.current || isHistoryLoading) return false;
    sendingRef.current = true;
    setChatError(null);

    const userMsg: ConversationMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      linkedCardId: activeCardId,
    };
    const streamedAdvisorId = `msg-adv-${Date.now()}`;
    let streamedReply = '';

    setMessages(prev => [...prev, userMsg]);
    setIsSending(true);
    setThinkingStage('analyzing');

    try {
      const sessionId = chatSessionId || crypto.randomUUID();
      const res = await fetch(`/api/v1/${encodeURIComponent(sessionId)}/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(10 * 60 * 1000),
        body: JSON.stringify({
          message: query.trim(),
          research,
        }),
      });

      if (!res.ok) {
        let errorData: { detail?: unknown; error?: unknown } = {};
        try { errorData = await res.json(); } catch { /* The proxy may return a plain error. */ }
        if (res.status === 404 && chatSessionId) onChatSessionChange(null);
        const detail = typeof errorData.detail === 'string'
          ? errorData.detail
          : typeof errorData.error === 'string' ? errorData.error : undefined;
        throw new Error(detail || `Chat API error (${res.status})`);
      }
      if (!res.body) throw new Error('Chat API did not provide a response stream');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let data: any = null;
      const handleEvent = (line: string) => {
        if (!line.trim()) return;
        const event = JSON.parse(line);
        if (event.type === 'progress' && Object.hasOwn(chatProgressLabels, event.stage)) {
          setThinkingStage(event.stage as ChatProgressStage);
        } else if (event.type === 'token' && typeof event.text === 'string') {
          streamedReply += event.text;
          const partialMessage: ConversationMessage = {
            id: streamedAdvisorId,
            sender: 'advisor',
            text: streamedReply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            linkedCardId: activeCardId,
          };
          setMessages(prev => prev.some(message => message.id === streamedAdvisorId)
            ? prev.map(message => message.id === streamedAdvisorId ? partialMessage : message)
            : [...prev, partialMessage]);
        } else if (event.type === 'complete') {
          data = event.data;
        } else if (event.type === 'error') {
          throw new Error(event.message || 'Chat request failed');
        }
      };

      while (true) {
        const { value, done } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        lines.forEach(handleEvent);
        if (done) break;
      }
      handleEvent(buffer);
      if (!data) throw new Error('Chat stream ended before a final response');
      if (typeof data.reply !== 'string' || !data.reply.trim() || !data.session_id) {
        throw new Error('Chat API returned an invalid response');
      }
      if (data.research?.reasoning_map) setReasoningMap(data.research.reasoning_map);
      const nextDiagram = data.research?.ui?.type === 'reasoning-map-diagram' && data.research.ui.trigger === 'user-request' ? data.research.ui : null;
      setReasoningDiagram(nextDiagram);
      const explicitDiagramRequest = isDiagramRequestText(query);
      if (explicitDiagramRequest && nextDiagram) setReasoningPanelTab('diagram');
      else if (!nextDiagram && reasoningPanelTab === 'diagram') setReasoningPanelTab('activity');
      loadedSessionRef.current = data.session_id;
      onChatSessionChange(data.session_id);

      const advisorMsg: ConversationMessage = {
        id: streamedAdvisorId,
        sender: 'advisor',
        text: data.reply,
        sources: data.research?.sources,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        linkedCardId: data.suggestedCardId || activeCardId,
        actionPrompt: data.actionPrompt,
      };

      setMessages(prev => prev.some(message => message.id === streamedAdvisorId)
        ? prev.map(message => message.id === streamedAdvisorId ? advisorMsg : message)
        : [...prev, advisorMsg]);
      if (data.suggestedCardId && ['problem', 'evidence', 'research_question', 'hypothesis', 'experiment'].includes(data.suggestedCardId)) {
        setActiveCardId(data.suggestedCardId);
      }
      return true;
    } catch (error) {
      setMessages(prev => prev.filter(message => message.id !== userMsg.id && message.id !== streamedAdvisorId));
      setChatError(error instanceof Error ? error.message : 'Unable to connect to the chat API');
      return false;
    } finally {
      sendingRef.current = false;
      setIsSending(false);
      setThinkingStage('analyzing');
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

  const convertChatMessage = useCallback((message: ConversationMessage, index: number): ThreadMessageLike => ({
    id: message.id,
    role: message.sender === 'advisor' ? 'assistant' : 'user',
    content: [{ type: 'text', text: message.text }],
    createdAt: new Date(),
    status: message.sender === 'advisor'
      ? isSending && index === messages.length - 1
        ? { type: 'running' }
        : { type: 'complete', reason: 'stop' }
      : undefined,
    metadata: {
      custom: {
        timestamp: message.timestamp,
        linkedCardId: message.linkedCardId,
        sources: message.sources,
        actionPrompt: message.actionPrompt,
      },
    },
  }), [isSending, messages.length]);

  const runtimeRef = useRef<AssistantRuntime | null>(null);
  const onRuntimeNew = useCallback(async (message: AppendMessage) => {
    const text = message.content
      .filter(part => part.type === 'text')
      .map(part => part.text)
      .join('\n')
      .trim();
    if (text) {
      const sent = await handleSendMessage(text, composerMode === 'research');
      if (!sent) runtimeRef.current?.thread.composer.setText(text);
    }
  }, [composerMode, handleSendMessage]);

  const handleVoiceInput = () => {
    const speechWindow = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const SpeechRecognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setChatError('Voice input is not supported by this browser.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = currentLanguage === 'vi' ? 'vi-VN' : 'en-US';
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results as ArrayLike<ArrayLike<{ transcript: string }>>)
        .map((result: ArrayLike<{ transcript: string }>) => result[0]?.transcript || '')
        .join('');
      if (transcript) runtimeRef.current?.thread.composer.setText(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => {
      setIsListening(false);
      setChatError('Voice input could not start. Check microphone access and try again.');
    };
    setChatError(null);
    setIsListening(true);
    recognition.start();
  };

  const runtime = useExternalStoreRuntime({
    messages,
    convertMessage: convertChatMessage,
    isRunning: isSending,
    isLoading: isHistoryLoading,
    isSendDisabled: isHistoryLoading,
    onNew: onRuntimeNew,
  });
  runtimeRef.current = runtime;
  const initialComposerPrefilledRef = useRef(false);
  useEffect(() => {
    if (initialAdvisorQuery && !initialComposerPrefilledRef.current) {
      runtime.thread.composer.setText(initialAdvisorQuery);
      initialComposerPrefilledRef.current = true;
    }
  }, [initialAdvisorQuery, runtime]);



  return (
    <AssistantRuntimeProvider runtime={runtime}>
    <div className="h-full min-h-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col gap-3 overflow-hidden">
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
      <div className={`grid grid-cols-1 ${hasReadyReasoningMap ? 'lg:grid-cols-12' : ''} gap-4 flex-1 min-h-0`}>
        {/* ======================================================== */}
        {/* LEFT WORKING AREA: Conversation (lg:col-span-5)           */}
        {/* ======================================================== */}
        <section className={`${hasReadyReasoningMap ? 'lg:col-span-8' : ''} min-h-0 bg-white flex flex-col h-full overflow-hidden`}>
          {/* Chat Header */}
          <div className="min-h-12 px-4 sm:px-6 border-b border-slate-100 bg-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-2 rounded-full bg-emerald-500" />
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Ideally Research Advisor
                </h2>
                <p className="hidden sm:block text-[11px] text-slate-500">
                  Research advisor
                </p>
              </div>
            </div>
            <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-medium text-slate-500">Interactive</span>
          </div>

          <ThreadPrimitive.Root className="flex min-h-0 flex-1 flex-col">
            <ThreadPrimitive.Viewport
              autoScroll
              className="flex-1 min-h-0 overflow-y-auto px-4 py-6 sm:px-8 space-y-5 text-sm font-sans"
            >
              <AuiIf condition={(state) => state.thread.isEmpty}>
                <div className="mx-auto my-auto flex min-h-full w-full max-w-3xl flex-col items-center justify-center px-4 py-8 text-center">
                  <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <Sparkles className="size-5" />
                  </div>
                  <p className="text-lg font-semibold tracking-tight text-slate-900">What would you like to research?</p>
                  <p className="mt-1 max-w-md text-sm leading-relaxed text-slate-500">
                    Ask a question or pick a starting point. I can help shape it into a clear, testable research direction.
                  </p>
                  <div className="mt-6 grid w-full max-w-2xl grid-cols-1 gap-2 text-left sm:grid-cols-2">
                    {quickPrompts.map((qp, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendMessage(qp.prompt)}
                        disabled={isSending || isHistoryLoading}
                        className="group min-h-[76px] rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-blue-300 hover:bg-blue-50/40 hover:shadow-sm active:scale-[0.99] disabled:opacity-50"
                      >
                        <span className="block text-sm font-medium text-slate-800 group-hover:text-blue-800">{qp.label}</span>
                        <span className="mt-1 block line-clamp-2 text-xs leading-relaxed text-slate-500">{qp.prompt}</span>
                      </button>
                    ))}
                  </div>
                  <p className="mt-4 text-[11px] text-slate-400">
                    {audienceMode === 'beginner' ? 'Beginner friendly' : 'Research focused'} prompts · you can edit them before sending
                  </p>
                </div>
              </AuiIf>
              <ThreadPrimitive.Messages>
                {({ message }) => {
                  const m = messages.find(item => item.id === message.id);
                  if (!m) return null;
                  const isAdvisor = m.sender === 'advisor';
                  const isLatestAdvisorMessage = isAdvisor && m.id === latestAdvisorMessageId;
                  return (
                    <MessagePrimitive.Root
                      className={`mx-auto flex w-full max-w-3xl ${isAdvisor ? 'items-start gap-3' : 'flex-col items-end'}`}
                    >
                      {isAdvisor && (
                        <div
                          aria-hidden="true"
                          className="mt-1 inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600"
                        >
                          <Sparkles className="size-4" />
                        </div>
                      )}
                      <div className={isAdvisor ? 'min-w-0 flex-1' : 'max-w-[85%]'}>
                      <div className={`${isAdvisor ? 'w-full max-w-full py-1 text-[15px] leading-7 text-slate-800' : 'max-w-[85%] rounded-3xl bg-slate-100 px-4 py-3 text-[15px] leading-6 text-slate-900'} ${
                        isAdvisor
                          ? ''
                          : 'shadow-[0_1px_2px_rgba(15,23,42,0.04)]'
                      }`}>
                        <MessagePrimitive.Parts>
                          {({ part }) => part.type === 'text'
                            ? isAdvisor
                              ? <MarkdownContent className="text-[15px] leading-7 text-slate-800" text={part.text} />
                              : <p className="whitespace-pre-line">{part.text}</p>
                            : null}
                        </MessagePrimitive.Parts>

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
                      {isAdvisor && (
                        <>
                          <ActionBarPrimitive.Root
                            hideWhenRunning
                            autohide="not-last"
                            className="mt-1 flex items-center gap-1 text-slate-500"
                          >
                            <ActionBarPrimitive.Copy
                              copiedDuration={1800}
                              className="group/copy inline-flex size-9 items-center justify-center rounded-full transition hover:bg-slate-100 hover:text-slate-900 group-data-[copied]/copy:text-emerald-700"
                              aria-label="Copy response"
                              title="Copy response"
                            >
                              <Copy className="size-4 group-data-[copied]/copy:hidden" />
                              <Check className="hidden size-4 group-data-[copied]/copy:block" />
                            </ActionBarPrimitive.Copy>
                            <button
                              type="button"
                              aria-label="This response was helpful"
                              aria-pressed={feedbackVote === 'up'}
                              onClick={() => setFeedbackVote('up')}
                              className={`inline-flex size-9 items-center justify-center rounded-full transition hover:bg-slate-100 hover:text-slate-900 ${feedbackVote === 'up' ? 'text-blue-700' : ''}`}
                              title="Helpful"
                            >
                              <ThumbsUp className="size-4" />
                            </button>
                            <button
                              type="button"
                              aria-label="This response was not helpful"
                              aria-pressed={feedbackVote === 'down'}
                              onClick={() => setFeedbackVote('down')}
                              className={`inline-flex size-9 items-center justify-center rounded-full transition hover:bg-slate-100 hover:text-slate-900 ${feedbackVote === 'down' ? 'text-blue-700' : ''}`}
                              title="Not helpful"
                            >
                              <ThumbsDown className="size-4" />
                            </button>
                          </ActionBarPrimitive.Root>
                          {isLatestAdvisorMessage && !isSending && dismissedFeedbackFor !== m.id && (
                            <div className="mt-3 inline-flex max-w-full items-center rounded-xl border border-slate-200 bg-white text-sm text-slate-600 shadow-sm">
                              <span className="px-4 py-3">Is this conversation helpful so far?</span>
                              <button
                                type="button"
                                aria-label="Yes, this is helpful"
                                aria-pressed={feedbackVote === 'up'}
                                onClick={() => setFeedbackVote('up')}
                                className={`inline-flex size-11 items-center justify-center border-l border-slate-200 transition hover:bg-slate-50 ${feedbackVote === 'up' ? 'text-blue-700' : ''}`}
                              >
                                <ThumbsUp className="size-4" />
                              </button>
                              <button
                                type="button"
                                aria-label="No, this is not helpful"
                                aria-pressed={feedbackVote === 'down'}
                                onClick={() => setFeedbackVote('down')}
                                className={`inline-flex size-11 items-center justify-center transition hover:bg-slate-50 ${feedbackVote === 'down' ? 'text-blue-700' : ''}`}
                              >
                                <ThumbsDown className="size-4" />
                              </button>
                              <button
                                type="button"
                                aria-label="Dismiss feedback prompt"
                                onClick={() => setDismissedFeedbackFor(m.id)}
                                className="inline-flex size-11 items-center justify-center rounded-r-xl border-l border-slate-200 transition hover:bg-slate-50 hover:text-slate-900"
                              >
                                <X className="size-4" />
                              </button>
                            </div>
                          )}
                        </>
                      )}
                      </div>
                    </MessagePrimitive.Root>
                  );
                }}
              </ThreadPrimitive.Messages>

              {isHistoryLoading && (
                <div role="status" className="p-2 text-xs text-slate-500">Loading conversation history...</div>
              )}

              {isSending && (
                <div role="status" aria-live="polite" className="mx-auto flex w-full max-w-3xl items-start gap-3 px-0 py-2">
                  <div aria-hidden="true" className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <Sparkles className="size-4 animate-pulse" />
                  </div>
                  <div className="flex min-h-8 items-center gap-2 text-slate-500 text-xs italic">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
                    <span>{chatProgressLabels[thinkingStage][currentLanguage === 'vi' ? 'vi' : 'en']}</span>
                  </div>
                </div>
              )}
            </ThreadPrimitive.Viewport>

            <ThreadPrimitive.ViewportFooter className="bg-white px-4 pb-4 pt-2 sm:px-8 sm:pb-6">
              {chatError && (
                <div role="alert" className="mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {chatError} — Please retry your message.
                </div>
              )}
              <p className="mx-auto mb-2 max-w-3xl text-center text-[11px] leading-4 text-slate-400">Ideally can make mistakes. Check important information.</p>
              <ComposerPrimitive.Root className={`group/composer mx-auto flex w-full max-w-3xl items-end gap-2 border border-slate-200 bg-white px-3 shadow-[0_4px_18px_rgba(15,23,42,0.07)] transition focus-within:border-slate-300 focus-within:ring-2 focus-within:ring-slate-900/10 ${composerExpanded ? 'rounded-3xl py-3' : 'rounded-[28px] py-2'}`}>
                <button
                  type="button"
                  onClick={() => onOpenSearch?.()}
                  className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                  aria-label="Add research source"
                  title="Search and add a research source"
                >
                  <Plus className="size-5" />
                </button>
                <ComposerPrimitive.Input
                  rows={composerExpanded ? 6 : 1}
                  placeholder="Ask Ideally"
                  className={`w-full min-w-0 resize-none bg-transparent px-1 py-2 text-[15px] leading-6 text-slate-900 outline-none placeholder:text-slate-400 ${composerExpanded ? 'max-h-56 min-h-32' : 'max-h-40 min-h-10'}`}
                />
                <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setComposerExpanded((expanded) => !expanded)}
                      className="hidden size-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 sm:inline-flex"
                      aria-label={composerExpanded ? 'Collapse message composer' : 'Expand message composer'}
                      title={composerExpanded ? 'Collapse composer' : 'Expand composer'}
                    >
                      <Maximize2 className="size-4" />
                    </button>
                    <label className="relative">
                      <span className="sr-only">Chat response mode</span>
                      <select
                        value={composerMode}
                        onChange={(event) => setComposerMode(event.target.value as 'instant' | 'research')}
                        className="max-w-24 cursor-pointer appearance-none bg-transparent py-2 pl-1 pr-5 text-sm text-slate-500 outline-none hover:text-slate-900 focus:text-slate-900"
                      >
                        <option value="instant" className="bg-white">Instant</option>
                        <option value="research" className="bg-white">Research</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-0 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                    </label>
                    <button
                      type="button"
                      onClick={handleVoiceInput}
                      aria-label={isListening ? 'Listening' : 'Start voice input'}
                      title={isListening ? 'Listening…' : 'Voice input'}
                      className={`inline-flex size-10 items-center justify-center rounded-full transition hover:bg-slate-100 ${isListening ? 'text-rose-500' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      <Mic className="size-[18px]" />
                    </button>
                    <ComposerPrimitive.Send
                      className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                      aria-label="Send message"
                      title="Send message"
                    >
                      <ArrowUp className="size-5" />
                      <span className="sr-only">Send</span>
                    </ComposerPrimitive.Send>
                  </div>
              </ComposerPrimitive.Root>
            </ThreadPrimitive.ViewportFooter>
          </ThreadPrimitive.Root>
        </section>

        {/* Reasoning Map activity and sources sidebar */}
        {hasReadyReasoningMap && <aside className="lg:col-span-4 min-h-0 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col h-full overflow-hidden">
          <div className="px-4 pt-4 pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-slate-900 font-serif-scholarly">Reasoning Map</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">Research activity and cited sources</p>
              </div>
              <button
                type="button"
                onClick={() => handleFindEvidence(activeCard.id)}
                disabled={isSearchingEvidence || isSending || isHistoryLoading}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                title={`Find evidence for ${activeCard.stageLabel}`}
              >
                <Search className={`h-3.5 w-3.5 ${isSearchingEvidence ? 'animate-spin' : ''}`} />
                Find sources
              </button>
            </div>
            <div role="tablist" aria-label="Reasoning Map details" className="flex rounded-full bg-slate-100 p-1 text-[11px] sm:text-xs">
              <button type="button" role="tab" aria-selected={reasoningPanelTab === 'activity'} onClick={() => setReasoningPanelTab('activity')} className={`flex-1 rounded-full px-3 py-1.5 font-medium transition-colors ${reasoningPanelTab === 'activity' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
                Activity
              </button>
              <button type="button" role="tab" aria-selected={reasoningPanelTab === 'sources'} onClick={() => setReasoningPanelTab('sources')} className={`flex-1 rounded-full px-3 py-1.5 font-medium transition-colors ${reasoningPanelTab === 'sources' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
                {allReasoningSources.length} Sources
              </button>
              {reasoningDiagram && <button type="button" role="tab" aria-selected={reasoningPanelTab === 'diagram'} onClick={() => setReasoningPanelTab('diagram')} className={`flex-1 rounded-full px-3 py-1.5 font-medium transition-colors ${reasoningPanelTab === 'diagram' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
                Diagram
              </button>}
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
            {reasoningPanelTab === 'diagram' ? (
              <div className="mx-auto max-w-sm py-1">
                <div className="mb-4">
                  <h3 className="text-xs font-semibold text-slate-800">Research flow</h3>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-500">Select a node to inspect its reasoning and linked evidence.</p>
                </div>
                <ol className="space-y-1">
                  {diagramNodes.map((node, index) => {
                    const selected = node.id === activeCardId;
                    const nodeColor = node.status === 'source-supported' ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                      : node.status === 'insufficient-evidence' ? 'border-rose-300 bg-rose-50 text-rose-800'
                        : node.status === 'hypothesis' ? 'border-amber-300 bg-amber-50 text-amber-900'
                          : 'border-blue-200 bg-blue-50 text-blue-800';
                    return (
                      <React.Fragment key={node.id}>
                      <li className="relative pl-10">
                        <span className={`absolute left-1 top-3 z-10 flex size-6 items-center justify-center rounded-full border text-[10px] font-semibold ${nodeColor}`}>{index + 1}</span>
                        <button type="button" onClick={() => setActiveCardId(node.id)} aria-pressed={selected} className={`w-full rounded-xl border p-3 text-left transition active:scale-[0.99] ${selected ? 'border-blue-300 bg-blue-50/60 shadow-sm ring-1 ring-blue-100' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}`}>
                          <span className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{node.label}</span>
                            <span className="text-[10px] text-slate-400">{node.source_count} {node.source_count === 1 ? 'source' : 'sources'}</span>
                          </span>
                          <span className="mt-1 block text-xs font-semibold leading-snug text-slate-900">{node.title}</span>
                          <span className="mt-1 block line-clamp-2 text-[11px] leading-relaxed text-slate-600">{node.summary}</span>
                        </button>
                      </li>
                      {index < diagramNodes.length - 1 && (
                        <li aria-hidden="true" className="flex h-7 items-center gap-2 pl-[17px]">
                          <span className="h-full w-px bg-slate-300" />
                          <span className="text-[9px] text-slate-400">{diagramEdges.find((edge) => edge.source === node.id && edge.target === diagramNodes[index + 1].id)?.label || 'informs'}</span>
                        </li>
                      )}
                      </React.Fragment>
                    );
                  })}
                </ol>
                <p className="mt-4 border-t border-slate-100 pt-3 text-[10px] leading-relaxed text-slate-400">{reasoningDiagram?.title || 'This diagram visualizes the linked stages in the active session.'} Evidence status reflects the saved research data.</p>
              </div>
            ) : reasoningPanelTab === 'activity' ? (
              <div className="space-y-1">
                {(isSending || isSearchingEvidence) && (
                  <div className="mb-3 flex items-start gap-3 rounded-xl bg-blue-50/70 px-3 py-3 text-xs text-slate-700" role="status">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 animate-pulse" />
                    <div>
                      <p className="font-semibold text-slate-900">{isSearchingEvidence ? 'Searching for sources' : 'Thinking'}</p>
                      <p className="mt-0.5 text-slate-600">{isSearchingEvidence ? 'Checking relevant evidence for the selected card…' : chatProgressLabels[thinkingStage][currentLanguage === 'vi' ? 'vi' : 'en']}</p>
                    </div>
                  </div>
                )}
                {cards.map((card, index) => {
                  const selected = card.id === activeCardId;
                  const statusStyle = card.status === 'source-supported'
                    ? 'bg-emerald-100 text-emerald-800'
                    : card.status === 'insufficient-evidence'
                      ? 'bg-rose-100 text-rose-800'
                      : card.status === 'hypothesis'
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-indigo-100 text-indigo-800';
                  const statusLabel = card.status === 'source-supported' ? 'Source-supported'
                    : card.status === 'insufficient-evidence' ? 'Insufficient evidence'
                      : card.status === 'hypothesis' ? 'Hypothesis' : 'AI-inferred';
                  return (
                    <button key={card.id} type="button" onClick={() => setActiveCardId(card.id)} className={`group flex w-full gap-3 rounded-xl px-3 py-3 text-left transition-colors ${selected ? 'bg-slate-50 ring-1 ring-slate-200' : 'hover:bg-slate-50'}`}>
                      <span className="relative flex w-5 shrink-0 justify-center">
                        <span className={`mt-1 h-2.5 w-2.5 rounded-full ${selected ? 'bg-blue-600' : 'bg-slate-300'}`} />
                        {index < cards.length - 1 && <span className="absolute top-4 h-full w-px bg-slate-200" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{card.stageLabel}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-medium ${statusStyle}`}>{statusLabel}</span>
                        </span>
                        <span className="mt-1 block text-xs font-semibold leading-snug text-slate-900">{card.title}</span>
                        <span className="mt-1 line-clamp-3 block text-[11px] leading-relaxed text-slate-600">{card.summary}</span>
                        {!!card.sources.length && <span className="mt-2 inline-flex items-center gap-1 text-[10px] text-slate-500"><FileText className="h-3 w-3" />{card.sources.length} {card.sources.length === 1 ? 'source' : 'sources'}</span>}
                      </span>
                    </button>
                  );
                })}
                {onOpenSearch && <button type="button" onClick={onOpenSearch} className="mt-3 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"><Search className="h-3.5 w-3.5" />Explore research sources</button>}
              </div>
            ) : (
              <div className="space-y-2">
                {allReasoningSources.length ? allReasoningSources.map(({ source, card }) => {
                  const href = source.url?.trim();
                  return (
                    <article key={`${card.id}:${source.id}`} className="rounded-xl border border-slate-200 p-3 transition-colors hover:border-slate-300">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-800"><CheckCircle2 className="h-3 w-3" />{source.stance === 'contradictory' ? 'Contradictory' : source.stance === 'supporting' ? 'Supporting' : 'Retrieved source'}</span>
                        <span className="truncate text-[10px] text-slate-400">{card.stageLabel}</span>
                      </div>
                      {href ? <a href={href} target="_blank" rel="noreferrer" className="break-words text-xs font-semibold leading-snug text-slate-900 hover:text-blue-700">{source.title || href}<ExternalLink className="ml-1 inline h-3 w-3 text-slate-400" /></a> : <h3 className="break-words text-xs font-semibold leading-snug text-slate-900">{source.title}</h3>}
                      {source.venueOrPublisher && <p className="mt-1 text-[10px] text-slate-500">{source.venueOrPublisher}{source.yearOrDate ? ` · ${source.yearOrDate}` : ''}</p>}
                      {source.excerpt && <div className="mt-2 line-clamp-4 text-[11px] leading-relaxed text-slate-600"><MarkdownContent text={source.excerpt} /></div>}
                    </article>
                  );
                }) : (
                  <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center">
                    <FileText className="mx-auto h-5 w-5 text-slate-400" />
                    <p className="mt-2 text-xs font-medium text-slate-700">No sources attached yet</p>
                    <p className="mt-1 text-[11px] text-slate-500">Find evidence to add citations to your reasoning map.</p>
                    <button type="button" onClick={() => handleFindEvidence(activeCard.id)} disabled={isSending || isSearchingEvidence} className="mt-3 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50">Find evidence</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>}
      </div>
    </div>
    </AssistantRuntimeProvider>
  );
};
