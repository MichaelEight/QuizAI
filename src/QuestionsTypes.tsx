// TODO: PERSISTENCE - Answer overrides and removed questions are stored
// in localStorage via tasks array. For future import/export:
// - Export should include answerOverride and isRemoved fields
// - Import should preserve user corrections
// - Consider versioned export format for compatibility

export type ScoreBreakdownTemplateItem = {
  points: number; // Positive value (part of 100 total)
  description: string; // What this point represents
};

export type ScoreBreakdownTemplate = ScoreBreakdownTemplateItem[];

export type ScoreBreakdownItem = {
  points: number; // Points value (positive for achieved, negative for incorrect, potential value for missed)
  type: "achieved" | "missed" | "incorrect"; // achieved=got points, missed=didn't mention, incorrect=wrong info
  reason: string; // Brief explanation
  templateIndex?: number; // Optional: links to template item (undefined for "incorrect" items)
};

export type AnswerOverride = {
  correctAnswerIndices?: number[]; // For closed: which answers are correct
  acceptedOpenAnswer?: string; // For open: user's accepted answer text
  generatedOpenAnswer?: string; // For open: cached AI-generated expected answer
  hint?: string; // Cached hint for this question
  explanation?: string; // Cached explanation for this question
  scoreBreakdown?: ScoreBreakdownItem[]; // Breakdown of how score was calculated (results from checking)
  scoreTemplate?: ScoreBreakdownTemplate; // Predefined template for this question (positive points summing to 100)
  overriddenAt: number; // Timestamp
};

export type Task = {
  id: string;
  question: Question;
  answers?: Answer[] | null;
  isDone?: boolean;
  isRetry?: boolean; // True if this is a retry instance (failed before)
  isRemoved?: boolean; // True if user removed this question
  answerOverride?: AnswerOverride; // Override data if user marked as correct
};

export type Question = {
  value: string;
  isOpen: boolean;
};

export type Answer = {
  value: string;
  isCorrect: boolean;
  isSelected?: boolean;
};
