import { makeApiRequest } from "./openaiClient";
import { UsageContext } from "./usageLogger";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export interface ChatContext {
  sourceText: string;
  question: string;
  userAnswer?: string;
  correctAnswer?: string;
  explanation?: string;
  hint?: string;
}

const MAX_HISTORY_PAIRS = 10;

/**
 * Build the system prompt with full quiz context
 */
function buildSystemPrompt(context: ChatContext): string {
  const parts: string[] = [
    `You are a helpful educational assistant for a quiz application. Your role is to help the user understand the quiz content better.`,
    ``,
    `CONTEXT INFORMATION:`,
    ``,
    `SOURCE TEXT (the material the quiz is based on):`,
    `---`,
    context.sourceText.substring(0, 10000) +
      (context.sourceText.length > 10000 ? "\n[... truncated ...]" : ""),
    `---`,
    ``,
    `CURRENT QUESTION:`,
    context.question,
  ];

  if (context.userAnswer) {
    parts.push(``, `USER'S ANSWER:`, context.userAnswer);
  }

  if (context.correctAnswer) {
    parts.push(``, `CORRECT ANSWER (shown to user):`, context.correctAnswer);
  }

  if (context.explanation) {
    parts.push(``, `EXPLANATION (generated earlier):`, context.explanation);
  }

  if (context.hint) {
    parts.push(``, `HINT (generated earlier):`, context.hint);
  }

  parts.push(
    ``,
    `INSTRUCTIONS:`,
    `- Answer the user's questions about the quiz content`,
    `- You can explain concepts, clarify terms, or provide additional context`,
    `- Use the source text as your primary reference`,
    `- Respond in the SAME LANGUAGE as the question and user's message`,
    `- Be concise but helpful`,
    `- If asked about something not in the source text, say so clearly but still answer the question up to your knowledge`,
  );

  return parts.join("\n");
}

/**
 * Build the conversation history for the API
 */
function buildConversationHistory(
  history: ChatMessage[],
): Array<{ role: string; content: string }> {
  // Keep only the last MAX_HISTORY_PAIRS pairs (user + assistant)
  const limitedHistory = history.slice(-MAX_HISTORY_PAIRS * 2);

  return limitedHistory.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));
}

/**
 * Send a chat message and get AI response
 */
export async function sendChatMessage(
  userMessage: string,
  context: ChatContext,
  history: ChatMessage[],
  quizId?: string | null,
  quizTitle?: string | null,
): Promise<string> {
  const systemPrompt = buildSystemPrompt(context);

  // Build conversation history string for developer prompt
  const conversationHistory = buildConversationHistory(history);
  let devPrompt = "";

  if (conversationHistory.length > 0) {
    devPrompt =
      "Previous conversation:\n" +
      conversationHistory
        .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
        .join("\n\n");
  }

  const usageContext: UsageContext = {
    quizId: quizId ?? null,
    quizTitle: quizTitle ?? null,
    operationType: "chat_message",
  };

  try {
    const response = await makeApiRequest(systemPrompt, devPrompt, userMessage, usageContext);
    return response.trim();
  } catch (error) {
    console.error("Chat error:", error);
    throw new Error("Failed to get response. Please try again.");
  }
}
