import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { User } from '../db/entities/User';
import {
  createOctokitForUser,
  countUserCommitsSince,
  daysAgoIso,
} from '../lib/github';

const router = Router();

interface RepoSummary {
  name: string;
  description: string | null;
  primaryLanguage: string | null;
  stars: number;
  forkCount: number;
  commitCount: number;
  updatedAt: string;
}

router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as User;
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

    const reposWithCounts: RepoSummary[] = [];

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
        updatedAt: repo.updated_at ?? new Date().toISOString(),
      });
    }

    reposWithCounts.sort((a, b) => b.commitCount - a.commitCount);
    res.json(reposWithCounts.slice(0, 20));
  } catch (err) {
    next(err);
  }
});

export default router;
