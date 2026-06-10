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

/* ----------------------- Slash commands & @ mentions ----------------------- */

export interface SlashCommand {
  cmd: string; // e.g. "why" (typed as "/why")
  description: string;
  build: (ctx: ChatContext) => string; // expansion actually sent to the model
}

export const SLASH_COMMANDS: SlashCommand[] = [
  {
    cmd: "why",
    description: "Explain why the correct answer is right and the others wrong",
    build: () =>
      "Explain why the correct answer to this question is correct, and why each of the other answer options is incorrect. Answer in the same language as the question.",
  },
];

// @ mentions available for THIS question — only the ones that actually exist.
export function getMentionNames(ctx: ChatContext): string[] {
  const names: string[] = ["question"];
  if (ctx.hint) names.push("hint");
  if (ctx.explanation) names.push("explanation");
  const count = ctx.options?.length ?? 0;
  for (let i = 1; i <= count; i++) names.push(`answer${i}`);
  return names;
}

// Resolve a single @mention name to its "name: '...'" form (or a placeholder).
function resolveMention(name: string, ctx: ChatContext): string {
  const key = name.toLowerCase();
  if (key === "question") return `question: '${ctx.question}'`;
  if (key === "hint")
    return `hint: ${ctx.hint ? `'${ctx.hint}'` : "(not generated)"}`;
  if (key === "explanation")
    return `explanation: ${ctx.explanation ? `'${ctx.explanation}'` : "(not generated)"}`;
  const m = key.match(/^answer(\d+)$/);
  if (m) {
    const idx = parseInt(m[1], 10) - 1;
    const opts = ctx.options ?? [];
    if (idx >= 0 && idx < opts.length) return `answer${m[1]}: '${opts[idx]}'`;
    return `answer${m[1]}: (no such answer)`;
  }
  return `@${name}`; // unknown token — leave it untouched
}

// Expand a typed message before sending: resolve a leading slash command,
// otherwise replace inline @mentions with their quoted content.
export function expandMessage(input: string, ctx: ChatContext): string {
  const trimmed = input.trim();
  const expandMentions = (text: string): string =>
    text.replace(/@(\w+)/g, (_full, name: string) => resolveMention(name, ctx));
  if (trimmed.startsWith("/")) {
    const cmdName = trimmed.slice(1).split(/\s+/)[0].toLowerCase();
    const command = SLASH_COMMANDS.find((c) => c.cmd === cmdName);
    if (command) {
      const base = command.build(ctx);
      // Keep anything the user typed after the command (with @mentions resolved).
      const rest = trimmed.slice(1 + cmdName.length).trim();
      return rest ? `${base}\n\nAdditionally: ${expandMentions(rest)}` : base;
    }
  }
  return expandMentions(input);
}

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
