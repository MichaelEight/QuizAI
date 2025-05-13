import { Task } from "./QuestionsTypes";
import { Settings } from "./SettingsType";

const serverAddr = "http://localhost:5000";

// Make a direct request to backend
async function apiCheckOpenAnswer(
  text: string,
  question: string,
  answer: string,
): Promise<any> {
  const url = `${serverAddr}/check_open_answer`;
  const payload = { text, question, answer };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message ?? "Failed to fetch grade from backend.",
      );
    }

    return response.json();
  } catch (error) {
    console.error("Error in apiCheckOpenAnswer:", error);
    throw error;
  }
}

// Prepare a request
export async function checkOpenAnswer(
  text: string,
  question: string,
  answer: string,
): Promise<number> {
  if (!text || !question) {
    throw new Error(
      "Missing required values: 'text' and 'question' are required.",
    );
  }

  const result = await apiCheckOpenAnswer(text, question, answer);
  try {
    const resultAsNumber = Number(result);

    if (resultAsNumber < 0 || resultAsNumber > 100) {
      throw new Error("Result score number not in range [0;100]");
    }

    return resultAsNumber;
  } catch (error) {
    console.error("Error in checkOpenAnswer:", error);
    return -1; // Error number
  }
}

// Make a direct request to backend
async function apiGenerateQuestions(
  text: string,
  closed_amount: number,
  open_amount: number,
  allow_multiple: boolean,
  force_multiple: boolean,
): Promise<any> {
  const url = `${serverAddr}/generate_questions`;

  const payload = {
    text,
    closed_amount,
    open_amount,
    allow_multiple,
    force_multiple,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message ?? "Failed to fetch questions from backend.",
      );
    }

    return response.json();
  } catch (error) {
    console.error("Error in apiGenerateQuestions:", error);
    throw error;
  }
}

// Prepare a request
export async function generateQuestions(
  text: string,
  settings: Settings,
): Promise<Task[]> {
  if (!text || !settings) {
    throw new Error(
      "Missing required values: 'text' and 'settings' are required.",
    );
  }

  const closed_amount = settings.amountOfClosedQuestions;
  const open_amount = settings.amountOfOpenQuestions;
  const allow_multiple = settings.allowMultipleCorrectAnswers;
  const force_multiple = settings.forceMultipleCorrectAnswers;

  const result = await apiGenerateQuestions(
    text,
    closed_amount,
    open_amount,
    allow_multiple,
    force_multiple,
  );
  try {
    // Convert result to Task[]

    const tasks: Task[] = Array.isArray(result)
      ? result.map((item) => ({
          question: item.question,
          answers: item.answers
            ? item.answers.map((a: any) => ({
                content: a.content,
                isCorrect: a.isCorrect,
              }))
            : undefined,
        }))
      : [];
    return tasks;
  } catch (error) {
    console.error("Error in checkOpenAnswer:", error);
    return [];
  }
}
