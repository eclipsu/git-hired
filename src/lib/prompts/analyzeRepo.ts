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

function buildSystemInstruction(repoName: string): string {
  const categoryList = SKILL_CATEGORIES.map((c) => `"${c}"`).join(', ');

  return `You are an expert technical resume writer. I will give you GitHub data for a repository. Generate 2–4 professional resume bullet points AND infer technical skills evidenced in the repo data.

Each bullet MUST:
- Start with a strong past-tense action verb (Architected, Engineered, Implemented, Designed, Automated, Migrated, etc.)
- Include exact specifics: number of endpoints, entities, modules, strategies, files, steps, retries, limits, etc.
- Name the actual patterns and technologies used (RBAC, JWT, WebSocket, OAuth, etc.)
- Include concrete constraints where present (file size caps, token expiry, pagination size, MIME types, permission counts)
- Be 1–2 lines max, zero filler words ("robust", "comprehensive", "optimized" are banned unless followed by proof)

BAD: "Implemented a robust deployment strategy across Vercel and EC2, including Dockerization."
GOOD: "Deployed frontend to Vercel and containerized Express backend with Docker on EC2, configuring 3 environment stages and a Nginx reverse proxy routing /api traffic to port 3000."

For the skills object, scan commit messages, PR titles/bodies, README, and language breakdown. Include ONLY categories where you find evidence — omit empty categories. Explicitly look for:
- Computer Science concepts (e.g., data structures, algorithms, concurrency, distributed systems)
- Software design patterns (e.g., MVC, observer, factory, singleton, repository pattern)
- Documentation practices (e.g., API docs, Swagger/OpenAPI, JSDoc, technical writing)
- Networking (e.g., TCP/IP, HTTP/REST, WebSockets, DNS, load balancing)
- Firmware (e.g., embedded C, RTOS, microcontrollers, device drivers)
- Kubernetes & container orchestration (e.g., Docker, K8s, Helm, ECS, pod deployment)
- Research methodologies (e.g., literature review, experimental design, statistical analysis)

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
    .map(([lang, bytes]) => `${lang} (${bytes} bytes)`)
    .join(', ');

  const commitLines = data.commits
    .slice(0, 40)
    .map(
      (c, i) =>
        `${i + 1}. "${c.message.split('\n')[0]}" — ${c.filesChanged} files, +${c.additions}/-${c.deletions}`,
    )
    .join('\n');

  const prLines = data.pullRequests
    .map((pr) => {
      const body = (pr.body ?? '').slice(0, 200);
      return `- ${pr.title}${body ? `: ${body}` : ''}`;
    })
    .join('\n');

  const readmeExcerpt = data.readme.slice(0, 500);

  return `${buildSystemInstruction(data.repoName)}

GitHub data:

Repository: ${data.repoName}
Created: ${data.createdAt}
Stars: ${data.stars}
Languages: ${languageList || 'Unknown'}

Commit messages (top ${Math.min(data.commits.length, 40)}):
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

  // New schema: { bullets: [...], skills: {...} }
  if (Array.isArray(obj.bullets)) {
    const bullets = obj.bullets.filter((b): b is string => typeof b === 'string');
    if (bullets.length === 0) throw new Error('Gemini response missing bullet array');
    return { bullets, skills: normalizeSkills(obj.skills) };
  }

  // Legacy schema: { "repoName": ["bullet 1", ...] }
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
