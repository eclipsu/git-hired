import { RepoAnalysisData } from '../github';

const SYSTEM_INSTRUCTION = `You are an expert technical resume writer. Given GitHub repository data, generate 2–4 professional resume bullet points. Each bullet must start with a strong past-tense action verb, include specific metrics where inferable, be ATS-optimized, and be 1–2 lines max. Return ONLY raw JSON, no markdown, no preamble: { "repoName": ["bullet 1", "bullet 2"] }`;

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

  return `${SYSTEM_INSTRUCTION}

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
  const bullets = obj[repoName] ?? obj.repoName ?? Object.values(obj)[0];

  if (!Array.isArray(bullets) || bullets.some((b) => typeof b !== 'string')) {
    throw new Error('Gemini response missing bullet array');
  }

  return bullets;
}
