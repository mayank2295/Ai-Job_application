/**
 * TypeScript type definitions for Mock Interview feature
 */

/**
 * Difficulty level for the interview
 */
export type DifficultyLevel = 'entry' | 'mid' | 'senior';

/**
 * Current stage of the interview flow
 */
export type InterviewStage = 'setup' | 'session' | 'results';

/**
 * Setup data collected before starting the interview
 */
export interface InterviewSetupData {
  resumeText: string;
  resumeFileName?: string;
  jobDescription?: string;
  difficultyLevel?: DifficultyLevel;
}

/**
 * Individual question asked by the interviewer
 */
export interface Question {
  id: string;
  text: string;
  timestamp: Date;
}

/**
 * Candidate's answer to a question
 */
export interface Answer {
  id: string;
  questionId: string;
  text: string;
  timestamp: Date;
  feedback?: string; // Optional inline feedback
}

/**
 * Score for a specific aspect of the interview
 */
export interface FeedbackScore {
  category: string;
  score: number; // 0-100
  description: string;
}

/**
 * Complete interview session data
 */
export interface InterviewSession {
  id: string;
  userId: string;
  setupData: InterviewSetupData;
  questions: Question[];
  answers: Answer[];
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'completed' | 'terminated';
}

/**
 * Detailed interview results and feedback
 */
export interface InterviewResult {
  sessionId: string;
  overallScore: number; // 0-100
  detailedFeedback: string;
  strengths: string[];
  improvements: string[];
  cvEnhancements: string[];
  scores: FeedbackScore[];
  completedAt: Date;
}

/**
 * Props for InterviewSetup component
 */
export interface InterviewSetupProps {
  onStart: (setupData: InterviewSetupData) => void;
  isLoading?: boolean;
}

/**
 * Props for InterviewSession component
 */
export interface InterviewSessionProps {
  session: InterviewSession;
  onAnswer: (answer: string) => void;
  onEndInterview: () => void;
  isGenerating?: boolean;
  currentQuestion?: Question;
}

/**
 * Props for InterviewResults component
 */
export interface InterviewResultsProps {
  result: InterviewResult;
  onStartNew: () => void;
  onDownloadReport: () => void;
}

/**
 * Props for QuestionCard component
 */
export interface QuestionCardProps {
  question: Question;
  isLatest?: boolean;
}

/**
 * Props for FeedbackPanel component
 */
export interface FeedbackPanelProps {
  feedback: string;
  isVisible: boolean;
  onClose?: () => void;
}
