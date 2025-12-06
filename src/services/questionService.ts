import { makeApiRequest } from './openaiClient';
import { QuestionTypes, QuestionType, PromptTypes } from './constants';
import { getSysPrompt, getDevPrompt, getUserPrompt } from './promptService';
import {
  generateSingleMultipleDistribution,
  correctTrailingComma,
} from './questionUtilities';
import { Task, Answer } from '../QuestionsTypes';
import { Settings } from '../SettingsType';

interface GeneratedQuestion {
  question: string;
  answers?: Array<{ content: string; isCorrect: boolean }>;
}

interface ErrorResponse {
  status: 'error';
  content: string;
}

type QuestionResponse = GeneratedQuestion[] | ErrorResponse;

async function generateQuestionsPerType(
  text: string,
  amount: number,
  type: QuestionType,
): Promise<QuestionResponse> {
  if (amount <= 0) {
    return [];
  }

  const sysPrompt = getSysPrompt(PromptTypes.GENERATE_QUESTIONS, {
    questionsAmount: amount,
    typeOfQuestion: type,
  });
  const userPrompt = getUserPrompt(PromptTypes.GENERATE_QUESTIONS, {
    userText: text,
  });

  try {
    const ans = await makeApiRequest(sysPrompt, '', userPrompt);
    const corrected = correctTrailingComma(ans);
    return JSON.parse(corrected) as QuestionResponse;
  } catch (error) {
    console.error('Error in generateQuestionsPerType:', error);
    return {
      status: 'error',
      content: 'invalid answer format',
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
  } = settings;

  try {
    // Generate open questions
    if (openAmount > 0) {
      const result = await generateQuestionsPerType(
        text,
        openAmount,
        QuestionTypes.OPEN,
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
    console.error('Error in generateQuestions:', error);
    return [];
  }
}

export async function checkOpenAnswer(
  text: string,
  question: string,
  answer: string,
  acceptedAnswer?: string,
): Promise<number> {
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
    const score = parseInt(ans, 10);

    if (isNaN(score) || score < 0 || score > 100) {
      console.error('Invalid score received:', ans);
      return -1;
    }

    return score;
  } catch (error) {
    console.error('Error in checkOpenAnswer:', error);
    return -1;
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
    console.error('Error in generateOpenQuestionAnswer:', error);
    return '';
  }
}
