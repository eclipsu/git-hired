import { TailoredResume } from '../latex';

export function buildTailorPrompt(input: {
  bullets: { text: string; repo: string; displayName: string }[];
  parsedResumeText?: string;
  userNotes?: string;
  jobDescription?: string;
}): string {
  const bulletList = input.bullets
    .map((b) => `- [${b.displayName}] ${b.text}`)
    .join('\n');

  return `You are an expert ATS resume optimizer and LaTeX resume author.

Given resume bullet points, optional prior experience, optional user notes, and an optional job description, do the following:

1. If a job description is provided, rewrite and reorder bullets to maximize keyword match. Subtly rephrase to match the role's vocabulary without stuffing. Most relevant bullets first.
2. Write a 2-sentence professional summary tailored to the role (or general if no JD provided).
3. Produce a Technical Skills section grouped by category (Languages, Frameworks, Infrastructure, Tools, etc.).
4. Incorporate any prior experience or education from the uploaded resume or user notes into the appropriate sections.

Rules:
- Never invent metrics, companies, or experiences not present in the source data
- Preserve factual accuracy at all times

Return ONLY valid JSON, no markdown fences:
{
  "summary": "...",
  "skills": { "Languages": ["Python", "TypeScript"], "Frameworks": ["React"] },
  "experience": [
    {
      "title": "Software Engineer",
      "org": "Open Source & Independent Projects",
      "dates": "2022–Present",
      "bullets": ["bullet 1", "bullet 2"]
    }
  ],
  "education": [{ "degree": "...", "institution": "...", "year": "..." }]
}

Resume bullet points:
${bulletList}

Uploaded resume text:
${input.parsedResumeText || 'None'}

User notes:
${input.userNotes || 'None'}

Job description:
${input.jobDescription || 'None'}`;
}

export function parseTailorResponse(text: string): TailoredResume {
  const parsed = JSON.parse(text) as TailoredResume;
  if (!parsed.summary || !parsed.skills || !parsed.experience) {
    throw new Error('Invalid tailor response from Gemini');
  }
  return parsed;
}
