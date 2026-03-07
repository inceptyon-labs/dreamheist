// Core types for Dream Heist

export type SessionState =
  | 'created'
  | 'polling'
  | 'revealing'
  | 'extracting'
  | 'orchestrating'
  | 'complete'
  | 'error';

export type AgentRole = 'extractor' | 'forger' | 'architect' | 'builder' | 'auditor' | 'shade';

export type AgentStatus = 'idle' | 'queued' | 'active' | 'blocked' | 'completed' | 'warning' | 'failed';

export type QuestionKey = 'the-mark' | 'the-desire' | 'the-construct' | 'the-distortion' | 'the-rule';

export interface Session {
  id: string;
  createdAt: string;
  title: string;
  state: SessionState;
  currentQuestionIndex: number;
  votingLocked: boolean;
  audienceCount: number;
}

export interface QuestionOption {
  id: string;
  label: string;
}

export interface Question {
  id: string;
  key: QuestionKey;
  label: string;
  prompt: string;
  options: QuestionOption[];
  winnerId: string | null;
  winnerLabel: string | null;
}

export interface Vote {
  sessionId: string;
  questionId: string;
  participantId: string;
  selectedOptionId: string;
  timestamp: string;
}

export interface AgentRun {
  id: string;
  sessionId: string;
  role: AgentRole;
  status: AgentStatus;
  startedAt: string | null;
  completedAt: string | null;
  input: string | null;
  output: string | null;
}

export interface TranslationResult {
  symbolicInputs: Record<QuestionKey, string>;
  mappedMeanings: Record<QuestionKey, string>;
  formula: string;
}

export interface SessionSnapshot {
  session: Session;
  questions: Question[];
  votes: Record<string, Record<string, number>>; // questionId -> optionId -> count
  agents: AgentRun[];
  translation: TranslationResult | null;
  artifacts: ArtifactRecord[];
}

export interface ArtifactRecord {
  sessionId: string;
  role: string;
  artifactType: string;
  content: string;
  filePath: string | null;
}

// SSE Event types
export type SSEEventType =
  | 'session_state_changed'
  | 'question_advanced'
  | 'vote_cast'
  | 'voting_locked'
  | 'winner_revealed'
  | 'reveal_started'
  | 'extraction_started'
  | 'agent_status_changed'
  | 'artifact_generated'
  | 'pipeline_complete'
  | 'error_occurred';

export interface SSEEvent {
  type: SSEEventType;
  data: Record<string, unknown>;
}
