import { TailoredResume } from '../latex';
import { parseJsonFromText } from '../gemini';

const BULLET_RULES = `Each bullet MUST:
- Start with a strong past-tense action verb (Architected, Engineered, Implemented, Designed, Automated, Migrated, etc.)
- Include exact specifics: number of endpoints, entities, modules, strategies, files, steps, retries, limits, etc.
- Name the actual patterns and technologies used (RBAC, JWT, WebSocket, OAuth, etc.)
- Include concrete constraints where present (file size caps, token expiry, pagination size, MIME types, permission counts)
- Be 1–2 lines max, zero filler words ("robust", "comprehensive", "optimized" are banned unless followed by proof)

BAD: "Implemented a robust deployment strategy across Vercel and EC2, including Dockerization."
GOOD: "Deployed frontend to Vercel and containerized Express backend with Docker on EC2, configuring 3 environment stages and a Nginx reverse proxy routing /api traffic to port 3000."`;

export function buildTailorPrompt(input: {
  bullets: { text: string; repo: string; displayName: string }[];
  parsedResumeText?: string;
  userNotes?: string;
  jobDescription?: string;
}): string {
  const bulletList = input.bullets
    .map((b) => `- [${b.displayName}] ${b.text}`)
    .join('\n');

  const hasJobDescription = Boolean(input.jobDescription?.trim());

  const jdInstructions = hasJobDescription
    ? `
CRITICAL — Job description provided. Maximize ATS keyword match:
1. FULLY REWRITE every bullet in "experience" extracted from the uploaded resume. Do NOT copy uploaded resume bullets verbatim — rephrase them to mirror JD terminology, required skills, and responsibilities while preserving factual accuracy.
2. REWRITE and reorder GitHub project bullets to align with JD keywords and priorities.
3. Derive Technical Skills directly from JD requirements plus evidenced technologies in the source data — prioritize JD-matching keywords in skill category names and items.
4. Reorder experience and project entries so the most JD-relevant roles appear first.
5. Never invent companies, dates, titles, or achievements not present in the uploaded resume or GitHub data.`
    : `
If no job description is provided, polish bullets for clarity and impact without changing facts.`;

  return `You are an expert ATS resume optimizer. Given GitHub project bullets, optional prior experience from an uploaded resume, optional user notes, and an optional job description, produce structured resume content for a Jake Gutierrez-style LaTeX resume.

Do the following:
1. Group GitHub repository bullets into the "projects" section (one project per repo).
2. Extract prior employment from the uploaded resume or user notes into "experience". When a job description is provided, rewrite ALL experience bullets for maximum ATS match (see below).
3. Put education from uploaded resume or notes into "education".
4. Put clubs, volunteering, or leadership roles into "leadership" (omit section if none).
5. Produce Technical Skills grouped by category (Languages, Frameworks & Libraries, Tools & Technologies, etc.).

${BULLET_RULES}
${jdInstructions}

Rules:
- Never invent metrics, companies, or experiences not present in the source data
- Preserve factual accuracy at all times — only rephrase, reorder, and emphasize; do not fabricate
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
