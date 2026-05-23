import { TailoredResume } from '../latex';
import { parseJsonFromText } from '../gemini';

export function buildTailorPrompt(input: {
  bullets: { text: string; repo: string; displayName: string }[];
  parsedResumeText?: string;
  userNotes?: string;
  jobDescription?: string;
}): string {
  const bulletList = input.bullets
    .map((b) => `- [${b.displayName}] ${b.text}`)
    .join('\n');

  return `You are an expert ATS resume optimizer. Given GitHub project bullets, optional prior experience from an uploaded resume, optional user notes, and an optional job description, produce structured resume content for a Jake Gutierrez-style LaTeX resume.

Do the following:
1. If a job description is provided, rewrite and reorder bullets to maximize keyword match without stuffing.
2. Group GitHub repository bullets into the "projects" section (one project per repo).
3. Put prior employment from the uploaded resume or user notes into "experience".
4. Put education from uploaded resume or notes into "education".
5. Put clubs, volunteering, or leadership roles into "leadership" (omit section if none).
6. Produce Technical Skills grouped by category (Languages, Frameworks & Libraries, Tools & Technologies, etc.).

Rules:
- Never invent metrics, companies, or experiences not present in the source data
- Preserve factual accuracy at all times
- Each experience/project entry needs 2–5 strong bullet points where data allows
- Use date formats like "Mon YYYY -- Mon YYYY" or "Expected Mon YYYY"
- For GitHub-only work with no employer, do NOT put repos in experience — use projects only

Return ONLY valid JSON, no markdown fences:
{
  "skills": {
    "Languages": ["Python", "TypeScript"],
    "Frameworks & Libraries": ["React"],
    "Tools & Technologies": ["Git/GitHub", "PostgreSQL"]
  },
  "experience": [
    {
      "title": "Software Engineer Intern",
      "org": "Company Name",
      "dates": "Jun 2024 -- Aug 2024",
      "location": "City, State",
      "bullets": ["bullet 1", "bullet 2"]
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "techStack": "React, Node.js, PostgreSQL",
      "dates": "Jan 2024",
      "bullets": ["bullet 1", "bullet 2"]
    }
  ],
  "education": [
    {
      "institution": "University Name",
      "dates": "Expected May 2026",
      "degree": "B.S. in Computer Science -- GPA: 3.8/4.00",
      "location": "City, State"
    }
  ],
  "leadership": [
    {
      "org": "Club Name",
      "dates": "Aug 2023 -- Present",
      "role": "President",
      "location": "City, State",
      "bullets": ["bullet 1"]
    }
  ]
}

Resume bullet points (from GitHub repos):
${bulletList}

Uploaded resume text:
${input.parsedResumeText || 'None'}

User notes:
${input.userNotes || 'None'}

Job description:
${input.jobDescription || 'None'}`;
}

export function parseTailorResponse(text: string): TailoredResume {
  const parsed = parseJsonFromText<TailoredResume>(text);
  if (!parsed.skills || !parsed.experience || !parsed.projects || !parsed.education) {
    throw new Error('Invalid tailor response from Gemini');
  }
  return parsed;
}
