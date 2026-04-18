export type DomainKey =
  | 'platform'
  | 'etl_ingestion'
  | 'data_processing'
  | 'productionizing'
  | 'governance';

export type Language = 'python' | 'sql' | 'bash' | 'scala';

export interface Question {
  id: string;
  domain: DomainKey;
  subtopics: string[];
  difficulty: 1 | 2 | 3;
  text: string;
  code?: {
    snippet: string;
    language: Language;
  };
  options: [string, string, string, string];
  answer: 0 | 1 | 2 | 3;
  explanation: string;
  source?: string;
}

export interface ExamSession {
  startTimestamp: number;
  questionIds: string[];
  answers: Record<string, number>;
  flags: Record<string, boolean>;
  currentIndex: number;
  pausedAt: number | null;
  totalPausedMs: number;
}

export interface DomainResult {
  correct: number;
  total: number;
  percentage: number;
  weight: number;
}

export interface ExamResult {
  weightedScore: number;
  percentage: number;
  passed: boolean;
  totalCorrect: number;
  totalQuestions: number;
  domains: Record<DomainKey, DomainResult>;
  questionIds: string[];
  answers: Record<string, number>;
  durationSeconds: number;
  answeredAt: number;
  expired: boolean;
}

export interface HistoryEntry {
  answeredAt: number;
  percentage: number;
  passed: boolean;
  durationSeconds: number;
  studentName: string;
  questionIds: string[];
  answers: Record<string, number>;
}
