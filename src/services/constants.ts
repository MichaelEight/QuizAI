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

    OPEN QUESTION QUALITY:
    - Ask about ONE specific concept with a clear, bounded expected answer. Never ask the student to "summarize the text" or "list everything about X".
    - The question must be self-contained: answerable by someone who learned the material, in 1-4 sentences, without seeing any source.
    - Prefer "explain why/how", "what is the purpose of", "what distinguishes X from Y" over questions that just ask to reproduce a definition word-for-word.
  `;

  // Shared rule that prevents length/detail from giving away the correct answer.
  private static readonly ANSWER_BALANCE = `
    ANSWER BALANCE (avoid giveaways):
    - Keep all options (correct AND incorrect) similar in length and level of detail. The correct answer must NOT be the longest, most specific, or most elaborate option — length or detail should never reveal which one is correct.
    - SAME TEMPLATE & SPECIFICITY: every option (correct and incorrect) must follow the SAME sentence pattern and be EQUALLY specific and concrete. A distractor must name a specific thing exactly like the correct ones — never make a wrong option vaguer, more generic, hedged, or differently shaped than the correct ones. The form of an option must NEVER correlate with whether it is correct; the ONLY way to tell options apart must be subject knowledge.
      - BAD (form gives it away): correct options say "Port X is used by [specific protocol]" while the distractor says "Port X is a typical mail port". The odd, vaguer shape reveals the wrong answer.
      - GOOD: the distractor also says "Port X is used by [a specific NON-mail protocol]" — same template and specificity, wrong only on the facts.
    - Make distractors just as plausible and detailed as the correct answer, using the same phrasing style and grammatical form.
    - Most options should fall within a similar length range. Small variation is fine, but never let one option stand out as clearly longer than the rest.
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

    QUESTION PHRASING (must match the single-answer structure):
    - Word the question so it clearly calls for ONE answer (e.g. "What is...", "Which one of the following...", "What best describes...").
    - NEVER use plural / select-many phrasings like "Which of the following ARE...", "Which of these statements are true", or "Select all that apply" — those imply multiple correct answers and contradict a single-choice question.
${Instructions.ANSWER_BALANCE}
  `;
  }

  // Dynamic closed question with multiple answers instruction
  static getClosedQuestionMultipleAnswersInstruction(
    min: number,
    max: number,
  ): string {
    // Multiple-choice needs at least 3 options (2+ correct AND room to vary).
    const optMin = Math.max(3, min);
    const optMax = Math.max(optMin, max);
    const countSpec = Instructions.formatAnswerCount(optMin, optMax);
    return `
    Each closed question object must have:
    - "question": string,
    - "answers": array of ${countSpec} items (a multiple-choice question MUST have at least 3 options), where each item must be built in form: {"content": string, "isCorrect": boolean}

    CRITICAL REQUIREMENT - MULTIPLE CORRECT ANSWERS:
    Each question MUST have AT LEAST TWO answers with "isCorrect": true.
    VARY the number of correct answers from question to question: for EACH question independently pick a random count between 2 and the number of options in that question. Across the whole set, mix it up — some questions with 2 correct, some with 3, some with more. Do NOT mark the same number correct every time (e.g. NOT always 3).
    Never create a multiple-choice question with fewer than 3 options, or with only one correct answer.

    QUESTION PHRASING (must match the multiple-answer structure):
    - Word the question so it clearly signals that MORE THAN ONE answer is correct (e.g. "Which of the following ARE...", "Select ALL that apply", "Which of these are true?").
    - Ask which statements are CORRECT / TRUE about the subject. NEVER ask which statements are "consistent with / according to / supported by / found in the material/source/text" — judge correctness on the facts, not on matching a source.
    - The stem must NOT read like a single-answer question (avoid "What is the one...", "Which single...").
    - Make sure the correct options are genuinely, independently correct — not one true answer plus near-duplicates padded to reach two.
${Instructions.ANSWER_BALANCE}
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
// Global AI model — governs ALL AI usage (generation, grading, hints,
// explanations, chat, ...) unless a per-quiz override is supplied for a single
// generation. Stored separately from quiz settings so it is a clear, app-wide
// choice rather than a quiz-specific one.
export const GLOBAL_MODEL_STORAGE_KEY = "quizai_global_model";

