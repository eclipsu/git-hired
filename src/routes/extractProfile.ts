import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { User } from '../db/entities/User';
import { ResumeSession } from '../db/entities/ResumeSession';
import { AppDataSource } from '../db/dataSource';
import { getOrCreateResumeSession } from '../lib/sessions';
import { extractContactFromResume } from '../lib/extractContact';

const router = Router();

router.post('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as User;
    const { resumeText, githubUsername } = req.body as {
      resumeText?: string;
      githubUsername?: string;
    };

    if (!resumeText || typeof resumeText !== 'string') {
      res.status(400).json({ error: 'resumeText is required' });
      return;
    }

    const session = await getOrCreateResumeSession(user);
    const { contactInfo, missingFields } = await extractContactFromResume(
      resumeText,
      session.contactInfo,
      githubUsername ?? user.username,
    );

    session.contactInfo = contactInfo;
    await AppDataSource.getRepository(ResumeSession).save(session);

    console.log(
      '[extract-profile]',
      user.username,
      '— missing:',
      missingFields.join(', ') || 'none',
    );

    res.json({ profile: contactInfo, missingFields });
  } catch (err) {
    next(err);
  }
});

export default router;
