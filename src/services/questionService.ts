import { makeApiRequest } from "./openaiClient";
import { QuestionTypes, QuestionType, PromptTypes } from "./constants";
import { getSysPrompt, getDevPrompt, getUserPrompt } from "./promptService";
import {
  generateSingleMultipleDistribution,
  correctTrailingComma,
} from "./questionUtilities";
import { Task, Answer, ScoreBreakdownItem } from "../QuestionsTypes";
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
    return JSON.parse(corrected) as QuestionResponse;
  } catch (error) {
    console.error("Error in generateQuestionsPerType:", error);
    return {
      status: "error",
      content: "invalid answer format",
    };
  }
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
      const result = await generateQuestionsPerType(
        text,
        openAmount,
        QuestionTypes.OPEN,
        generationOptions,
      );
      if (Array.isArray(result)) {
        allQuestions.push(...result);
      }
    }

    // Generate closed questions
    if (closedAmount > 0) {
      if (forceMultipleCorrectAnswers) {
        const result = await generateQuestionsPerType(
          text,
          closedAmount,
          QuestionTypes.CLOSED_MULTI,
          generationOptions,
        );
        if (Array.isArray(result)) {
          allQuestions.push(...result);
        }
      } else if (allowMultipleCorrectAnswers) {
        const [singleAmount, multipleAmount] =
          generateSingleMultipleDistribution(closedAmount);

        if (singleAmount > 0) {
          const singleResult = await generateQuestionsPerType(
            text,
            singleAmount,
            QuestionTypes.CLOSED,
            generationOptions,
          );
          if (Array.isArray(singleResult)) {
            allQuestions.push(...singleResult);
          }
        }

        if (multipleAmount > 0) {
          const multiResult = await generateQuestionsPerType(
            text,
            multipleAmount,
            QuestionTypes.CLOSED_MULTI,
            generationOptions,
          );
          if (Array.isArray(multiResult)) {
            allQuestions.push(...multiResult);
          }
        }
      } else {
        const result = await generateQuestionsPerType(
          text,
          closedAmount,
          QuestionTypes.CLOSED,
          generationOptions,
        );
        if (Array.isArray(result)) {
          allQuestions.push(...result);
        }
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
  acceptedAnswer?: string,
): Promise<CheckAnswerResult> {
  const sysPrompt = getSysPrompt(PromptTypes.CHECK_OPEN_QUESTION);
  const devPrompt = getDevPrompt(PromptTypes.CHECK_OPEN_QUESTION, {
    text,
    question,
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
          (item: { points: number; type?: string; reason: string }) => ({
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
          }),
        )
      : [];

    // Calculate score: sum of achieved points minus incorrect penalties
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

export async function generateOpenQuestionAnswer(
  text: string,
  question: string,
): Promise<string> {
  const sysPrompt = getSysPrompt(PromptTypes.GENERATE_OPEN_ANSWER);
  const devPrompt = getDevPrompt(PromptTypes.GENERATE_OPEN_ANSWER, {
    text,
    question,
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
