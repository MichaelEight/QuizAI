import { makeApiRequest } from "./openaiClient";
import { QuestionTypes, QuestionType, PromptTypes } from "./constants";
import { UsageContext } from "./usageLogger";
import { getSysPrompt, getDevPrompt, getUserPrompt } from "./promptService";
import {
  generateSingleMultipleDistribution,
  correctTrailingComma,
} from "./questionUtilities";
import {
  Task,
  Answer,
  ScoreBreakdownItem,
  ScoreBreakdownTemplate,
} from "../QuestionsTypes";
import {
  Settings,
  ContentFocus,
  DifficultyLevel,
  QuestionStyle,
  QuizLanguage,
} from "../SettingsType";

interface GeneratedQuestion {
  question: string;
  answers?: Array<{ content: string; isCorrect: boolean }>;
}

export interface CheckAnswerResult {
  score: number;
  breakdown: ScoreBreakdownItem[];
}

export interface ProgressEvent {
  stage: 'init' | 'attempt_start' | 'questions_received' | 'questions_validated' | 'type_complete' | 'all_complete';
  questionType?: QuestionType;  // 'open' | 'closed' | 'closed-multi'
  attempt?: number;             // 1, 2, or 3
  maxAttempts?: number;         // Always 3
  received?: number;            // Questions received this attempt
  total?: number;               // Total accumulated questions
  target?: number;              // Target question count
  filtered?: number;            // Questions filtered out (wrong type)
  typeName?: string;            // Human-readable: "Open", "Multiple Choice", "Select All"
}

export type ProgressCallback = (event: ProgressEvent) => void;

interface ErrorResponse {
  status: "error";
  content: string;
}

type QuestionResponse = GeneratedQuestion[] | ErrorResponse;

interface GenerationOptions {
  contentFocus: ContentFocus;
  difficultyLevel: DifficultyLevel;
  questionStyle: QuestionStyle;
  customInstructions: string;
  minAnswersPerQuestion: number;
  maxAnswersPerQuestion: number;
  quizLanguage: QuizLanguage;
  modelOverride?: string; // per-quiz model; falls back to global if empty
}

async function generateQuestionsPerType(
  text: string,
  amount: number,
  type: QuestionType,
  options: GenerationOptions,
  seenKeys: Set<string>,
  quizId?: string | null,
  quizTitle?: string | null,
  onProgress?: ProgressCallback,
): Promise<QuestionResponse> {
  if (amount <= 0) {
    return [];
  }

  const sysPrompt = getSysPrompt(PromptTypes.GENERATE_QUESTIONS, {
    questionsAmount: amount,
    typeOfQuestion: type,
    contentFocus: options.contentFocus,
    difficultyLevel: options.difficultyLevel,
    questionStyle: options.questionStyle,
    customInstructions: options.customInstructions,
    minAnswersPerQuestion: options.minAnswersPerQuestion,
    maxAnswersPerQuestion: options.maxAnswersPerQuestion,
    quizLanguage: options.quizLanguage,
  });
  const userPrompt = getUserPrompt(PromptTypes.GENERATE_QUESTIONS, {
    userText: text,
  });

  const usageContext: UsageContext = {
    quizId: quizId ?? null,
    quizTitle: quizTitle ?? null,
    operationType: "quiz_generation",
  };

  try {
    const ans = await makeApiRequest(sysPrompt, "", userPrompt, usageContext, options.modelOverride);
    const corrected = correctTrailingComma(ans);
    const parsed = JSON.parse(corrected) as QuestionResponse;

    // Validate and filter questions
    if (Array.isArray(parsed)) {
      return validateAndFilterQuestions(parsed, type, seenKeys, onProgress);
    }

    return parsed;
  } catch (error) {
    console.error("Error in generateQuestionsPerType:", error);
    return {
      status: "error",
      content: "invalid answer format",
    };
  }
}

