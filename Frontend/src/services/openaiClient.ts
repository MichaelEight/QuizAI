import OpenAI from 'openai';
import { OPENAI_API_KEY_STORAGE_KEY, DEFAULT_MODEL, PromptRank } from './constants';

let clientInstance: OpenAI | null = null;

export class OpenAIClientManager {
  static getApiKey(): string | null {
    return localStorage.getItem(OPENAI_API_KEY_STORAGE_KEY);
  }

  static setApiKey(apiKey: string): void {
    localStorage.setItem(OPENAI_API_KEY_STORAGE_KEY, apiKey);
    clientInstance = null;
  }

  static removeApiKey(): void {
    localStorage.removeItem(OPENAI_API_KEY_STORAGE_KEY);
    clientInstance = null;
  }

  static hasApiKey(): boolean {
    const key = this.getApiKey();
    return key !== null && key.trim().length > 0;
  }

  static getClient(): OpenAI {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    if (!clientInstance) {
      clientInstance = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true,
      });
    }

    return clientInstance;
  }

  static getDefaultModel(): string {
    return DEFAULT_MODEL;
  }
}

export interface ChatMessage {
  role: 'system' | 'developer' | 'user';
  content: string;
}

export async function makeApiRequest(
  systemPrompt: string,
  developerPrompt: string,
  userPrompt: string,
): Promise<string> {
  const client = OpenAIClientManager.getClient();
  const model = OpenAIClientManager.getDefaultModel();

  const messages: ChatMessage[] = [
    { role: PromptRank.SYSTEM, content: systemPrompt },
  ];

  if (developerPrompt && developerPrompt.trim().length > 0) {
    messages.push({ role: PromptRank.DEVELOPER, content: developerPrompt });
  }

  messages.push({ role: PromptRank.USER, content: userPrompt });

  const completion = await client.chat.completions.create({
    model,
    messages: messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  });

  return completion.choices[0]?.message?.content ?? '';
}