export function getSelectedModel(): ModelId {
  try {
    const direct = localStorage.getItem(GLOBAL_MODEL_STORAGE_KEY);
    if (direct && direct in MODELS) {
      return direct as ModelId;
    }
    // One-time migration: the model used to live inside quiz settings.
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { model?: string };
      if (parsed?.model && parsed.model in MODELS) {
        localStorage.setItem(GLOBAL_MODEL_STORAGE_KEY, parsed.model);
        return parsed.model as ModelId;
      }
    }
  } catch {
    // ignore parse/storage errors, use default
  }
  return DEFAULT_MODEL;
}

export function setGlobalModel(model: ModelId): void {
  try {
    localStorage.setItem(GLOBAL_MODEL_STORAGE_KEY, model);
  } catch {
    // ignore storage errors
  }
}

// Per-quiz model override. "" / null means "follow the global model".
export const QUIZ_MODEL_OVERRIDE_STORAGE_KEY = "quizai_quiz_model";

export function getQuizModelOverride(): ModelId | "" {
  try {
    const raw = localStorage.getItem(QUIZ_MODEL_OVERRIDE_STORAGE_KEY);
    if (raw && raw in MODELS) return raw as ModelId;
  } catch {
    // ignore
  }
  return "";
}

export function setQuizModelOverride(model: ModelId | ""): void {
  try {
    if (model) localStorage.setItem(QUIZ_MODEL_OVERRIDE_STORAGE_KEY, model);
    else localStorage.removeItem(QUIZ_MODEL_OVERRIDE_STORAGE_KEY);
  } catch {
    // ignore
  }
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

// Universal quality rubric applied to EVERY generated question, regardless of
// type, difficulty, focus or style. This is the main defense against low-value
// or "giveaway" questions.
export const QUESTION_QUALITY_RULES = `
QUESTION QUALITY RULES (MANDATORY — every question must satisfy ALL of these):
1. SELF-CONTAINED: Test understanding of the SUBJECT MATTER. Each question must be answerable by someone who LEARNED the topic, without seeing any source. NEVER refer to the source in ANY way — do not mention "the text", "the passage", "the author", "the document", "the reading", "the excerpt", "the fragment", "the lecture", "the slides", "the material", "the source", "the content", "above", or "as mentioned" (in any language) in questions OR answers.
2. NO META / SOURCE-FRAMING: Never ask which statements are "correct according to / consistent with / based on / found in / mentioned in / true to / supported by" the source/material/text, nor which appeared in or were quoted from it, nor anything about its structure, order, length or formatting. Ask whether statements are simply CORRECT or TRUE about the subject — judged on the facts, not on matching a source. (FORBIDDEN: "Which statements are consistent with the material?", "Which of these appeared in the text?". CORRECT: "Which statements about X are true?")
3. ONE CLEAR POINT: Each question targets a single, well-defined idea and has exactly one reasonable interpretation. No compound, vague, or trick questions.
4. UNAMBIGUOUS CORRECTNESS: The correct option(s) must be indisputably correct based on the material; every distractor must be clearly incorrect on the merits — believable to someone who did not study, but wrong to someone who did. Never include a distractor that could be argued correct.
5. HONEST DISTRACTORS: No "All of the above", "None of the above", joke options, or absurd throwaways. Every option is a serious, on-topic candidate.
6. DISTINCT OPTIONS: All options are mutually exclusive and meaningfully different. No option may be a subset, superset, or restatement of another, and no two options may mean the same thing.
7. NO GIVEAWAYS: Never signal the answer through length, grammatical form, specificity, or by echoing words from the question. (See ANSWER BALANCE.)
8. NO DUPLICATES: Do not produce two questions that test the same fact or are paraphrases of each other within this set. Each question covers a different point.
9. STANDALONE ANSWERS: Each option is a complete, understandable statement on its own — never "the first one", "as above", or a bare disconnected fragment.
`;

// Language instructions for quiz generation
export const LANGUAGE_INSTRUCTIONS = {
  english: `LANGUAGE: Generate all questions and answers in ENGLISH.`,
  polish: `LANGUAGE: Generate all questions and answers in POLISH (Polski). All text output must be in Polish language.`,
  spanish: `LANGUAGE: Generate all questions and answers in SPANISH (Español). All text output must be in Spanish language.`,
  german: `LANGUAGE: Generate all questions and answers in GERMAN (Deutsch). All text output must be in German language.`,
} as const;
