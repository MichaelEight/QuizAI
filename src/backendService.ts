import { Task, ScoreBreakdownTemplate } from "./QuestionsTypes";
import { Settings, QuestionStyle } from "./SettingsType";
import {
  generateQuestions as generateQuestionsService,
  checkOpenAnswer as checkOpenAnswerService,
  generateOpenQuestionAnswer as generateOpenQuestionAnswerService,
  generateScoreTemplate as generateScoreTemplateService,
  generateHint as generateHintService,
  generateExplanation as generateExplanationService,
  CheckAnswerResult,
} from "./services/questionService";

export type { CheckAnswerResult, ProgressEvent, ProgressCallback } from "./services/questionService";

export async function checkOpenAnswer(
  text: string,
  question: string,
  answer: string,
  template: ScoreBreakdownTemplate,
  acceptedAnswer?: string,
  quizId?: string | null,
  quizTitle?: string | null,
): Promise<CheckAnswerResult> {
  if (!text || !question) {
    throw new Error(
      "Missing required values: 'text' and 'question' are required.",
    );
  }

  try {
    const result = await checkOpenAnswerService(
      text,
      question,
      answer,
      template,
      acceptedAnswer,
      quizId,
      quizTitle,
    );

    if (result.score < 0 || result.score > 100) {
      console.error("Result score number not in range [0;100]");
      return { score: -1, breakdown: [] };
    }

    return result;
  } catch (error) {
    console.error("Error in checkOpenAnswer:", error);
    return { score: -1, breakdown: [] };
  }
}

export async function generateQuestions(
  text: string,
  settings: Settings,
  onProgress?: import("./services/questionService").ProgressCallback,
): Promise<Task[]> {
  if (!text || !settings) {
    throw new Error(
      "Missing required values: 'text' and 'settings' are required.",
    );
  }

  try {
    return await generateQuestionsService(text, settings, undefined, undefined, onProgress);
  } catch (error) {
    console.error("Error in generateQuestions:", error);
    return [];
  }
}

export async function generateScoreTemplate(
  text: string,
  question: string,
  quizId?: string | null,
  quizTitle?: string | null,
): Promise<ScoreBreakdownTemplate> {
  if (!text || !question) {
    throw new Error(
      "Missing required values: 'text' and 'question' are required.",
    );
  }

  try {
    return await generateScoreTemplateService(text, question, quizId, quizTitle);
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
  if (!text || !question) {
    throw new Error(
      "Missing required values: 'text' and 'question' are required.",
    );
  }

  try {
    return await generateOpenQuestionAnswerService(text, question, template, quizId, quizTitle);
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
  if (!text || !question) {
    throw new Error(
      "Missing required values: 'text' and 'question' are required.",
    );
  }

  try {
    return await generateHintService(text, question, questionStyle, correctAnswers, quizId, quizTitle);
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
  if (!text || !question || !correctAnswers || correctAnswers.length === 0) {
    throw new Error(
      "Missing required values: 'text', 'question', and 'correctAnswers' are required.",
    );
  }

  try {
    return await generateExplanationService(text, question, correctAnswers, quizId, quizTitle);
  } catch (error) {
    console.error("Error in generateExplanation:", error);
    return "";
  }
}

export async function generateMultipleExpectedAnswers(
  text: string,
  question: string,
  template?: ScoreBreakdownTemplate,
  count: number = 3,
  quizId?: string | null,
  quizTitle?: string | null,
): Promise<string[]> {
  if (!text || !question) {
    throw new Error(
      "Missing required values: 'text' and 'question' are required.",
    );
  }

  try {
    const promises = Array(count)
      .fill(null)
      .map(() => generateOpenQuestionAnswer(text, question, template, quizId, quizTitle));
    const results = await Promise.all(promises);
    // Filter out empty results
    return results.filter((result) => result !== "");
  } catch (error) {
    console.error("Error in generateMultipleExpectedAnswers:", error);
    return [];
  }
}

export async function generateMultipleExplanations(
  text: string,
  question: string,
  correctAnswers: string[],
  count: number = 3,
  quizId?: string | null,
  quizTitle?: string | null,
): Promise<string[]> {
  if (!text || !question || !correctAnswers || correctAnswers.length === 0) {
    throw new Error(
      "Missing required values: 'text', 'question', and 'correctAnswers' are required.",
    );
  }

  try {
    const promises = Array(count)
      .fill(null)
      .map(() => generateExplanation(text, question, correctAnswers, quizId, quizTitle));
    const results = await Promise.all(promises);
    // Filter out empty results
    return results.filter((result) => result !== "");
  } catch (error) {
    console.error("Error in generateMultipleExplanations:", error);
    return [];
  }
}

export async function generateMultipleScoreTemplates(
  text: string,
  question: string,
  count: number = 3,
  quizId?: string | null,
  quizTitle?: string | null,
): Promise<ScoreBreakdownTemplate[]> {
  if (!text || !question) {
    throw new Error(
      "Missing required values: 'text' and 'question' are required.",
    );
  }

  try {
    const promises = Array(count)
      .fill(null)
      .map(() => generateScoreTemplate(text, question, quizId, quizTitle));
    const results = await Promise.all(promises);
    // Filter out empty templates
    return results.filter((result) => result.length > 0);
  } catch (error) {
    console.error("Error in generateMultipleScoreTemplates:", error);
    return [];
  }
}
