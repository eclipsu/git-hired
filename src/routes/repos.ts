import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { User } from '../db/entities/User';
import { ResumeSession } from '../db/entities/ResumeSession';
import { AppDataSource } from '../db/dataSource';
import {
  createOctokitForUser,
  countUserCommitsSince,
  daysAgoIso,
} from '../lib/github';
import { getOrCreateResumeSession } from '../lib/sessions';
import {
  type CachedRepo,
  isReposCacheFresh,
} from '../lib/repoCache';

const router = Router();

async function fetchReposFromGitHub(user: User): Promise<CachedRepo[]> {
  const octokit = createOctokitForUser(user);
  const since = daysAgoIso(90);

  const publicRepos = [];
  let page = 1;

  while (true) {
    const { data } = await octokit.repos.listForAuthenticatedUser({
      affiliation: 'owner',
      sort: 'updated',
      per_page: 100,
      page,
    });

    publicRepos.push(...data.filter((repo) => !repo.private));
    if (data.length < 100) break;
    page += 1;
  }

  const reposWithCounts: CachedRepo[] = [];

  for (const repo of publicRepos) {
    const commitCount = await countUserCommitsSince(
      octokit,
      user.username,
      repo.name,
      user.username,
      since,
    );

    reposWithCounts.push({
      name: repo.name,
      description: repo.description,
      primaryLanguage: repo.language,
      stars: repo.stargazers_count,
      forkCount: repo.forks_count,
      commitCount,
      createdAt: repo.created_at ?? new Date().toISOString(),
      updatedAt: repo.updated_at ?? new Date().toISOString(),
      pushedAt: repo.pushed_at ?? repo.updated_at ?? new Date().toISOString(),
    });
  }

  reposWithCounts.sort((a, b) => b.commitCount - a.commitCount);
  return reposWithCounts.slice(0, 20);
}

router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as User;
    const forceRefresh = req.query.refresh === '1';
    const session = await getOrCreateResumeSession(user);

    if (
      !forceRefresh &&
      session.cachedRepos?.length &&
      isReposCacheFresh(session.reposCachedAt)
    ) {
      console.log('[repos] Serving', session.cachedRepos.length, 'cached repos for', user.username);
      res.json({ repos: session.cachedRepos, fromCache: true });
      return;
    }

    const repos = await fetchReposFromGitHub(user);
    session.cachedRepos = repos;
    session.reposCachedAt = new Date();
    await AppDataSource.getRepository(ResumeSession).save(session);

    console.log('[repos] Fetched and cached', repos.length, 'repos for', user.username);
    res.json({ repos, fromCache: false });
  } catch (err) {
    next(err);
  }
});

export default router;
