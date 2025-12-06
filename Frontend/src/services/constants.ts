// Prompt type identifiers
export class PromptTypes {
  static readonly GENERATE_QUESTIONS = 'generate-questions' as const;
  static readonly CHECK_OPEN_QUESTION = 'check-open-question' as const;
}

export type PromptType = typeof PromptTypes[keyof typeof PromptTypes];

// Prompt role ranks for OpenAI API
export class PromptRank {
  static readonly SYSTEM = 'system' as const;
  static readonly DEVELOPER = 'developer' as const;
  static readonly USER = 'user' as const;
}

export type PromptRankType = typeof PromptRank[keyof typeof PromptRank];

// Question type identifiers
export class QuestionTypes {
  static readonly CLOSED = 'closed' as const;
  static readonly OPEN = 'open' as const;
  static readonly CLOSED_MULTI = 'closed-multi' as const;
}

export type QuestionType = typeof QuestionTypes[keyof typeof QuestionTypes];

// Instructions for question generation prompts
export class Instructions {
  static readonly CLOSED_QUESTION = `
    Each closed question object must have:
    - "question": string,
    - "answers": array of exactly 4 items, where each item must be built in form: {"content": string, "isCorrect": boolean}
    Each answer must have exactly one "isCorrect": true property and three "isCorrect": false properties.
  `;

  static readonly CLOSED_QUESTION_MULTIPLE_ANSWERS = `
    Each closed question object must have:
    - "question": string,
    - "answers": array of exactly 4 items, where each item must be built in form: {"content": string, "isCorrect": boolean}
    There must be at least two "isCorrect": true properties and not more than three "isCorrect": false properties.
    There can be 2, 3 or 4 "isCorrect": true properties.
  `;

  static readonly OPEN_QUESTION = `
    Each open question object must have:
    - "question": string
  `;

  static getInstruction(typeOfQuestion: QuestionType): string {
    switch (typeOfQuestion) {
      case QuestionTypes.CLOSED:
        return Instructions.CLOSED_QUESTION;
      case QuestionTypes.OPEN:
        return Instructions.OPEN_QUESTION;
      case QuestionTypes.CLOSED_MULTI:
        return Instructions.CLOSED_QUESTION_MULTIPLE_ANSWERS;
      default:
        return '';
    }
  }
}

// Storage constants
export const OPENAI_API_KEY_STORAGE_KEY = 'openai_api_key';
export const DEFAULT_MODEL = 'gpt-4o-mini';

// Utility constants
export const TRAILING_COMMA_REGEX = /,\s*([\]\}])/g;
