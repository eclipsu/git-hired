import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { User } from '../db/entities/User';
import { ResumeSession } from '../db/entities/ResumeSession';
import { AppDataSource } from '../db/dataSource';
import { createOctokitForUser, delay, fetchRepoAnalysisData } from '../lib/github';
import { ask } from '../lib/gemini';
import {
  buildAnalyzeRepoPrompt,
  extractBulletsFromResponse,
} from '../lib/prompts/analyzeRepo';
import { getOrCreateResumeSession } from '../lib/sessions';

const router = Router();

interface RepoInput {
  name: string;
  displayName: string;
}

async function askGeminiForBullets(
  prompt: string,
  repoName: string,
): Promise<string[]> {
  let text = await ask(prompt);

  try {
    const parsed = JSON.parse(text);
    return extractBulletsFromResponse(parsed, repoName);
  } catch {
    text = await ask(prompt);
    const parsed = JSON.parse(text);
    return extractBulletsFromResponse(parsed, repoName);
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

    const octokit = createOctokitForUser(user);
    const rawBullets: Record<string, string[]> = {};
    const displayNames: Record<string, string> = {};

    for (let i = 0; i < repos.length; i += 1) {
      const { name, displayName } = repos[i];
      displayNames[name] = displayName || name;

      if (i > 0) {
        await delay(100);
      }

      const repoData = await fetchRepoAnalysisData(
        octokit,
        user.username,
        name,
        user.username,
      );

      const prompt = buildAnalyzeRepoPrompt(repoData);
      rawBullets[name] = await askGeminiForBullets(prompt, name);
    }

    const session = await getOrCreateResumeSession(user);
    session.selectedRepos = repos.map((r) => r.name);
    session.rawBullets = rawBullets;
    await AppDataSource.getRepository(ResumeSession).save(session);

    console.log('[analyze] Generated bullets for repos:', Object.keys(rawBullets));

    res.json({ bullets: rawBullets, displayNames });
  } catch (err) {
    next(err);
  }
});

export default router;
