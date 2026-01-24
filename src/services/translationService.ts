import { makeApiRequest } from "./openaiClient";
import { Task } from "../QuestionsTypes";
import { QuizLanguage } from "../SettingsType";
import { TRAILING_COMMA_REGEX } from "./constants";

const LANGUAGE_NAMES: Record<QuizLanguage, string> = {
  english: "English",
  polish: "Polish",
  spanish: "Spanish",
  german: "German",
};

interface TranslatedTask {
  id: string;
  question: string;
  answers?: Array<{ content: string; isCorrect: boolean }>;
}

function correctTrailingComma(str: string): string {
  return str.replace(TRAILING_COMMA_REGEX, "$1");
}

/**
 * Translate an array of quiz tasks to a target language
 * @param tasks - The quiz tasks to translate
 * @param targetLanguage - The target language
 * @param sourceText - Optional source text that provides context for accurate translations
 */
export async function translateQuizTasks(
  tasks: Task[],
  targetLanguage: QuizLanguage,
  sourceText?: string,
): Promise<Task[]> {
  const targetLangName = LANGUAGE_NAMES[targetLanguage];

  // Prepare tasks for translation (extract only translatable content)
  const tasksToTranslate = tasks.map((task) => ({
    id: task.id,
    question: task.question.value,
    answers: task.answers?.map((a) => ({
      content: a.value,
      isCorrect: a.isCorrect,
    })),
  }));

  // Build context section if source text is available
  const contextSection = sourceText
    ? `
CONTEXT: The following is the original source text that the quiz was generated from. Use this to understand the subject matter and ensure translations are accurate and contextually appropriate:
---
${sourceText.substring(0, 8000)}${sourceText.length > 8000 ? "\n[... source text truncated ...]" : ""}
---
`
    : "";

  const systemPrompt = `You are a professional translator specializing in educational content. Translate the quiz questions and answers to ${targetLangName}.
${contextSection}
IMPORTANT RULES:
1. Output ONLY valid JSON - no extra text before or after
2. Preserve the exact structure of the input
3. Keep all IDs unchanged
4. Keep isCorrect values unchanged
5. Translate ONLY the question text and answer content text
6. Maintain the same tone and difficulty level
7. Ensure translations are natural and idiomatic in ${targetLangName}
8. For technical terms, use the standard ${targetLangName} terminology
9. Use the source context to ensure translations accurately reflect the original meaning

Return a JSON array with the same structure as input, with translated text.`;

  const userPrompt = `Translate these quiz questions and answers to ${targetLangName}:

${JSON.stringify(tasksToTranslate, null, 2)}`;

  try {
    const response = await makeApiRequest(systemPrompt, "", userPrompt);
    const corrected = correctTrailingComma(response.trim());
    const translatedTasks: TranslatedTask[] = JSON.parse(corrected);

    // Merge translated content back into original task structure
    return tasks.map((originalTask) => {
      const translated = translatedTasks.find((t) => t.id === originalTask.id);
      if (!translated) {
        return originalTask; // Fallback to original if translation not found
      }

      return {
        ...originalTask,
        question: {
          ...originalTask.question,
          value: translated.question,
        },
        answers: originalTask.answers?.map((originalAnswer, index) => ({
          ...originalAnswer,
          value: translated.answers?.[index]?.content ?? originalAnswer.value,
        })),
        // Clear cached content that should be regenerated in new language
        answerOverride: originalTask.answerOverride
          ? {
              ...originalTask.answerOverride,
              hint: undefined,
              explanation: undefined,
              generatedOpenAnswer: undefined,
            }
          : undefined,
      };
    });
  } catch (error) {
    console.error("Translation failed:", error);
    throw new Error("Failed to translate quiz. Please try again.");
  }
}

/**
 * Translate quiz title and description
 */
export async function translateQuizMetadata(
  title: string,
  description: string | undefined,
  targetLanguage: QuizLanguage,
): Promise<{ title: string; description?: string }> {
  const targetLangName = LANGUAGE_NAMES[targetLanguage];

  const systemPrompt = `You are a professional translator. Translate the quiz title and description to ${targetLangName}.
Return ONLY valid JSON with "title" and optionally "description" fields. No extra text.`;

  const metadata = { title, description };
  const userPrompt = `Translate to ${targetLangName}:
${JSON.stringify(metadata, null, 2)}`;

  try {
    const response = await makeApiRequest(systemPrompt, "", userPrompt);
    const corrected = correctTrailingComma(response.trim());
    return JSON.parse(corrected);
  } catch (error) {
    console.error("Metadata translation failed:", error);
    // Return original if translation fails
    return { title, description };
  }
}
