// TODO: PERSISTENCE - Answer overrides and removed questions are stored
// in localStorage via tasks array. For future import/export:
// - Export should include answerOverride and isRemoved fields
// - Import should preserve user corrections
// - Consider versioned export format for compatibility

export type AnswerOverride = {
  correctAnswerIndices?: number[];    // For closed: which answers are correct
  acceptedOpenAnswer?: string;         // For open: user's accepted answer text
  generatedOpenAnswer?: string;        // For open: cached AI-generated expected answer
  hint?: string;                       // Cached hint for this question
  explanation?: string;                // Cached explanation for this question
  overriddenAt: number;                // Timestamp
};

export type Task = {
  id: string;
  question: Question;
  answers?: Answer[] | null;
  isDone?: boolean;
  isRetry?: boolean;  // True if this is a retry instance (failed before)
  isRemoved?: boolean;                 // True if user removed this question
  answerOverride?: AnswerOverride;     // Override data if user marked as correct
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
