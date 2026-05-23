import { ContactInfo } from '../latex';
import { parseJsonFromText } from '../gemini';

export interface ExtractedProfile extends Partial<ContactInfo> {
  educationHint?: string;
  experienceHint?: string;
}

export function buildExtractProfilePrompt(resumeText: string): string {
  return `You are a resume parser. Extract contact and profile details from the resume text below.

Return ONLY valid JSON, no markdown fences:
{
  "fullName": "First Last or empty string if not found",
  "address": "Street, City, State ZIP or empty string",
  "phone": "phone number or empty string",
  "email": "email or empty string",
  "linkedin": "linkedin.com/in/handle or empty string — no https prefix",
  "github": "github.com/username or empty string — no https prefix",
  "educationHint": "one-line summary of education found, or empty",
  "experienceHint": "one-line summary of work history found, or empty"
}

Rules:
- Only extract values clearly present in the resume
- Do not invent or guess missing fields — use empty string instead
- Normalize phone to a readable format like 123-456-7890
- For linkedin/github, return the short form (linkedin.com/in/handle, github.com/username)

Resume text:
${resumeText}`;
}

export function parseExtractProfileResponse(text: string): ExtractedProfile {
  const parsed = parseJsonFromText<ExtractedProfile>(text);
  return {
    fullName: parsed.fullName?.trim() || '',
    address: parsed.address?.trim() || '',
    phone: parsed.phone?.trim() || '',
    email: parsed.email?.trim() || '',
    linkedin: parsed.linkedin?.trim() || '',
    github: parsed.github?.trim() || '',
    educationHint: parsed.educationHint?.trim() || '',
    experienceHint: parsed.experienceHint?.trim() || '',
  };
}
