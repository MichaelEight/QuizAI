export type Task = {
  id: string;
  question: Question;
  answers?: Answer[] | null;
  isDone?: boolean;
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
