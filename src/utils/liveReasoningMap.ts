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
