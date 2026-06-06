// Prompt type identifiers
export class PromptTypes {
  static readonly GENERATE_QUESTIONS = "generate-questions" as const;
  static readonly CHECK_OPEN_QUESTION = "check-open-question" as const;
  static readonly GENERATE_OPEN_ANSWER = "generate-open-answer" as const;
  static readonly GENERATE_SCORE_TEMPLATE = "generate-score-template" as const;
  static readonly GENERATE_HINT = "generate-hint" as const;
  static readonly GENERATE_EXPLANATION = "generate-explanation" as const;
}

export type PromptType = (typeof PromptTypes)[keyof typeof PromptTypes];

// Prompt role ranks for OpenAI API
export class PromptRank {
  static readonly SYSTEM = "system" as const;
  static readonly DEVELOPER = "developer" as const;
  static readonly USER = "user" as const;
}

export type PromptRankType = (typeof PromptRank)[keyof typeof PromptRank];

// Question type identifiers
export class QuestionTypes {
  static readonly CLOSED = "closed" as const;
  static readonly OPEN = "open" as const;
  static readonly CLOSED_MULTI = "closed-multi" as const;
}

export type QuestionType = (typeof QuestionTypes)[keyof typeof QuestionTypes];

// Instructions for question generation prompts
export class Instructions {
  static readonly OPEN_QUESTION = `
    Each open question object must have:
    - "question": string
  `;

  // Helper to format answer count specification
  private static formatAnswerCount(min: number, max: number): string {
    if (min === max) {
      return `exactly ${min}`;
    }
    return `between ${min} and ${max}`;
  }

  // Dynamic closed question instruction
  static getClosedQuestionInstruction(min: number, max: number): string {
    const countSpec = Instructions.formatAnswerCount(min, max);
    const incorrectCount = min === max ? `${min - 1}` : `the remaining`;
    return `
    Each closed question object must have:
    - "question": string,
    - "answers": array of ${countSpec} items, where each item must be built in form: {"content": string, "isCorrect": boolean}

    CRITICAL REQUIREMENT - SINGLE CORRECT ANSWER ONLY:
    Each question MUST have EXACTLY ONE answer with "isCorrect": true.
    All other ${incorrectCount} answers MUST have "isCorrect": false.
    Do NOT create questions with multiple correct answers.
  `;
  }

  // Dynamic closed question with multiple answers instruction
  static getClosedQuestionMultipleAnswersInstruction(
    min: number,
    max: number,
  ): string {
    const countSpec = Instructions.formatAnswerCount(min, max);
    const maxCorrect = min === max ? min : max;
    return `
    Each closed question object must have:
    - "question": string,
    - "answers": array of ${countSpec} items, where each item must be built in form: {"content": string, "isCorrect": boolean}

    CRITICAL REQUIREMENT - MULTIPLE CORRECT ANSWERS:
    Each question MUST have AT LEAST TWO answers with "isCorrect": true.
    You can have 2 to ${maxCorrect} correct answers, with the remaining being "isCorrect": false.
    Do NOT create questions with only one correct answer.
  `;
  }

  static getInstruction(
    typeOfQuestion: QuestionType,
    minAnswers: number = 4,
    maxAnswers: number = 4,
  ): string {
    switch (typeOfQuestion) {
      case QuestionTypes.CLOSED:
        return Instructions.getClosedQuestionInstruction(
          minAnswers,
          maxAnswers,
        );
      case QuestionTypes.OPEN:
        return Instructions.OPEN_QUESTION;
      case QuestionTypes.CLOSED_MULTI:
        return Instructions.getClosedQuestionMultipleAnswersInstruction(
          minAnswers,
          maxAnswers,
        );
      default:
        return "";
    }
  }
}

// Storage constants
export const OPENAI_API_KEY_STORAGE_KEY = "openai_api_key";
// Must match STORAGE_KEYS.SETTINGS in App.tsx (settings persisted here)
export const SETTINGS_STORAGE_KEY = "quizai_settings";

// Selectable OpenAI models
export type ModelId =
  | "gpt-4o-mini"
  | "gpt-5.4-nano"
  | "gpt-5.4-mini"
  | "gpt-5.4"
  | "gpt-5.5";

export const DEFAULT_MODEL: ModelId = "gpt-4o-mini";

export interface ModelInfo {
  id: ModelId;
  label: string;
  description: string;
  // Standard (short-context, non-cached) pricing per 1M tokens — used for estimates and usage cost
  inputCostPer1M: number;
  outputCostPer1M: number;
  // NOTE: context windows for gpt-5.x are assumptions (only pricing was provided).
  // Adjust here if the real limits differ.
  contextWindow: number;
}

