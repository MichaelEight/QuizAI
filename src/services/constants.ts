// Prompt type identifiers
export class PromptTypes {
  static readonly GENERATE_QUESTIONS = 'generate-questions' as const;
  static readonly CHECK_OPEN_QUESTION = 'check-open-question' as const;
  static readonly GENERATE_OPEN_ANSWER = 'generate-open-answer' as const;
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

// Content focus instructions with examples
export const CONTENT_FOCUS_INSTRUCTIONS = {
  all: '',
  important: `IMPORTANT: Focus on the most important, substantive content in the text. Prioritize:
- Core concepts, theories, and technical information
- Key definitions and terminology
- Main arguments and conclusions
- Practical applications and examples
SKIP or deprioritize:
- Administrative information (course rules, grading policies, schedules)
- Introductory/filler content
- Repetitive or redundant information
- Meta-commentary about the document itself

EXAMPLE - Given text: "Photosynthesis converts sunlight into chemical energy in chloroplasts. Dr. Jan Ingenhousz described this in 1779 in Vienna. The process produces glucose and oxygen."
- GOOD question (important): "What do chloroplasts produce during photosynthesis?"
- BAD question (unimportant): "In what year was photosynthesis first described?"`,
} as const;

// Difficulty level instructions with examples
export const DIFFICULTY_INSTRUCTIONS = {
  mixed: '',
  easy: `Generate EASY questions only. Focus on:
- Direct recall of facts and definitions
- Simple "what is" or "who/what/when" questions
- Information explicitly stated in text
- Single-concept questions

EXAMPLE - Given text: "Photosynthesis converts sunlight into chemical energy in chloroplasts."
- EASY question: "What do plants convert sunlight into?" Answer: "Chemical energy"`,
  medium: `Generate MEDIUM difficulty questions. Focus on:
- Understanding relationships between concepts
- "Why" and "how" questions
- Comparing or contrasting ideas
- Applying concepts to given scenarios

EXAMPLE - Given text: "Photosynthesis occurs in chloroplasts, where chlorophyll absorbs light to produce glucose and oxygen."
- MEDIUM question: "What role do chloroplasts play in photosynthesis?" Answer: "They contain chlorophyll that absorbs light for the reaction"`,
  hard: `Generate HARD questions only. Focus on:
- Analysis and synthesis of multiple concepts
- Edge cases and exceptions
- Implicit information requiring inference
- Application to novel scenarios
- Questions that require deep understanding

EXAMPLE - Given text: "Photosynthesis produces glucose and oxygen as byproducts, which are essential for most life on Earth."
- HARD question: "Why are the byproducts of photosynthesis essential for life on Earth?" Answer: "Glucose provides energy for organisms, oxygen enables cellular respiration"`,
} as const;
