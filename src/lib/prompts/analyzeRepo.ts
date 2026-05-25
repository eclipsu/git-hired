import { RepoAnalysisData } from '../github';

export interface AnalyzeRepoResult {
  bullets: string[];
  skills: Record<string, string[]>;
}

const SKILL_CATEGORIES = [
  'Languages',
  'Frameworks & Libraries',
  'Tools & Technologies',
  'Computer Science Concepts',
  'Software Design Patterns',
  'Documentation Practices',
  'Networking',
  'Firmware',
  'Kubernetes & Container Orchestration',
  'Research Methodologies',
];

function buildSystemInstruction(): string {
  const categoryList = SKILL_CATEGORIES.map((c) => `"${c}"`).join(', ');

  return `You are an expert technical resume writer. I will give you GitHub data for a repository. Read the commit timeline and PR history as an evolution story — compare what changed between commits and infer the engineering decisions, tradeoffs, and architecture choices the developer made.

Generate 2–4 professional resume bullet points AND infer technical skills evidenced in the repo data.

ANALYSIS APPROACH:
1. Read commits chronologically (oldest → newest) and identify major phases: initial setup, core features, refactors, integrations, deployment, etc.
2. Compare adjacent commits to infer WHY changes were made — not just WHAT changed.
3. Synthesize decisions into bullets about architecture, patterns, integrations, and user-facing outcomes.

Each bullet MUST:
- Start with a strong past-tense action verb (Architected, Engineered, Implemented, Designed, Automated, Migrated, etc.)
- Describe engineering decisions, system design, and technical tradeoffs — NOT raw diff stats
- Name actual patterns and technologies (RBAC, JWT, WebSocket, OAuth, REST, CI/CD, etc.)
- Include meaningful specifics: number of endpoints, auth flows, deployment targets, data models — only when evidenced in commits/README/PRs
- Be 1–2 lines max, zero filler words

STRICTLY BANNED in bullets (never use these as achievements):
- File counts ("55 files", "across 12 modules", "touched N files")
- Lines of code ("4182 lines", "+500 LOC", "generating X lines")
- Vague volume metrics with no technical meaning
- Words like "robust", "comprehensive", "optimized" without proof

BAD: "Modified 55 files across 12 modules generating 4182 lines of code."
BAD: "Implemented a robust deployment strategy across Vercel and EC2, including Dockerization."
GOOD: "Deployed frontend to Vercel and containerized Express backend with Docker on EC2, configuring 3 environment stages and a Nginx reverse proxy routing /api traffic to port 3000."
GOOD: "Refactored monolithic route handlers into a service layer with TypeORM repositories, separating auth middleware from business logic to support role-based access across 4 user types."

For the skills object, scan commit messages, PR titles/bodies, README, and language breakdown. Include ONLY categories where you find evidence — omit empty categories.

Return ONLY valid JSON, no markdown fences, no preamble:
{
  "bullets": ["bullet 1", "bullet 2", "bullet 3"],
  "skills": {
    "Languages": ["TypeScript"],
    "Frameworks & Libraries": ["React"]
  }
}

Use these skill category keys when applicable: ${categoryList}. Only include categories with at least one evidenced item.`;
}

export function buildAnalyzeRepoPrompt(data: RepoAnalysisData): string {
  const languageList = Object.entries(data.languages)
    .sort(([, a], [, b]) => b - a)
    .map(([lang]) => lang)
    .join(', ');

  const chronological = [...data.commits].slice(0, 40).reverse();
  const commitLines = chronological
    .map(
      (c, i) =>
        `${i + 1}. "${c.message.split('\n')[0]}"`,
    )
    .join('\n');

  const prLines = data.pullRequests
    .map((pr) => {
      const body = (pr.body ?? '').slice(0, 200);
      return `- ${pr.title}${body ? `: ${body}` : ''}`;
    })
    .join('\n');

  const readmeExcerpt = data.readme.slice(0, 800);

  return `${buildSystemInstruction()}

GitHub data:

Repository: ${data.repoName}
Created: ${data.createdAt}
Stars: ${data.stars}
Languages: ${languageList || 'Unknown'}

Commit timeline (oldest → newest, ${chronological.length} commits — compare adjacent entries to infer decisions):
${commitLines || 'None'}

Merged pull requests by user:
${prLines || 'None'}

README excerpt:
${readmeExcerpt || 'No README available'}`;
}

function normalizeSkills(raw: unknown): Record<string, string[]> {
  if (!raw || typeof raw !== 'object') return {};

  const result: Record<string, string[]> = {};
  for (const [category, items] of Object.entries(raw as Record<string, unknown>)) {
    if (!Array.isArray(items)) continue;
    const strings = items.filter((i): i is string => typeof i === 'string' && i.trim().length > 0);
    if (strings.length > 0) result[category] = strings;
  }
  return result;
}

export function extractAnalyzeRepoResponse(
  parsed: unknown,
  repoName: string,
): AnalyzeRepoResult {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Gemini response is not a JSON object');
  }

  const obj = parsed as Record<string, unknown>;

  if (Array.isArray(obj.bullets)) {
    const bullets = obj.bullets.filter((b): b is string => typeof b === 'string');
    if (bullets.length === 0) throw new Error('Gemini response missing bullet array');
    return { bullets, skills: normalizeSkills(obj.skills) };
  }

  const legacyBullets =
    obj[repoName] ??
    obj.repoName ??
    obj.repo_name ??
    Object.values(obj).find((v) => Array.isArray(v));

  if (!Array.isArray(legacyBullets) || legacyBullets.some((b) => typeof b !== 'string')) {
    throw new Error('Gemini response missing bullet array');
  }

  return { bullets: legacyBullets as string[], skills: {} };
}

/** @deprecated Use extractAnalyzeRepoResponse */
export function extractBulletsFromResponse(
  parsed: unknown,
  repoName: string,
): string[] {
  return extractAnalyzeRepoResponse(parsed, repoName).bullets;
}