// Single source of truth for model metadata. Ordered cheapest -> most capable.
export const MODELS: Record<ModelId, ModelInfo> = {
  "gpt-4o-mini": {
    id: "gpt-4o-mini",
    label: "GPT-4o mini",
    description: "Cheapest and fast. Good for simple texts.",
    inputCostPer1M: 0.15,
    outputCostPer1M: 0.6,
    contextWindow: 128_000,
  },
  "gpt-5.4-nano": {
    id: "gpt-5.4-nano",
    label: "GPT-5.4 nano",
    description: "Very cheap and fast. A step up from 4o mini.",
    inputCostPer1M: 0.2,
    outputCostPer1M: 1.25,
    contextWindow: 400_000,
  },
  "gpt-5.4-mini": {
    id: "gpt-5.4-mini",
    label: "GPT-5.4 mini",
    description: "Balanced cost and quality.",
    inputCostPer1M: 0.75,
    outputCostPer1M: 4.5,
    contextWindow: 400_000,
  },
  "gpt-5.4": {
    id: "gpt-5.4",
    label: "GPT-5.4",
    description: "High quality. Best for complex material.",
    inputCostPer1M: 2.5,
    outputCostPer1M: 15.0,
    contextWindow: 400_000,
  },
  "gpt-5.5": {
    id: "gpt-5.5",
    label: "GPT-5.5",
    description: "Top quality. Most expensive.",
    inputCostPer1M: 5.0,
    outputCostPer1M: 30.0,
    contextWindow: 400_000,
  },
};

// Dropdown order
export const MODEL_LIST: ModelInfo[] = [
  MODELS["gpt-4o-mini"],
  MODELS["gpt-5.4-nano"],
  MODELS["gpt-5.4-mini"],
  MODELS["gpt-5.4"],
  MODELS["gpt-5.5"],
];

// OpenAI Pricing (per 1M tokens) — alias kept for backward compatibility (usageLogger)
export const PRICING = MODELS;

/**
 * Read the user-selected model from persisted settings.
 * Used by services that have no access to React state (e.g. openaiClient).
 * Falls back to DEFAULT_MODEL if missing or invalid.
 */
export function getSelectedModel(): ModelId {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { model?: string };
      if (parsed?.model && parsed.model in MODELS) {
        return parsed.model as ModelId;
      }
    }
  } catch {
    // ignore parse/storage errors, use default
  }
  return DEFAULT_MODEL;
}

// Utility constants
export const TRAILING_COMMA_REGEX = /,\s*([\]}])/g;

// Content focus instructions with examples
export const CONTENT_FOCUS_INSTRUCTIONS = {
  all: "",
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
  mixed: "",
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

// Question style instructions
export const QUESTION_STYLE_INSTRUCTIONS = {
  conceptual: `IMPORTANT - CONCEPTUAL STYLE: Test understanding of CONCEPTS, not recall of text location.
- Ask about the PURPOSE, FUNCTION, MECHANISM, or MEANING of concepts
- DO NOT phrase questions as "What does the text say about X?" or "According to the text, what is X?"
- DO NOT reference the text location like "Look at the section that describes..."
- Instead ask: "What is the purpose of X?", "How does X work?", "What are the characteristics of X?"

EXAMPLES:
- BAD: "What methods are mentioned in the text?"
- GOOD: "What are the methods used for X?"
- BAD: "According to the text, what is photosynthesis?"
- GOOD: "What is the purpose of photosynthesis?"
- BAD: "Look at the section describing HTTP methods. Which ones are listed?"
- GOOD: "What HTTP methods are commonly used for data retrieval?"`,
  "text-based": `TEXT-BASED STYLE: Questions may reference the text directly.
- Can ask "What does the text say about X?"
- Can reference specific sections or parts of the text
- Focus on recall of what was written`,
} as const;

// Language instructions for quiz generation
export const LANGUAGE_INSTRUCTIONS = {
  english: `LANGUAGE: Generate all questions and answers in ENGLISH.`,
  polish: `LANGUAGE: Generate all questions and answers in POLISH (Polski). All text output must be in Polish language.`,
  spanish: `LANGUAGE: Generate all questions and answers in SPANISH (Español). All text output must be in Spanish language.`,
  german: `LANGUAGE: Generate all questions and answers in GERMAN (Deutsch). All text output must be in German language.`,
} as const;
