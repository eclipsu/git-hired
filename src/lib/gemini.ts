import { GoogleGenerativeAI } from '@google/generative-ai';

/** Separate free-tier quota bucket from gemini-2.5-flash (20 req/day). Override via GEMINI_MODEL. */
const DEFAULT_MODEL = 'gemini-2.0-flash';

export class GeminiQuotaError extends Error {
  readonly retryAfterMs?: number;

  constructor(message: string, retryAfterMs?: number) {
    super(message);
    this.name = 'GeminiQuotaError';
    this.retryAfterMs = retryAfterMs;
  }
}

function stripMarkdownFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryDelayMs(message: string): number | null {
  const retryIn = message.match(/retry in (\d+(?:\.\d+)?)s/i);
  if (retryIn) return Math.ceil(parseFloat(retryIn[1]) * 1000);

  const retryDelay = message.match(/retryDelay":"(\d+)s"/i);
  if (retryDelay) return parseInt(retryDelay[1], 10) * 1000;

  return null;
}

function isQuotaOrRateLimitError(message: string): boolean {
  return (
    message.includes('429') ||
    message.includes('Too Many Requests') ||
    message.includes('quota') ||
    message.includes('Quota exceeded')
  );
}

function isDailyQuotaError(message: string): boolean {
  return (
    message.includes('PerDay') ||
    message.includes('free_tier_requests') ||
    message.includes('GenerateRequestsPerDay')
  );
}

function quotaErrorMessage(message: string): string {
  const model = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
  if (isDailyQuotaError(message)) {
    return (
      `Gemini free-tier daily limit reached for ${model} (typically 20 requests/day). ` +
      'Wait until tomorrow, set GEMINI_MODEL to another model in .env, or enable billing at https://ai.google.dev.'
    );
  }
  const retryMs = parseRetryDelayMs(message);
  if (retryMs) {
    return `Gemini rate limit hit. Please retry in ~${Math.ceil(retryMs / 1000)} seconds.`;
  }
  return 'Gemini API quota or rate limit exceeded. Check https://ai.dev/rate-limit for usage.';
}

function getModel() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is missing. Add it to your .env file and restart the server.',
    );
  }
  const modelName = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: modelName });
}

export function parseJsonFromText<T>(text: string): T {
  const cleaned = stripMarkdownFences(text);
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const objectMatch = cleaned.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      return JSON.parse(objectMatch[0]) as T;
    }
    const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      return JSON.parse(arrayMatch[0]) as T;
    }
    throw new Error('Model response was not valid JSON');
  }
}

export async function ask(prompt: string, maxRetries = 2): Promise<string> {
  let lastMessage = '';

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      const result = await getModel().generateContent(prompt);
      return stripMarkdownFences(result.response.text());
    } catch (err) {
      lastMessage = err instanceof Error ? err.message : String(err);

      if (!isQuotaOrRateLimitError(lastMessage)) {
        throw err;
      }

      if (isDailyQuotaError(lastMessage) || attempt === maxRetries) {
        throw new GeminiQuotaError(quotaErrorMessage(lastMessage), parseRetryDelayMs(lastMessage) ?? undefined);
      }

      const delayMs = parseRetryDelayMs(lastMessage) ?? 5000 * (attempt + 1);
      await sleep(delayMs);
    }
  }

  throw new GeminiQuotaError(quotaErrorMessage(lastMessage), parseRetryDelayMs(lastMessage) ?? undefined);
}
