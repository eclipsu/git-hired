import { RepoAnalysisData } from '../github';

function buildSystemInstruction(repoName: string): string {
  return `You are an expert technical resume writer. I will give you GitHub data for a repository. Generate 2–4 professional resume bullet points.

Each bullet MUST:
- Start with a strong past-tense action verb (Architected, Engineered, Implemented, Designed, Automated, Migrated, etc.)
- Include exact specifics: number of endpoints, entities, modules, strategies, files, steps, retries, limits, etc.
- Name the actual patterns and technologies used (RBAC, JWT, WebSocket, OAuth, etc.)
- Include concrete constraints where present (file size caps, token expiry, pagination size, MIME types, permission counts)
- Be 1–2 lines max, zero filler words ("robust", "comprehensive", "optimized" are banned unless followed by proof)

BAD: "Implemented a robust deployment strategy across Vercel and EC2, including Dockerization."
GOOD: "Deployed frontend to Vercel and containerized Express backend with Docker on EC2, configuring 3 environment stages and a Nginx reverse proxy routing /api traffic to port 3000."

Return ONLY valid JSON, no markdown fences, no preamble:
{ "${repoName}": ["bullet 1", "bullet 2", "bullet 3"] }`;
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
Stars: ${data.stars}
Languages: ${languageList || 'Unknown'}

Commit messages (top ${Math.min(data.commits.length, 40)}):
${commitLines || 'None'}

Merged pull requests by user:
${prLines || 'None'}

README excerpt:
${readmeExcerpt || 'No README available'}`;
}

export function extractBulletsFromResponse(
  parsed: unknown,
  repoName: string,
): string[] {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Gemini response is not a JSON object');
  }

  const obj = parsed as Record<string, unknown>;
  const bullets =
    obj[repoName] ??
    obj.repoName ??
    obj.repo_name ??
    Object.values(obj)[0];

  if (!Array.isArray(bullets) || bullets.some((b) => typeof b !== 'string')) {
    throw new Error('Gemini response missing bullet array');
  }

  return bullets;
}
