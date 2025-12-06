// prettier-ignore
export type Settings = {
  amountOfClosedQuestions: number,
  amountOfOpenQuestions: number,
  allowMultipleCorrectAnswers: boolean,
  forceMultipleCorrectAnswers: boolean,
  // Pool settings
  defaultPoolSize: number,           // How many copies of each question start in pool (default: 2)
  failedOriginalCopies: number,      // Copies added when failing original question (default: 3)
  failedRetryCopies: number,         // Copies added when failing retry question (default: 2)
};

export type SettingsTypes = number | boolean;