async function generateQuestionsWithRetry(
  text: string,
  targetAmount: number,
  type: QuestionType,
  options: GenerationOptions,
  quizId?: string | null,
  quizTitle?: string | null,
  onProgress?: ProgressCallback,
): Promise<GeneratedQuestion[]> {
  const MAX_ATTEMPTS = 3;
  const accumulatedQuestions: GeneratedQuestion[] = [];
  // Shared across attempts so retries never reintroduce a duplicate question.
  const seenKeys = new Set<string>();
  let attempt = 0;

  // Human-readable type name
  const getTypeName = (questionType: QuestionType): string => {
    if (questionType === QuestionTypes.OPEN) return 'Open Questions';
    if (questionType === QuestionTypes.CLOSED_MULTI) return 'Multiple Choice Questions';
    return 'Single Choice Questions';
  };
  const typeName = getTypeName(type);

  while (attempt < MAX_ATTEMPTS && accumulatedQuestions.length < targetAmount) {
    attempt++;
    const remaining = targetAmount - accumulatedQuestions.length;

    // EMIT: Attempt started
    onProgress?.({
      stage: 'attempt_start',
      questionType: type,
      attempt,
      maxAttempts: MAX_ATTEMPTS,
      total: accumulatedQuestions.length,
      target: targetAmount,
      typeName,
    });

    console.log(`[Attempt ${attempt}/${MAX_ATTEMPTS}] Requesting ${remaining} ${type} questions...`);

    const result = await generateQuestionsPerType(text, remaining, type, options, seenKeys, quizId, quizTitle, onProgress);

    // Handle error responses
    if (!Array.isArray(result)) {
      console.error(`Attempt ${attempt} failed:`, result);
      continue;
    }

    // Accumulate valid questions
    if (result.length > 0) {
      accumulatedQuestions.push(...result);

      // EMIT: Questions received
      onProgress?.({
        stage: 'questions_received',
        questionType: type,
        attempt,
        maxAttempts: MAX_ATTEMPTS,
        received: result.length,
        total: accumulatedQuestions.length,
        target: targetAmount,
        typeName,
      });

      console.log(`  ✓ Got ${result.length} questions (total: ${accumulatedQuestions.length}/${targetAmount})`);
    } else {
      console.warn(`  ⚠ Attempt ${attempt} returned 0 questions`);
    }

    // Success - got enough questions
    if (accumulatedQuestions.length >= targetAmount) {
      break;
    }
  }

  // Trim to exact count if we got more than requested
  const finalQuestions = accumulatedQuestions.slice(0, targetAmount);

  if (finalQuestions.length < targetAmount) {
    console.warn(
      `After ${attempt} attempts, only generated ${finalQuestions.length}/${targetAmount} ${type} questions`
    );
  } else {
    console.log(`✓ Successfully generated ${finalQuestions.length} ${type} questions`);
  }

  // EMIT: Type complete
  onProgress?.({
    stage: 'type_complete',
    questionType: type,
    total: finalQuestions.length,
    target: targetAmount,
    typeName,
  });

  return finalQuestions;
}

// Normalized key for detecting duplicate / near-duplicate questions.
export function normalizeQuestionKey(question: string): string {
  return question
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics so "tekście" ~ "tekscie"
    .replace(/[^\p{L}\p{N}\s]/gu, "") // drop punctuation
    .replace(/\s+/g, " ")
    .trim();
}

// High-precision patterns for "meta" questions that test memory of the source
// wording instead of understanding (e.g. "which of these appeared in the text").
// These are a disaster for quiz quality, so we drop them as a backstop even if
// the prompt fails to prevent them.
const META_QUESTION_PATTERNS: readonly RegExp[] = [
  /\bin the (text|passage|reading|excerpt|document|article|material|source)\b/i,
  /\b(according to|consistent with|based on|supported by|true to) the (text|passage|author|document|reading|article|material|source|content)\b/i,
  /\b(appear|appeared|appears|mentioned|stated|listed|quoted|written|said)\b[^.?!]*\bin the (text|passage|reading|document|source|article)\b/i,
  /\bzgodn\w*\s+z\s+(materia[lł]\w*|tekstem|[zź]r[oó]d[lł]\w*|tre[sś]ci\w*)\b/i,
  /\bw\s+(powy[zż]szym\s+)?tek[sś]cie\b/i,
  /\bwed[lł]ug\s+tekstu\b/i,
  /\bwymienion\w*\s+w\s+tek[sś]cie\b/i,
  /\bz\s+powy[zż]szego\s+tekstu\b/i,
  /\ben el texto\b/i,
  /\bseg[uú]n el texto\b/i,
  /\bim text(e|es)?\b/i,
  /\blaut (dem )?text\b/i,
];

function isMetaQuestion(question: string): boolean {
  return META_QUESTION_PATTERNS.some((re) => re.test(question));
}

