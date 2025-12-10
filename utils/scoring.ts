import { PerformanceMetrics, DifficultyLevel, DyslexiaClassification, CLASSIFICATION_MAP } from '../types';

export const calculateDifficulty = (score: number): { level: DifficultyLevel, classification: DyslexiaClassification } => {
  if (score >= 80) return { level: 'Excellent', classification: CLASSIFICATION_MAP['Excellent'] };
  if (score >= 60) return { level: 'Good', classification: CLASSIFICATION_MAP['Good'] };
  if (score >= 40) return { level: 'Below Average', classification: CLASSIFICATION_MAP['Below Average'] };
  if (score >= 20) return { level: 'Poor', classification: CLASSIFICATION_MAP['Poor'] };
  return { level: 'Very Poor', classification: CLASSIFICATION_MAP['Very Poor'] };
};

// Assessment 1: Word Recognition Speed
export const scoreWordRecognition = (metrics: PerformanceMetrics): number => {
  // Score = 100 - ((Average_Reaction_Time - 500) / 25)
  // Table floor is 10 for 3000ms+
  const score = 100 - ((metrics.averageReactionTime - 500) / 25);
  return Math.max(10, Math.min(100, Math.round(score)));
};

// Assessment 2, 3, 5, 8: Accuracy Based
export const scoreAccuracy = (metrics: PerformanceMetrics): number => {
  if (metrics.totalTrials === 0) return 0;
  return Math.round((metrics.correctAnswers / metrics.totalTrials) * 100);
};

// Assessment 4: Word Sequencing
export const scoreWordSequencing = (metrics: PerformanceMetrics): number => {
  if (metrics.totalTrials === 0) return 0;
  
  const baseScore = (metrics.correctAnswers / metrics.totalTrials) * 100;
  
  // Time_Penalty = Average_Time_Per_Word (in seconds) / 10
  const avgTimeSeconds = metrics.averageReactionTime / 1000;
  const timePenalty = avgTimeSeconds / 10;
  
  // Final_Score = Base_Score - Time_Penalty
  return Math.max(0, Math.min(100, Math.round(baseScore - timePenalty)));
};

// Assessment 6: Working Memory Span
export const scoreWorkingMemory = (metrics: PerformanceMetrics): number => {
  // Score = Maximum_Span_Length * 10
  const span = metrics.maxSpan || 0;
  return Math.min(100, span * 10);
};

// Assessment 7: Visual Processing Speed
export const scoreVisualProcessing = (metrics: PerformanceMetrics): number => {
  // Score = 100 - ((Average_Reaction_Time - 400) / 21)
  // Table floor is 5 for 2500ms+
  const score = 100 - ((metrics.averageReactionTime - 400) / 21);
  return Math.max(5, Math.min(100, Math.round(score)));
};