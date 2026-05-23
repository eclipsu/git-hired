import { GoogleGenerativeAI } from '@google/generative-ai';

const DEFAULT_MODEL = 'gemini-2.5-flash';

function stripMarkdownFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim();
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

export async function ask(prompt: string): Promise<string> {
  const result = await getModel().generateContent(prompt);
  const text = result.response.text();
  return stripMarkdownFences(text);
}
