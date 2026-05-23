import { ContactInfo, missingContactFields } from './latex';
import { ask } from './gemini';
import {
  buildExtractProfilePrompt,
  parseExtractProfileResponse,
} from './prompts/extractProfile';

export function mergeContact(
  existing: ContactInfo | null | undefined,
  extracted: Partial<ContactInfo>,
  githubUsername?: string,
): ContactInfo {
  const base: ContactInfo = {
    fullName: existing?.fullName ?? '',
    address: existing?.address ?? '',
    phone: existing?.phone ?? '',
    email: existing?.email ?? '',
    linkedin: existing?.linkedin ?? '',
    github: existing?.github ?? (githubUsername ? `github.com/${githubUsername}` : ''),
  };

  for (const key of Object.keys(extracted) as (keyof ContactInfo)[]) {
    const value = extracted[key]?.trim();
    if (value && !base[key]?.trim()) {
      base[key] = value;
    }
  }

  if (!base.github?.trim() && githubUsername) {
    base.github = `github.com/${githubUsername}`;
  }

  return base;
}

export async function extractContactFromResume(
  resumeText: string,
  existing?: ContactInfo | null,
  githubUsername?: string,
): Promise<{ contactInfo: ContactInfo; missingFields: (keyof ContactInfo)[] }> {
  const prompt = buildExtractProfilePrompt(resumeText);
  const text = await ask(prompt);
  const profile = parseExtractProfileResponse(text);

  const contactInfo = mergeContact(existing, profile, githubUsername);
  const missingFields = missingContactFields(contactInfo);

  return { contactInfo, missingFields };
}

export function hasStoredContact(contact: ContactInfo | null | undefined): boolean {
  if (!contact) return false;
  return Boolean(
    contact.fullName?.trim() ||
      contact.phone?.trim() ||
      contact.email?.trim() ||
      contact.linkedin?.trim(),
  );
}