// Fisher-Yates shuffle (returns a new array) — removes answer-position bias.
function shuffle<T>(items: readonly T[]): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Clean a single question and reject it if it is structurally invalid or
// low-quality. Returns a sanitized copy, or null if it must be discarded.
function sanitizeQuestion(
  question: GeneratedQuestion,
  expectedType: QuestionType,
): GeneratedQuestion | null {
  const text = (question.question ?? "").trim();
  if (text.length < 8) return null; // empty / nonsense stub
  if (isMetaQuestion(text)) return null; // wording-recall giveaway

  const hasAnswers = Array.isArray(question.answers) && question.answers.length > 0;

  // Open questions carry no answers.
  if (expectedType === QuestionTypes.OPEN) {
    return { question: text }; // ignore any stray answers the model added
  }

  if (!hasAnswers) return null; // closed type but no options

  // De-duplicate and trim options.
  const cleaned: Array<{ content: string; isCorrect: boolean }> = [];
  const seen = new Set<string>();
  for (const a of question.answers!) {
    const content = (a?.content ?? "").trim();
    if (!content) continue;
    const key = content.toLowerCase().replace(/\s+/g, " ");
    if (seen.has(key)) continue; // drop duplicate option
    seen.add(key);
    cleaned.push({ content, isCorrect: Boolean(a?.isCorrect) });
  }

  if (cleaned.length < 2) return null; // need at least two distinct options
  const correctCount = cleaned.filter((a) => a.isCorrect).length;
  if (correctCount < 1) return null; // need at least one correct option

  if (expectedType === QuestionTypes.CLOSED_MULTI) {
    // Multiple-choice needs 3+ options and 2+ correct (count may vary up to all).
    if (cleaned.length < 3) return null;
    if (correctCount < 2) return null;
  } else if (expectedType === QuestionTypes.CLOSED) {
    // Single-choice: exactly one correct (guarantees a wrong option, len >= 2).
    if (correctCount !== 1) return null;
  } else if (correctCount === cleaned.length) {
    return null; // other closed types still need at least one wrong option
  }

  return { question: text, answers: shuffle(cleaned) };
}

function validateAndFilterQuestions(
  questions: GeneratedQuestion[],
  expectedType: QuestionType,
  seenKeys: Set<string>,
  onProgress?: ProgressCallback,
): GeneratedQuestion[] {
  const validated: GeneratedQuestion[] = [];
  for (const q of questions) {
    const cleaned = sanitizeQuestion(q, expectedType);
    if (!cleaned) continue;
    const key = normalizeQuestionKey(cleaned.question);
    if (seenKeys.has(key)) continue; // duplicate within set / across retries
    seenKeys.add(key);
    validated.push(cleaned);
  }

  if (validated.length < questions.length) {
    const filtered = questions.length - validated.length;

    // EMIT: Validation filtered some questions
    onProgress?.({
      stage: 'questions_validated',
      filtered,
    });

    console.warn(
      `Filtered ${filtered} low-quality/invalid/duplicate question(s) for type ${expectedType}.`
    );
  }

  return validated;
}

