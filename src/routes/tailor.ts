import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { User } from '../db/entities/User';
import { ResumeSession } from '../db/entities/ResumeSession';
import { AppDataSource } from '../db/dataSource';
import { ask } from '../lib/gemini';
import {
  applyProjectDatesFromRepos,
  buildTailorPrompt,
  parseTailorResponse,
  type RepoDateMeta,
} from '../lib/prompts/tailor';
import { ContactInfo } from '../lib/latex';
import { formatProjectDateRange } from '../lib/github';
import { aggregateRepoSkills } from '../lib/repoCache';
import { getOrCreateResumeSession } from '../lib/sessions';
import { fitResumeToOnePage } from '../lib/resumeFit';
import { computeAtsMatch, computePassedAts, tailoredResumeToText } from '../lib/atsMatch';
import { recordGeneration } from '../lib/platformStats';

const router = Router();

router.post('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as User;
    const {
      bullets,
      notes,
      parsedResumeText,
      jobDescription,
      contactInfo,
      projectNotes,
    } = req.body as {
      bullets?: { text: string; repo: string; displayName: string; included: boolean }[];
      notes?: string;
      parsedResumeText?: string;
      jobDescription?: string;
      contactInfo?: ContactInfo;
      projectNotes?: Record<string, string>;
    };

    if (!Array.isArray(bullets) || bullets.length === 0) {
      res.status(400).json({ error: 'bullets must be a non-empty array' });
      return;
    }

    const includedBullets = bullets.filter((b) => b.included);

    const session = await getOrCreateResumeSession(user);
    const resumeText = parsedResumeText?.trim() || session.uploadedResumeText?.trim() || undefined;

    const repoMeta: RepoDateMeta[] = [];
    const seenRepos = new Set<string>();
    for (const bullet of includedBullets) {
      if (seenRepos.has(bullet.repo)) continue;
      seenRepos.add(bullet.repo);

      const cached = session.cachedRepos?.find((r) => r.name === bullet.repo);
      const analysis = session.repoAnalysisCache?.[bullet.repo];
      const createdAt = cached?.createdAt ?? analysis?.createdAt;
      const pushedAt = cached?.pushedAt ?? analysis?.pushedAt;
      if (!createdAt) continue;

      repoMeta.push({
        repo: bullet.repo,
        displayName: bullet.displayName,
        createdAt,
        pushedAt,
      });
    }

    const repoDates = repoMeta.map((m) => ({
      displayName: m.displayName,
      dates: formatProjectDateRange(m.createdAt, m.pushedAt),
    }));

    const selectedRepoNames = [...new Set(includedBullets.map((b) => b.repo))];
    const repoSkills = aggregateRepoSkills(session.repoAnalysisCache, selectedRepoNames);

    const notesByRepo = projectNotes ?? session.projectNotes ?? {};
    const projectContext = selectedRepoNames.map((repo) => {
      const analysis = session.repoAnalysisCache?.[repo];
      const cached = session.cachedRepos?.find((r) => r.name === repo);
      const bullet = includedBullets.find((b) => b.repo === repo);
      return {
        displayName: bullet?.displayName ?? analysis?.displayName ?? repo,
        readmeExcerpt: analysis?.readmeExcerpt,
        userNotes: notesByRepo[repo] ?? analysis?.projectNotes,
        description: cached?.description,
      };
    });

    const prompt = buildTailorPrompt({
      bullets: includedBullets,
      parsedResumeText: resumeText,
      userNotes: notes,
      jobDescription,
      repoDates,
      repoSkills,
      projectContext,
    });

    const text = await ask(prompt);
    let tailored = parseTailorResponse(text);
    tailored = applyProjectDatesFromRepos(tailored, includedBullets, repoMeta);

    if (!contactInfo?.fullName || !contactInfo.phone || !contactInfo.email || !contactInfo.github) {
      res.status(400).json({ error: 'Contact info is incomplete. Please fill in name, phone, email, and GitHub.' });
      return;
    }

    const contact: ContactInfo = {
      fullName: contactInfo.fullName,
      address: contactInfo.address ?? '',
      phone: contactInfo.phone,
      email: contactInfo.email,
      linkedin: contactInfo.linkedin ?? '',
      github: contactInfo.github,
    };

    const fit = await fitResumeToOnePage(tailored, contact);
    tailored = fit.resume;
    const generatedTex = fit.tex;

    session.selectedBullets = bullets;
    session.userNotes = notes ?? '';
    session.projectNotes = notesByRepo;
    if (resumeText) session.uploadedResumeText = resumeText;
    session.jobDescription = jobDescription ?? '';
    session.contactInfo = contactInfo;
    session.tailoredResume = tailored;
    session.generatedTex = generatedTex;
    await AppDataSource.getRepository(ResumeSession).save(session);

    const jd = jobDescription ?? session.jobDescription ?? '';
    const hasJobDescription = Boolean(jd.trim());
    const atsMatchPercent = hasJobDescription
      ? computeAtsMatch(jd, tailoredResumeToText(tailored))
      : 0;
    const passedAts = computePassedAts(fit.pageCount, hasJobDescription, atsMatchPercent);
    const durationMs = session.analyzeCompletedAt
      ? Date.now() - session.analyzeCompletedAt.getTime()
      : null;

    await recordGeneration({
      user,
      durationMs,
      pageCount: fit.pageCount,
      fitIterations: fit.fitIterations,
      hasJobDescription,
      atsMatchPercent,
      passedAts,
    });

    console.log('[tailor] Resume generated for', user.username, `(${fit.pageCount} page(s), ${fit.fitIterations} fit pass(es))`);

    res.json({
      tailoredResume: tailored,
      generatedTex,
      pageCount: fit.pageCount,
      fitIterations: fit.fitIterations,
      fitWarning: fit.fitWarning,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
