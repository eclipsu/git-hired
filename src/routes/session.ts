import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { User } from '../db/entities/User';
import { ResumeSession } from '../db/entities/ResumeSession';
import { AppDataSource } from '../db/dataSource';
import { getOrCreateResumeSession } from '../lib/sessions';
import { ContactInfo } from '../lib/latex';
import {
  buildDisplayNamesFromCache,
  buildRawBulletsFromCache,
} from '../lib/repoCache';

const router = Router();

router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as User;
    const session = await getOrCreateResumeSession(user);

    const selectedRepos = session.selectedRepos ?? [];
    const bullets =
      session.rawBullets ??
      buildRawBulletsFromCache(session.repoAnalysisCache, selectedRepos);

    const displayNames = buildDisplayNamesFromCache(
      session.repoAnalysisCache,
      selectedRepos,
    );

    res.json({
      cachedRepos: session.cachedRepos ?? [],
      reposCachedAt: session.reposCachedAt,
      selectedRepos,
      bullets,
      displayNames,
      selectedBullets: session.selectedBullets ?? null,
      uploadedResumeText: session.uploadedResumeText ?? null,
      uploadedResumeFilename: session.uploadedResumeFilename ?? null,
      userNotes: session.userNotes ?? '',
      contactInfo: session.contactInfo ?? null,
      jobDescription: session.jobDescription ?? '',
      generatedTex: session.generatedTex ?? null,
      tailoredResume: session.tailoredResume ?? null,
    });
  } catch (err) {
    next(err);
  }
});

router.put('/contact', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as User;
    const contactInfo = req.body as ContactInfo;

    if (!contactInfo || typeof contactInfo !== 'object') {
      res.status(400).json({ error: 'contactInfo is required' });
      return;
    }

    const session = await getOrCreateResumeSession(user);
    session.contactInfo = {
      fullName: contactInfo.fullName?.trim() ?? '',
      address: contactInfo.address?.trim() ?? '',
      phone: contactInfo.phone?.trim() ?? '',
      email: contactInfo.email?.trim() ?? '',
      linkedin: contactInfo.linkedin?.trim() ?? '',
      github: contactInfo.github?.trim() ?? '',
    };
    await AppDataSource.getRepository(ResumeSession).save(session);

    res.json({ contactInfo: session.contactInfo });
  } catch (err) {
    next(err);
  }
});

router.put('/notes', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as User;
    const { notes } = req.body as { notes?: string };

    const session = await getOrCreateResumeSession(user);
    session.userNotes = notes ?? '';
    await AppDataSource.getRepository(ResumeSession).save(session);

    res.json({ userNotes: session.userNotes });
  } catch (err) {
    next(err);
  }
});

router.put('/bullets', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as User;
    const { bullets } = req.body as {
      bullets?: { text: string; repo: string; displayName: string; included: boolean }[];
    };

    if (!Array.isArray(bullets)) {
      res.status(400).json({ error: 'bullets must be an array' });
      return;
    }

    const session = await getOrCreateResumeSession(user);
    session.selectedBullets = bullets;

    const rawBullets: Record<string, string[]> = {};
    for (const b of bullets) {
      if (!rawBullets[b.repo]) rawBullets[b.repo] = [];
      rawBullets[b.repo].push(b.text);
    }
    session.rawBullets = rawBullets;

    if (session.repoAnalysisCache) {
      for (const b of bullets) {
        const entry = session.repoAnalysisCache[b.repo];
        if (!entry) continue;
        entry.bullets = rawBullets[b.repo] ?? [];
        entry.displayName = b.displayName;
      }
    }

    await AppDataSource.getRepository(ResumeSession).save(session);
    res.json({ bullets: session.selectedBullets });
  } catch (err) {
    next(err);
  }
});

export default router;
