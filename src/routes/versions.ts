import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { User } from '../db/entities/User';
import { ResumeVersion } from '../db/entities/ResumeVersion';
import { ShareLink } from '../db/entities/ShareLink';
import { AppDataSource } from '../db/dataSource';
import { getOrCreateResumeSession } from '../lib/sessions';
import { generateShortCode } from '../lib/shortCode';

const router = Router();

function publicBaseUrl(req: Request): string {
  const env = process.env.FRONTEND_URL?.replace(/\/$/, '');
  if (env) return env;
  const host = req.get('host') ?? 'localhost:5173';
  const proto = req.protocol;
  return `${proto}://${host}`;
}

router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as User;
    const versions = await AppDataSource.getRepository(ResumeVersion).find({
      where: { user: { id: user.id } },
      order: { createdAt: 'DESC' },
      relations: ['shareLinks'],
    });

    res.json(
      versions.map((v) => ({
        id: v.id,
        name: v.name,
        createdAt: v.createdAt,
        shareLinks: (v.shareLinks ?? []).map((l) => ({
          id: l.id,
          code: l.code,
          clickCount: l.clickCount,
          url: `${publicBaseUrl(req)}/post/${l.code}`,
        })),
      })),
    );
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as User;
    const { name, generatedTex, jobDescription, contactInfo } = req.body as {
      name?: string;
      generatedTex?: string;
      jobDescription?: string;
      contactInfo?: object;
    };

    if (!name?.trim()) {
      res.status(400).json({ error: 'name is required' });
      return;
    }
    if (!generatedTex?.trim()) {
      res.status(400).json({ error: 'generatedTex is required' });
      return;
    }

    const session = await getOrCreateResumeSession(user);

    const version = AppDataSource.getRepository(ResumeVersion).create({
      user,
      name: name.trim(),
      generatedTex,
      jobDescription: jobDescription ?? session.jobDescription ?? '',
      contactInfo: contactInfo ?? session.contactInfo ?? null,
    });
    await AppDataSource.getRepository(ResumeVersion).save(version);

    console.log('[versions] Saved', version.name, 'for', user.username);

    res.json({
      id: version.id,
      name: version.name,
      createdAt: version.createdAt,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as User;
    const version = await AppDataSource.getRepository(ResumeVersion).findOne({
      where: { id: req.params.id, user: { id: user.id } },
      relations: ['shareLinks'],
    });

    if (!version) {
      res.status(404).json({ error: 'Version not found' });
      return;
    }

    res.json({
      id: version.id,
      name: version.name,
      generatedTex: version.generatedTex,
      jobDescription: version.jobDescription,
      createdAt: version.createdAt,
      shareLinks: (version.shareLinks ?? []).map((l) => ({
        id: l.id,
        code: l.code,
        clickCount: l.clickCount,
        url: `${publicBaseUrl(req)}/post/${l.code}`,
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/share', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as User;
    const version = await AppDataSource.getRepository(ResumeVersion).findOne({
      where: { id: req.params.id, user: { id: user.id } },
      relations: ['shareLinks'],
    });

    if (!version) {
      res.status(404).json({ error: 'Version not found' });
      return;
    }

    const existing = version.shareLinks?.[0];
    if (existing) {
      res.json({
        code: existing.code,
        url: `${publicBaseUrl(req)}/post/${existing.code}`,
        clickCount: existing.clickCount,
      });
      return;
    }

    let code = generateShortCode();
    const linkRepo = AppDataSource.getRepository(ShareLink);
    while (await linkRepo.findOne({ where: { code } })) {
      code = generateShortCode();
    }

    const link = linkRepo.create({ version, code, clickCount: 0 });
    await linkRepo.save(link);

    res.json({
      code: link.code,
      url: `${publicBaseUrl(req)}/post/${link.code}`,
      clickCount: 0,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
