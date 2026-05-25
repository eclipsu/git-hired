import { TailoredResume } from '../latex';
import { parseJsonFromText } from '../gemini';
import { formatProjectDateRange } from '../github';

const BULLET_RULES = `Each bullet MUST:
- Start with a strong past-tense action verb (Architected, Engineered, Implemented, Designed, Automated, Migrated, etc.)
- Describe engineering decisions, outcomes, and technologies — NOT raw diff stats
- Name the actual patterns and technologies used (RBAC, JWT, WebSocket, OAuth, etc.)
- Include concrete constraints where present (file size caps, token expiry, pagination size, MIME types, permission counts)
- Be 1–2 full sentences, zero filler words ("robust", "comprehensive", "optimized" are banned unless followed by proof)

BANNED: file counts, lines of code, "across N modules" — never use these as achievements.

BAD: "Modified 55 files across 12 modules generating 4182 lines of code."
BAD: "Implemented a robust deployment strategy across Vercel and EC2, including Dockerization."
GOOD: "Deployed frontend to Vercel and containerized Express backend with Docker on EC2, configuring 3 environment stages and a Nginx reverse proxy routing /api traffic to port 3000."`;

export function buildTailorPrompt(input: {
  bullets: { text: string; repo: string; displayName: string }[];
  parsedResumeText?: string;
  userNotes?: string;
  jobDescription?: string;
  repoDates?: { displayName: string; dates: string }[];
  repoSkills?: Record<string, string[]>;
  projectContext?: { displayName: string; readmeExcerpt?: string; userNotes?: string; description?: string | null }[];
}): string {
  const bulletList = input.bullets
    .map((b) => `- [${b.displayName}] ${b.text}`)
    .join('\n');

  const repoDateList = input.repoDates?.length
    ? input.repoDates.map((r) => `- ${r.displayName}: ${r.dates}`).join('\n')
    : 'None';

  const repoSkillsList = input.repoSkills && Object.keys(input.repoSkills).length > 0
    ? Object.entries(input.repoSkills)
        .map(([cat, items]) => `- ${cat}: ${items.join(', ')}`)
        .join('\n')
    : 'None';

  const projectContextList = input.projectContext?.length
    ? input.projectContext.map((p) => {
        const parts = [`- ${p.displayName}:`];
        if (p.description) parts.push(`  GitHub description: ${p.description}`);
        if (p.readmeExcerpt) parts.push(`  README excerpt: ${p.readmeExcerpt.slice(0, 600)}`);
        if (p.userNotes) parts.push(`  Developer notes: ${p.userNotes}`);
        return parts.join('\n');
      }).join('\n\n')
    : 'None';

  const hasJobDescription = Boolean(input.jobDescription?.trim());
  const hasUploadedResume = Boolean(input.parsedResumeText?.trim());

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

  const resumeOptimization = hasUploadedResume
    ? `
UPLOADED RESUME OPTIMIZATION — An uploaded resume is provided. You MUST:
1. Extract ALL experience, education, projects, skills, and leadership from the uploaded resume.
2. FULLY REWRITE every experience and project bullet from the upload for ATS impact — stronger action verbs, clearer outcomes, industry-standard terminology. Do NOT copy any uploaded bullets verbatim.
3. Optimize education lines: tighten wording, preserve GPA/dates/honors/institution names accurately.
4. Merge inferred GitHub repo skills (below) with skills found in the uploaded resume — deduplicate and expand categories.
5. Preserve all factual details (companies, titles, dates, institutions) exactly as stated in the upload.`
    : '';

  return `You are an expert ATS resume optimizer. Given GitHub project bullets, optional prior experience from an uploaded resume, optional user notes, and an optional job description, produce structured resume content for a Jake Gutierrez-style LaTeX resume.

Do the following:
1. Group GitHub repository bullets into the "projects" section (one project per repo).
2. Extract prior employment from the uploaded resume or user notes into "experience". When a job description is provided, rewrite ALL experience bullets for maximum ATS match (see below).
3. Put education from uploaded resume or notes into "education".
4. Put clubs, volunteering, or leadership roles into "leadership" (omit section if none).
5. Produce Technical Skills grouped by category — include ALL inferred technologies from repo analysis and the uploaded resume, not just primary ones. Merge repo-inferred skills (below) into the skills object.
6. Extract soft skills (communication, leadership, teamwork, problem-solving, etc.) from user notes and the uploaded resume into soft_skills. Omit the array if none are found.

LENGTH & DENSITY — ONE PAGE MAX:
- The resume MUST fit on ONE page (US letter, 11pt Jake template). This is non-negotiable.
- Max 2–3 bullets per project; max 2–3 bullets per experience entry.
- Max 3–4 projects total; omit or merge lower-priority entries if needed.
- Keep skills to 3–5 compact categories; combine related items with commas.
- Omit leadership section if space is tight.
- Use tight, punchy bullets — one sentence each where possible.

${BULLET_RULES}
${jdInstructions}
${resumeOptimization}

Rules:
- Never invent metrics, companies, or experiences not present in the source data
- Preserve factual accuracy at all times — only rephrase, reorder, and emphasize; do not fabricate
- Use date formats like "Mon YYYY -- Mon YYYY" or "Expected Mon YYYY"
- For GitHub-only work with no employer, do NOT put repos in experience — use projects only
- For each GitHub project, use the exact dates listed under "GitHub repository dates" below (do not invent or change them)
- Do NOT include a professional summary section

Return ONLY valid JSON, no markdown fences:
{
  "skills": {
    "Languages": ["Python", "TypeScript"],
    "Frameworks & Libraries": ["React"],
    "Tools & Technologies": ["Git/GitHub", "PostgreSQL"],
    "Computer Science Concepts": ["Data Structures", "Algorithms"],
    "Software Design Patterns": ["MVC", "Repository Pattern"]
  },
  "soft_skills": ["Communication", "Team Collaboration", "Problem Solving"],
  "experience": [
    {
      "title": "Software Engineer Intern",
      "org": "Company Name",
      "dates": "Jun 2024 -- Aug 2024",
      "location": "City, State",
      "bullets": ["bullet 1", "bullet 2", "bullet 3"]
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

GitHub repository dates (use exactly for matching project entries):
${repoDateList}

Inferred skills from repo analysis (merge into skills section):
${repoSkillsList}

Project context (README + developer notes — use to write accurate project bullets and techStack):
${projectContextList}

Uploaded resume text:
${input.parsedResumeText || 'None'}

User notes:
${input.userNotes || 'None'}

Job description:
${input.jobDescription || 'None'}`;
}

