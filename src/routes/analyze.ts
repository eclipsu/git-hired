import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { User } from '../db/entities/User';
import { ResumeSession } from '../db/entities/ResumeSession';
import { AppDataSource } from '../db/dataSource';
import { createOctokitForUser, delay, fetchRepoAnalysisData } from '../lib/github';
import { ask, parseJsonFromText } from '../lib/gemini';
import {
  buildAnalyzeRepoPrompt,
  extractAnalyzeRepoResponse,
} from '../lib/prompts/analyzeRepo';
import { getOrCreateResumeSession } from '../lib/sessions';
import {
  repoFingerprint,
} from '../lib/repoCache';

const router = Router();

interface RepoInput {
  name: string;
  displayName: string;
}

async function askGeminiForRepoAnalysis(
  prompt: string,
  repoName: string,
) {
  const text = await ask(prompt);
  const parsed = parseJsonFromText<unknown>(text);
  return extractAnalyzeRepoResponse(parsed, repoName);
}

function getCachedRepoUpdatedAt(
  session: ResumeSession,
  repoName: string,
): string | null {
  const cached = session.cachedRepos?.find((r) => r.name === repoName);
  if (!cached) return null;
  return repoFingerprint(cached);
}

function isBulletCacheValid(
  session: ResumeSession,
  repoName: string,
): boolean {
  const entry = session.repoAnalysisCache?.[repoName];
  if (!entry?.bullets?.length) return false;

  const currentFingerprint = getCachedRepoUpdatedAt(session, repoName);
  if (!currentFingerprint) return false;

  return entry.repoUpdatedAt === currentFingerprint;
}

async function refreshRepoFingerprints(
  session: ResumeSession,
  user: User,
  repoNames: string[],
): Promise<void> {
  const octokit = createOctokitForUser(user);
  if (!session.cachedRepos) session.cachedRepos = [];

  for (const name of repoNames) {
    try {
      const { data } = await octokit.repos.get({ owner: user.username, repo: name });
      const createdAt = data.created_at ?? new Date().toISOString();
      const pushedAt = data.pushed_at ?? data.updated_at ?? new Date().toISOString();
      const updatedAt = data.updated_at ?? pushedAt;
      const existing = session.cachedRepos.find((r) => r.name === name);

      if (existing) {
        existing.createdAt = createdAt;
        existing.pushedAt = pushedAt;
        existing.updatedAt = updatedAt;
        existing.stars = data.stargazers_count;
        existing.description = data.description;
        existing.primaryLanguage = data.language;
      } else {
        session.cachedRepos.push({
          name,
          description: data.description,
          primaryLanguage: data.language,
          stars: data.stargazers_count,
          forkCount: data.forks_count,
          commitCount: 0,
          createdAt,
          updatedAt,
          pushedAt,
        });
      }
    } catch {
      // repo may have been deleted; skip fingerprint refresh
    }
  }
}

router.post('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as User;
    const body = req.body as {
      repos?: RepoInput[];
      repoNames?: string[];
    };

    let repos: RepoInput[] = [];

    if (Array.isArray(body.repos) && body.repos.length > 0) {
      repos = body.repos;
    } else if (Array.isArray(body.repoNames) && body.repoNames.length > 0) {
      repos = body.repoNames.map((name) => ({ name, displayName: name }));
    }

    if (repos.length === 0) {
      res.status(400).json({ error: 'repos must be a non-empty array' });
      return;
    }

    const session = await getOrCreateResumeSession(user);
    if (!session.repoAnalysisCache) {
      session.repoAnalysisCache = {};
    }

    await refreshRepoFingerprints(session, user, repos.map((r) => r.name));

    const rawBullets: Record<string, string[]> = {};
    const displayNames: Record<string, string> = {};
    const cachedRepos: string[] = [];
    const analyzedRepos: string[] = [];

    const needsGitHubFetch = repos.some((r) => !isBulletCacheValid(session, r.name));

    let octokit = null;
    if (needsGitHubFetch) {
      octokit = createOctokitForUser(user);
    }

    for (let i = 0; i < repos.length; i += 1) {
      const { name, displayName } = repos[i];
      const resolvedDisplayName = displayName || name;
      displayNames[name] = resolvedDisplayName;

      if (isBulletCacheValid(session, name)) {
        const entry = session.repoAnalysisCache![name];
        const cachedRepo = session.cachedRepos?.find((r) => r.name === name);
        if (cachedRepo?.createdAt) {
          entry.createdAt = cachedRepo.createdAt;
          entry.pushedAt = cachedRepo.pushedAt;
        }
        rawBullets[name] = entry.bullets;
        displayNames[name] = entry.displayName || resolvedDisplayName;
        cachedRepos.push(name);
        continue;
      }

      if (i > 0 && octokit) {
        await delay(100);
      }

      analyzedRepos.push(name);

      const repoData = await fetchRepoAnalysisData(
        octokit!,
        user.username,
        name,
        user.username,
      );

      const { bullets, skills } = await askGeminiForRepoAnalysis(
        buildAnalyzeRepoPrompt(repoData),
        name,
      );
      rawBullets[name] = bullets;

      const cachedRepo = session.cachedRepos?.find((r) => r.name === name);
      const repoUpdatedAt =
        getCachedRepoUpdatedAt(session, name) ?? new Date().toISOString();

      session.repoAnalysisCache[name] = {
        bullets,
        skills,
        displayName: resolvedDisplayName,
        createdAt: cachedRepo?.createdAt ?? repoData.createdAt,
        pushedAt: cachedRepo?.pushedAt ?? repoData.pushedAt,
        repoUpdatedAt,
        analyzedAt: new Date().toISOString(),
      };
    }

    session.selectedRepos = repos.map((r) => r.name);
    session.rawBullets = rawBullets;
    await AppDataSource.getRepository(ResumeSession).save(session);

    console.log(
      '[analyze]',
      user.username,
      '— cached:',
      cachedRepos.join(', ') || 'none',
      '| analyzed:',
      analyzedRepos.join(', ') || 'none',
    );

    res.json({
      bullets: rawBullets,
      displayNames,
      cachedRepos,
      analyzedRepos,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
