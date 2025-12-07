// prettier-ignore
export type ContentFocus = 'all' | 'important';
export type DifficultyLevel = 'mixed' | 'easy' | 'medium' | 'hard';

export type Settings = {
  amountOfClosedQuestions: number,
  amountOfOpenQuestions: number,
  allowMultipleCorrectAnswers: boolean,
  forceMultipleCorrectAnswers: boolean,
  // Pool settings
  defaultPoolSize: number,           // How many copies of each question start in pool (default: 2)
  failedOriginalCopies: number,      // Copies added when failing original question (default: 3)
  failedRetryCopies: number,         // Copies added when failing retry question (default: 2)
  // Question generation settings
  contentFocus: ContentFocus,        // Focus on all content or important parts only
  difficultyLevel: DifficultyLevel,  // Question difficulty level
  customInstructions: string,        // Custom instructions appended to prompt
};

export type SettingsTypes = number | boolean | string;