interface RawTailorResponse {
  skills?: Record<string, string[]>;
  soft_skills?: string[];
  softSkills?: string[];
  experience?: TailoredResume['experience'];
  projects?: TailoredResume['projects'];
  education?: TailoredResume['education'];
  leadership?: TailoredResume['leadership'];
}

export function parseTailorResponse(text: string): TailoredResume {
  const parsed = parseJsonFromText<RawTailorResponse>(text);
  if (!parsed.skills || !parsed.experience || !parsed.projects || !parsed.education) {
    throw new Error('Invalid tailor response from Gemini');
  }

  const softSkills = (parsed.soft_skills ?? parsed.softSkills ?? [])
    .filter((s): s is string => typeof s === 'string' && s.trim().length > 0);

  return {
    skills: parsed.skills,
    softSkills: softSkills.length > 0 ? softSkills : undefined,
    experience: parsed.experience,
    projects: parsed.projects,
    education: parsed.education,
    leadership: parsed.leadership,
  };
}

export interface RepoDateMeta {
  repo: string;
  displayName: string;
  createdAt: string;
  pushedAt?: string;
}

function resolveRepoForProject(
  projectName: string,
  bullets: { repo: string; displayName: string }[],
): string | undefined {
  const normalized = projectName.trim().toLowerCase();
  for (const bullet of bullets) {
    if (bullet.displayName.trim().toLowerCase() === normalized) return bullet.repo;
    if (bullet.repo.trim().toLowerCase() === normalized) return bullet.repo;
  }
  return undefined;
}

/** Apply GitHub creation/push dates to tailored project entries. */
export function applyProjectDatesFromRepos(
  resume: TailoredResume,
  bullets: { repo: string; displayName: string }[],
  repoMeta: RepoDateMeta[],
): TailoredResume {
  const metaByRepo = new Map(repoMeta.map((m) => [m.repo, m]));

  const projects = resume.projects.map((project) => {
    const repo = resolveRepoForProject(project.name, bullets);
    if (!repo) return project;

    const meta = metaByRepo.get(repo);
    if (!meta?.createdAt) return project;

    return {
      ...project,
      dates: formatProjectDateRange(meta.createdAt, meta.pushedAt),
    };
  });

  return { ...resume, projects };
}
