export enum AssessmentType {
  WordRecognition = 'WordRecognition',
  LetterAccuracy = 'LetterAccuracy',
  PhonemeMatching = 'PhonemeMatching',
  WordSequencing = 'WordSequencing',
  ReadingComprehension = 'ReadingComprehension',
  WorkingMemory = 'WorkingMemory',
  VisualProcessing = 'VisualProcessing',
  SpellingRecognition = 'SpellingRecognition',
}

export type DifficultyLevel = 'Excellent' | 'Good' | 'Below Average' | 'Poor' | 'Very Poor';
export type DyslexiaClassification = 'None' | 'Mild' | 'Moderate' | 'Severe' | 'Profound';

export interface AssessmentResult {
  type: AssessmentType;
  score: number; // 0-100
  rawMetric?: number; // Primary raw value: ms for speed, span for memory, correct count for others
  totalItems?: number; // For calculating accuracy percentages or displaying "x/y"
  completed: boolean;
  date: string;
}

export interface Question {
  id: string;
  stimulus: string; // The text, letter, or instructions displayed
  options?: string[];
  correctAnswer: string | string[]; // String for selection, array for sequence
  type: 'selection' | 'sequence' | 'memory' | 'visual_search' | 'audio_match';
  distractors?: string[];
  audioText?: string; // For TTS
  duration?: number; // For timed display
}

export interface AssessmentConfig {
  type: AssessmentType;
  title: string;
  description: string;
  instructions: string;
  questions: Question[];
  calculateScore: (metrics: PerformanceMetrics) => number;
}

export interface PerformanceMetrics {
  totalTrials: number;
  correctAnswers: number;
  averageReactionTime: number; // ms
  maxSpan?: number; // For memory
}

export const CLASSIFICATION_MAP: Record<DifficultyLevel, DyslexiaClassification> = {
  'Excellent': 'None',
  'Good': 'Mild',
  'Below Average': 'Moderate',
  'Poor': 'Severe',
  'Very Poor': 'Profound'
};