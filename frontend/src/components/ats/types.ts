/**
 * TypeScript type definitions for ATS Analyzer feature
 */

/**
 * Analysis stage during processing
 */
export type AnalysisStage = 'uploading' | 'extracting' | 'analyzing' | 'complete' | 'error';

/**
 * Upload data for ATS analysis
 */
export interface AtsUploadData {
  resumeFile?: File;
  resumeText: string;
  jobDescriptionFile?: File;
  jobDescriptionText: string;
}

/**
 * Keyword match information
 */
export interface KeywordMatch {
  keyword: string;
  count: number;
  isMatched: boolean;
  importance: 'high' | 'medium' | 'low';
}

/**
 * Score breakdown by category
 */
export interface ScoreBreakdown {
  category: string;
  score: number; // 0-100
  maxScore: number;
  description: string;
  details?: string;
}

/**
 * Recommendation for improvement
 */
export interface Recommendation {
  id: string;
  type: 'critical' | 'important' | 'suggested';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
}

/**
 * Complete ATS analysis result
 */
export interface AtsAnalysis {
  id: string;
  userId: string;
  overallScore: number; // 0-100
  scoreBreakdown: ScoreBreakdown[];
  matchedKeywords: KeywordMatch[];
  missingKeywords: KeywordMatch[];
  recommendations: Recommendation[];
  summary: string;
  analyzedAt: Date;
  resumeFileName?: string;
  jobDescriptionFileName?: string;
}

/**
 * Props for AtsUpload component
 */
export interface AtsUploadProps {
  onAnalyze: (data: AtsUploadData) => void;
  isAnalyzing?: boolean;
}

/**
 * Props for AtsAnalysis component
 */
export interface AtsAnalysisProps {
  stage: AnalysisStage;
  progress: number; // 0-100
  message?: string;
}

/**
 * Props for AtsResults component
 */
export interface AtsResultsProps {
  analysis: AtsAnalysis;
  onTryAgain: () => void;
  onExportReport: () => void;
}

/**
 * Props for ScoreBreakdown component
 */
export interface ScoreBreakdownProps {
  scores: ScoreBreakdown[];
}

/**
 * Props for RecommendationsPanel component
 */
export interface RecommendationsPanelProps {
  recommendations: Recommendation[];
  matchedKeywords: KeywordMatch[];
  missingKeywords: KeywordMatch[];
}

/**
 * Props for ComparisonView component
 */
export interface ComparisonViewProps {
  originalText: string;
  improvedText: string;
  changes: string[];
}
