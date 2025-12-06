export type Task = {
  id: string;
  question: Question;
  answers?: Answer[] | null;
  isDone?: boolean;
  isRetry?: boolean;  // True if this is a retry instance (failed before)
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