export async function generateQuestions(
  text: string,
  settings: Settings,
  quizId?: string | null,
  quizTitle?: string | null,
  onProgress?: ProgressCallback,
  modelOverride?: string,
): Promise<Task[]> {
  const allQuestions: GeneratedQuestion[] = [];

  const {
    amountOfOpenQuestions: openAmount,
    amountOfClosedQuestions: closedAmount,
    allowMultipleCorrectAnswers,
    forceMultipleCorrectAnswers,
    contentFocus,
    difficultyLevel,
    questionStyle,
    customInstructions,
    minAnswersPerQuestion = 4,
    maxAnswersPerQuestion = 4,
    quizLanguage = "english",
  } = settings;

  const generationOptions: GenerationOptions = {
    contentFocus,
    difficultyLevel,
    questionStyle,
    customInstructions,
    minAnswersPerQuestion,
    maxAnswersPerQuestion,
    quizLanguage,
    modelOverride,
  };

  // EMIT: Initialization
  onProgress?.({
    stage: 'init',
  });

  try {
    // Generate open questions
    if (openAmount > 0) {
      const result = await generateQuestionsWithRetry(
        text,
        openAmount,
        QuestionTypes.OPEN,
        generationOptions,
        quizId,
        quizTitle,
        onProgress,
      );
      allQuestions.push(...result);
    }

    // Generate closed questions
    if (closedAmount > 0) {
      if (forceMultipleCorrectAnswers) {
        const result = await generateQuestionsWithRetry(
          text,
          closedAmount,
          QuestionTypes.CLOSED_MULTI,
          generationOptions,
          quizId,
          quizTitle,
          onProgress,
        );
        allQuestions.push(...result);
      } else if (allowMultipleCorrectAnswers) {
        const [singleAmount, multipleAmount] =
          generateSingleMultipleDistribution(closedAmount);

        // Generate single-choice questions
        if (singleAmount > 0) {
          const singleResult = await generateQuestionsWithRetry(
            text,
            singleAmount,
            QuestionTypes.CLOSED,
            generationOptions,
            quizId,
            quizTitle,
            onProgress,
          );
          allQuestions.push(...singleResult);
        }

        // Generate multiple-choice questions
        if (multipleAmount > 0) {
          const multiResult = await generateQuestionsWithRetry(
            text,
            multipleAmount,
            QuestionTypes.CLOSED_MULTI,
            generationOptions,
            quizId,
            quizTitle,
            onProgress,
          );
          allQuestions.push(...multiResult);
        }
      } else {
        const result = await generateQuestionsWithRetry(
          text,
          closedAmount,
          QuestionTypes.CLOSED,
          generationOptions,
          quizId,
          quizTitle,
          onProgress,
        );
        allQuestions.push(...result);
      }
    }

    // EMIT: All complete
    onProgress?.({
      stage: 'all_complete',
    });

    // Convert to Task[] format with unique IDs
    return allQuestions.map(
      (item, index): Task => ({
        id: `q-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 9)}`,
        question: {
          value: item.question,
          isOpen: !item.answers || item.answers.length === 0,
        },
        answers: item.answers?.map(
          (a): Answer => ({
            value: a.content,
            isCorrect: a.isCorrect,
            isSelected: false,
          }),
        ),
      }),
    );
  } catch (error) {
    console.error("Error in generateQuestions:", error);
    return [];
  }
}

export async function checkOpenAnswer(
  text: string,
  question: string,
  answer: string,
  template: ScoreBreakdownTemplate,
  acceptedAnswer?: string,
  quizId?: string | null,
  quizTitle?: string | null,
): Promise<CheckAnswerResult> {
  const sysPrompt = getSysPrompt(PromptTypes.CHECK_OPEN_QUESTION);
  const devPrompt = getDevPrompt(PromptTypes.CHECK_OPEN_QUESTION, {
    text,
    question,
    template,
    acceptedAnswer,
  });
  const userPrompt = getUserPrompt(PromptTypes.CHECK_OPEN_QUESTION, {
    answer,
  });

  const usageContext: UsageContext = {
    quizId: quizId ?? null,
    quizTitle: quizTitle ?? null,
    operationType: "open_answer_grading",
  };

  try {
    const ans = await makeApiRequest(sysPrompt, devPrompt, userPrompt, usageContext);

    // Parse JSON response
    const parsed = JSON.parse(ans);
    const breakdown: ScoreBreakdownItem[] = Array.isArray(parsed.breakdown)
      ? parsed.breakdown.map(
          (item: {
            points: number;
            type?: string;
            reason: string;
            templateIndex?: number;
          }) => ({
            points: item.points,
            type:
              item.type === "achieved" ||
              item.type === "missed" ||
              item.type === "incorrect"
                ? item.type
                : item.points >= 0
                  ? "achieved"
                  : "incorrect", // fallback for old format
            reason: item.reason,
            templateIndex: item.templateIndex,
          }),
        )
      : [];

    // Validate and cap negative points at -50
    const negativeTotal = breakdown
      .filter((item) => item.type === "incorrect")
      .reduce((sum, item) => sum + item.points, 0);

    if (negativeTotal < -50) {
      console.warn(
        `Negative points (${negativeTotal}) exceed -50 cap, adjusting...`,
      );
      // Proportionally scale down negative points
      const scale = -50 / negativeTotal;
      breakdown.forEach((item) => {
        if (item.type === "incorrect") {
          item.points = Math.round(item.points * scale);
        }
      });
    }

    // Calculate score: sum of achieved points + incorrect penalties (already capped)
    // Missed items don't count toward score (they show what was missing)
    let calculatedScore = breakdown.reduce((sum, item) => {
      if (item.type === "achieved") return sum + item.points;
      if (item.type === "incorrect") return sum + item.points; // points are already negative
      return sum; // 'missed' items don't affect score
    }, 0);
    // Clamp to 0-100 range
    calculatedScore = Math.max(0, Math.min(100, calculatedScore));

    return { score: calculatedScore, breakdown };
  } catch (error) {
    console.error("Error in checkOpenAnswer:", error);
    return { score: -1, breakdown: [] };
  }
}

