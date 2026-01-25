import { makeApiRequest } from "./openaiClient";
import { QuestionTypes, QuestionType, PromptTypes } from "./constants";
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
}

async function generateQuestionsPerType(
  text: string,
  amount: number,
  type: QuestionType,
  options: GenerationOptions,
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

  try {
    const ans = await makeApiRequest(sysPrompt, "", userPrompt);
    const corrected = correctTrailingComma(ans);
    const parsed = JSON.parse(corrected) as QuestionResponse;

    // Validate and filter questions
    if (Array.isArray(parsed)) {
      return validateAndFilterQuestions(parsed, type);
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
): Promise<GeneratedQuestion[]> {
  const MAX_ATTEMPTS = 3;
  const accumulatedQuestions: GeneratedQuestion[] = [];
  let attempt = 0;

  while (attempt < MAX_ATTEMPTS && accumulatedQuestions.length < targetAmount) {
    attempt++;
    const remaining = targetAmount - accumulatedQuestions.length;

    console.log(`[Attempt ${attempt}/${MAX_ATTEMPTS}] Requesting ${remaining} ${type} questions...`);

    const result = await generateQuestionsPerType(text, remaining, type, options);

    // Handle error responses
    if (!Array.isArray(result)) {
      console.error(`Attempt ${attempt} failed:`, result);
      continue;
    }

    // Accumulate valid questions
    if (result.length > 0) {
      accumulatedQuestions.push(...result);
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

  return finalQuestions;
}

function validateQuestionType(
  question: GeneratedQuestion,
  expectedType: string
): boolean {
  if (!question.answers || question.answers.length === 0) {
    return true; // Open question, no validation needed
  }

  const correctCount = question.answers.filter(a => a.isCorrect).length;

  if (expectedType === QuestionTypes.CLOSED) {
    // Single choice: must have exactly 1 correct answer
    return correctCount === 1;
  } else if (expectedType === QuestionTypes.CLOSED_MULTI) {
    // Multiple choice: must have 2+ correct answers
    return correctCount >= 2;
  }

  return true;
}

function validateAndFilterQuestions(
  questions: GeneratedQuestion[],
  expectedType: string
): GeneratedQuestion[] {
  const validated = questions.filter(q => validateQuestionType(q, expectedType));

  if (validated.length < questions.length) {
    console.warn(
      `AI generated ${questions.length - validated.length} questions that don't match expected type ${expectedType}. ` +
      `Filtered them out.`
    );
  }

  return validated;
}

export async function generateQuestions(
  text: string,
  settings: Settings,
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
  };

  try {
    // Generate open questions
    if (openAmount > 0) {
      const result = await generateQuestionsWithRetry(
        text,
        openAmount,
        QuestionTypes.OPEN,
        generationOptions,
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
          );
          allQuestions.push(...multiResult);
        }
      } else {
        const result = await generateQuestionsWithRetry(
          text,
          closedAmount,
          QuestionTypes.CLOSED,
          generationOptions,
        );
        allQuestions.push(...result);
      }
    }

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

  try {
    const ans = await makeApiRequest(sysPrompt, devPrompt, userPrompt);

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
): Promise<ScoreBreakdownTemplate> {
  const sysPrompt = getSysPrompt(PromptTypes.GENERATE_SCORE_TEMPLATE);
  const devPrompt = getDevPrompt(PromptTypes.GENERATE_SCORE_TEMPLATE, {
    text,
    question,
  });
  const userPrompt = getUserPrompt(PromptTypes.GENERATE_SCORE_TEMPLATE);

  try {
    const ans = await makeApiRequest(sysPrompt, devPrompt, userPrompt);
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
): Promise<string> {
  const sysPrompt = getSysPrompt(PromptTypes.GENERATE_OPEN_ANSWER);
  const devPrompt = getDevPrompt(PromptTypes.GENERATE_OPEN_ANSWER, {
    text,
    question,
    template,
  });
  const userPrompt = getUserPrompt(PromptTypes.GENERATE_OPEN_ANSWER);

  try {
    const answer = await makeApiRequest(sysPrompt, devPrompt, userPrompt);
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
): Promise<string> {
  const sysPrompt = getSysPrompt(PromptTypes.GENERATE_HINT, {
    questionStyle,
  });
  const devPrompt = getDevPrompt(PromptTypes.GENERATE_HINT, {
    text,
    question,
  });
  const userPrompt = getUserPrompt(PromptTypes.GENERATE_HINT);

  try {
    const hint = await makeApiRequest(sysPrompt, devPrompt, userPrompt);
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
): Promise<string> {
  const sysPrompt = getSysPrompt(PromptTypes.GENERATE_EXPLANATION);
  const devPrompt = getDevPrompt(PromptTypes.GENERATE_EXPLANATION, {
    text,
    question,
    correctAnswers,
  });
  const userPrompt = getUserPrompt(PromptTypes.GENERATE_EXPLANATION);

  try {
    const explanation = await makeApiRequest(sysPrompt, devPrompt, userPrompt);
    return explanation.trim();
  } catch (error) {
    console.error("Error in generateExplanation:", error);
    return "";
  }
}
