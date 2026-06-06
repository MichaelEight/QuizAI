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
  options?: string[]; // Answer choices for closed/multiple-choice questions
  userAnswer?: string;
  correctAnswer?: string;
  explanation?: string;
  hint?: string;
}

const MAX_HISTORY_PAIRS = 10;

/* ----------------------------- Chat persistence ---------------------------- */
// Chat messages are cached per question, scoped to the currently loaded quiz
// (keyed by its tasks hash). Survives page reloads; cleared when the quiz is
// reset/ended or a different quiz is loaded.
const CHAT_CACHE_KEY = "quizai_chat_cache";

export function loadChatCache(quizKey: string): Record<string, ChatMessage[]> {
  try {
    const raw = localStorage.getItem(CHAT_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as {
      quizKey?: string;
      messages?: Record<string, ChatMessage[]>;
    };
    if (parsed.quizKey === quizKey && parsed.messages) return parsed.messages;
  } catch {
    // ignore parse/storage errors
  }
  return {};
}

export function saveChatCache(
  quizKey: string,
  messages: Record<string, ChatMessage[]>,
): void {
  try {
    localStorage.setItem(CHAT_CACHE_KEY, JSON.stringify({ quizKey, messages }));
  } catch {
    // ignore storage errors (e.g. quota)
  }
}

export function clearChatCache(): void {
  try {
    localStorage.removeItem(CHAT_CACHE_KEY);
  } catch {
    // ignore
  }
}

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

  if (context.options && context.options.length > 0) {
    parts.push(
      ``,
      `ANSWER OPTIONS:`,
      ...context.options.map((opt, i) => `${i + 1}. ${opt}`),
    );
  }

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

  // Before the user checks their answer, don't hand them the correct option outright.
  if (context.options && context.options.length > 0 && !context.correctAnswer) {
    parts.push(
      `- The user has NOT checked their answer yet. Help them reason toward the right option, but do NOT directly reveal which option is correct unless they explicitly ask for it.`,
    );
  }

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
