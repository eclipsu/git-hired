import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { User } from '../db/entities/User';
import { ResumeSession } from '../db/entities/ResumeSession';
import { AppDataSource } from '../db/dataSource';
import { ask } from '../lib/gemini';
import { buildTailorPrompt, parseTailorResponse } from '../lib/prompts/tailor';
import { ContactInfo, generateLatex } from '../lib/latex';
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
      contactInfo,
    } = req.body as {
      bullets?: { text: string; repo: string; displayName: string; included: boolean }[];
      notes?: string;
      parsedResumeText?: string;
      jobDescription?: string;
      contactInfo?: ContactInfo;
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

    const text = await ask(prompt);
    const tailored = parseTailorResponse(text);

    if (!contactInfo?.fullName || !contactInfo.phone || !contactInfo.email || !contactInfo.github) {
      res.status(400).json({ error: 'Contact info is incomplete. Please fill in name, phone, email, and GitHub.' });
      return;
    }

    const generatedTex = generateLatex(tailored, {
      fullName: contactInfo.fullName,
      address: contactInfo.address ?? '',
      phone: contactInfo.phone,
      email: contactInfo.email,
      linkedin: contactInfo.linkedin ?? '',
      github: contactInfo.github,
    });

    const session = await getOrCreateResumeSession(user);
    session.selectedBullets = bullets;
    session.userNotes = notes ?? '';
    session.uploadedResumeText = parsedResumeText ?? session.uploadedResumeText;
    session.jobDescription = jobDescription ?? '';
    session.contactInfo = contactInfo;
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
