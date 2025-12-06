import { Task } from "./QuestionsTypes";
import { Settings } from "./SettingsType";
import {
  generateQuestions as generateQuestionsService,
  checkOpenAnswer as checkOpenAnswerService,
  generateOpenQuestionAnswer as generateOpenQuestionAnswerService,
} from "./services/questionService";

export async function checkOpenAnswer(
  text: string,
  question: string,
  answer: string,
  acceptedAnswer?: string,
): Promise<number> {
  if (!text || !question) {
    throw new Error(
      "Missing required values: 'text' and 'question' are required.",
    );
  }

  try {
    const result = await checkOpenAnswerService(text, question, answer, acceptedAnswer);

    if (result < 0 || result > 100) {
      console.error("Result score number not in range [0;100]");
      return -1;
    }

    return result;
  } catch (error) {
    console.error("Error in checkOpenAnswer:", error);
    return -1;
  }
}

export async function generateQuestions(
  text: string,
  settings: Settings,
): Promise<Task[]> {
  if (!text || !settings) {
    throw new Error(
      "Missing required values: 'text' and 'settings' are required.",
    );
  }

  try {
    return await generateQuestionsService(text, settings);
  } catch (error) {
    console.error("Error in generateQuestions:", error);
    return [];
  }
}

export async function generateOpenQuestionAnswer(
  text: string,
  question: string,
): Promise<string> {
  if (!text || !question) {
    throw new Error(
      "Missing required values: 'text' and 'question' are required.",
    );
  }

  try {
    return await generateOpenQuestionAnswerService(text, question);
  } catch (error) {
    console.error("Error in generateOpenQuestionAnswer:", error);
    return "";
  }
}