export async function generateScoreTemplate(
  text: string,
  question: string,
  quizId?: string | null,
  quizTitle?: string | null,
): Promise<ScoreBreakdownTemplate> {
  const sysPrompt = getSysPrompt(PromptTypes.GENERATE_SCORE_TEMPLATE);
  const devPrompt = getDevPrompt(PromptTypes.GENERATE_SCORE_TEMPLATE, {
    text,
    question,
  });
  const userPrompt = getUserPrompt(PromptTypes.GENERATE_SCORE_TEMPLATE);

  const usageContext: UsageContext = {
    quizId: quizId ?? null,
    quizTitle: quizTitle ?? null,
    operationType: "score_rubric_generation",
  };

  try {
    const ans = await makeApiRequest(sysPrompt, devPrompt, userPrompt, usageContext);
    const parsed = JSON.parse(ans);

    // Validate template structure
    if (!parsed.template || !Array.isArray(parsed.template)) {
      console.error("Invalid template structure:", parsed);
      return [];
    }

    const template: ScoreBreakdownTemplate = parsed.template.map(
      (item: { points: number; description: string }) => ({
        points: item.points,
        description: item.description,
      }),
    );

    // Validate points sum to ~100 (allow 95-105 range for flexibility)
    const totalPoints = template.reduce((sum, item) => sum + item.points, 0);
    if (totalPoints < 95 || totalPoints > 105) {
      console.warn(`Template points sum to ${totalPoints}, expected ~100`);
    }

    return template;
  } catch (error) {
    console.error("Error in generateScoreTemplate:", error);
    return [];
  }
}

export async function generateOpenQuestionAnswer(
  text: string,
  question: string,
  template?: ScoreBreakdownTemplate,
  quizId?: string | null,
  quizTitle?: string | null,
): Promise<string> {
  const sysPrompt = getSysPrompt(PromptTypes.GENERATE_OPEN_ANSWER);
  const devPrompt = getDevPrompt(PromptTypes.GENERATE_OPEN_ANSWER, {
    text,
    question,
    template,
  });
  const userPrompt = getUserPrompt(PromptTypes.GENERATE_OPEN_ANSWER);

  const usageContext: UsageContext = {
    quizId: quizId ?? null,
    quizTitle: quizTitle ?? null,
    operationType: "answer_generation",
  };

  try {
    const answer = await makeApiRequest(sysPrompt, devPrompt, userPrompt, usageContext);
    return answer.trim();
  } catch (error) {
    console.error("Error in generateOpenQuestionAnswer:", error);
    return "";
  }
}

export async function generateHint(
  text: string,
  question: string,
  questionStyle: QuestionStyle = "conceptual",
  correctAnswers: string[] = [],
  quizId?: string | null,
  quizTitle?: string | null,
): Promise<string> {
  const sysPrompt = getSysPrompt(PromptTypes.GENERATE_HINT, {
    questionStyle,
  });
  const devPrompt = getDevPrompt(PromptTypes.GENERATE_HINT, {
    text,
    question,
    correctAnswers,
  });
  const userPrompt = getUserPrompt(PromptTypes.GENERATE_HINT);

  const usageContext: UsageContext = {
    quizId: quizId ?? null,
    quizTitle: quizTitle ?? null,
    operationType: "hint_generation",
  };

  try {
    const hint = await makeApiRequest(sysPrompt, devPrompt, userPrompt, usageContext);
    return hint.trim();
  } catch (error) {
    console.error("Error in generateHint:", error);
    return "";
  }
}

export async function generateExplanation(
  text: string,
  question: string,
  correctAnswers: string[],
  quizId?: string | null,
  quizTitle?: string | null,
): Promise<string> {
  const sysPrompt = getSysPrompt(PromptTypes.GENERATE_EXPLANATION);
  const devPrompt = getDevPrompt(PromptTypes.GENERATE_EXPLANATION, {
    text,
    question,
    correctAnswers,
  });
  const userPrompt = getUserPrompt(PromptTypes.GENERATE_EXPLANATION);

  const usageContext: UsageContext = {
    quizId: quizId ?? null,
    quizTitle: quizTitle ?? null,
    operationType: "explanation_generation",
  };

  try {
    const explanation = await makeApiRequest(sysPrompt, devPrompt, userPrompt, usageContext);
    return explanation.trim();
  } catch (error) {
    console.error("Error in generateExplanation:", error);
    return "";
  }
}
