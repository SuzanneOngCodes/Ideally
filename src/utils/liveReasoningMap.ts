import type { ResearchMapCard, CardEvidenceStatus } from '../types/research';

interface LiveCard {
  title: string;
  summary: string;
  explanation: string;
  methodology: string;
  status: CardEvidenceStatus;
  limitations: string[];
  unresolved_questions: string[];
  sources: { title: string; url: string; excerpt?: string }[];
}

export interface ReasoningMapDiagramNode {
  id: ResearchMapCard['id'];
  label: string;
  title: string;
  summary: string;
  status: CardEvidenceStatus;
  source_count: number;
}

export interface ReasoningMapDiagramEdge {
  source: ResearchMapCard['id'];
  target: ResearchMapCard['id'];
  label: string;
}

export interface MindMapNode {
  id: string;
  parent_id?: string | null;
  label: string;
  description?: string;
  level: number;
  side?: 'left' | 'right' | null;
  branch_color?: string | null;
  children: string[];
  collapsed?: boolean;
}

export interface ReasoningMapUI {
  type: 'reasoning-map-diagram';
  version: 1;
  trigger?: 'user-request';
  title: string;
  format?: 'flow' | 'mermaid-mindmap';
  mermaid?: string;
  nodes: ReasoningMapDiagramNode[];
  edges: ReasoningMapDiagramEdge[];
  mindmap_nodes?: MindMapNode[];
}

export interface MermaidMindmapActivity {
  kind: 'mermaid-mindmap';
  status: 'generating' | 'ready';
  source: 'active-session';
  type?: 'reasoning-map-diagram';
  format?: 'mermaid-mindmap';
  title: string;
  mermaid: string;
  sourceCount?: number;
  nodes?: ReasoningMapDiagramNode[];
  mindmapNodes?: MindMapNode[];
}

const diagramRequestPattern = /(?:\b(?:show|draw|render|display|create|make|generate|visuali[sz](?:e|ation))\b.{0,40}\b(?:diagram|flowchart|graph|map)\b|\b(?:i\s+want|i\s+need|i['’]d\s+like)\b.{0,40}\b(?:diagram|flowchart|graph|map)\b|^\s*(?:diagram|flowchart)\s*(?:please|pls)?\s*[.!?]*$|(?:vẽ|tạo|hiển\s*thị|trình\s*bày|cho\s+(?:tôi|mình)\s+xem|muốn\s+(?:xem|có)|cần\s+xem|trực\s*quan\s*hóa|trực\s*quan\s*hoá|minh\s*họa|minh\s*hoạ).{0,40}(?:sơ\s*đồ|sơ\s*do|biểu\s*đồ|diagram|flowchart|map|luồng)|(?:sơ\s*đồ|sơ\s*do|biểu\s*đồ).{0,25}(?:để\s+dễ\s+nhìn|cho\s+dễ\s+hiểu))/i;
const noDiagramRequestPattern = /(?:\bno\b|\bdon['’]?t\b|\bwithout\b|không|ko|đừng|chưa\s*cần).{0,40}(?:diagram|flowchart|graph|map|sơ\s*đồ|sơ\s*do|biểu\s*đồ)/i;

export function isDiagramRequestText(text: string): boolean {
  return diagramRequestPattern.test(text) && !noDiagramRequestPattern.test(text);
}

export type LiveReasoningMap = Record<ResearchMapCard['id'], LiveCard>;

export function liveReasoningCards(map: LiveReasoningMap | null): ResearchMapCard[] {
  const stages = [
    ['problem', 'Problem'], ['evidence', 'Evidence'], ['research_question', 'Question'],
    ['hypothesis', 'Hypothesis'], ['experiment', 'Experiment'],
  ] as const;
  return stages.map(([id, name], index) => {
    const card = map?.[id];
    return {
      id, stageLabel: `Step ${index + 1}: ${name}`,
      title: card?.title || name,
      status: card?.status || 'insufficient-evidence',
      summary: card?.summary || 'Discuss your research topic to build this section.',
      accessibleExplanation: card?.explanation || 'No conversation data available yet.',
      deepScholarlyExplanation: card?.methodology || card?.explanation || 'No data available yet.',
      limitations: card?.limitations || [],
      unresolvedQuestions: card?.unresolved_questions || [],
      evidenceInsufficientAdvice: 'Claims remain unverified until supporting sources or measurements are available.',
      expectedOutcomeWarning: id === 'hypothesis' || id === 'experiment'
        ? 'AI proposal for testing — no experimental results have been measured.' : undefined,
      sources: (card?.sources || []).map(source => ({
        id: source.url, title: source.title, url: source.url, yearOrDate: '',
        category: 'existence', stance: 'unclassified', reviewScope: 'search_snippet',
        isPrimarySource: false, methodSummary: 'Search excerpt; full methodology has not been verified.',
        findingsSummary: source.excerpt || '', excerpt: source.excerpt || '',
        limitations: 'Search results are external references, not a completed empirical evaluation.',
      })),
    };
  });
}
