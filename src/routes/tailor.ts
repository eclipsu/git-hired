import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { User } from '../db/entities/User';
import { ResumeSession } from '../db/entities/ResumeSession';
import { AppDataSource } from '../db/dataSource';
import { ask } from '../lib/gemini';
import { buildTailorPrompt, parseTailorResponse } from '../lib/prompts/tailor';
import { generateLatex } from '../lib/latex';
import { getOrCreateResumeSession } from '../lib/sessions';

const router = Router();

router.post('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as User;
    const {
      bullets,
      notes,
      parsedResumeText,
      jobDescription,
    } = req.body as {
      bullets?: { text: string; repo: string; displayName: string; included: boolean }[];
      notes?: string;
      parsedResumeText?: string;
      jobDescription?: string;
    };

    if (!Array.isArray(bullets) || bullets.length === 0) {
      res.status(400).json({ error: 'bullets must be a non-empty array' });
      return;
    }

    const includedBullets = bullets.filter((b) => b.included);
    const prompt = buildTailorPrompt({
      bullets: includedBullets,
      parsedResumeText,
      userNotes: notes,
      jobDescription,
    });

    let text = await ask(prompt);
    let tailored;
    try {
      tailored = parseTailorResponse(text);
    } catch {
      text = await ask(prompt);
      tailored = parseTailorResponse(text);
    }

    const generatedTex = generateLatex(tailored, user.username);

    const session = await getOrCreateResumeSession(user);
    session.selectedBullets = bullets;
    session.userNotes = notes ?? '';
    session.uploadedResumeText = parsedResumeText ?? session.uploadedResumeText;
    session.jobDescription = jobDescription ?? '';
    session.tailoredResume = tailored;
    session.generatedTex = generatedTex;
    await AppDataSource.getRepository(ResumeSession).save(session);

    console.log('[tailor] Resume generated for', user.username);

    res.json({ tailoredResume: tailored, generatedTex });
  } catch (err) {
    next(err);
  }
});

export default router;
