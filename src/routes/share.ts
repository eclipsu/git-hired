import { Router, Request, Response, NextFunction } from 'express';
import { Readable } from 'stream';
import latex from 'node-latex';
import { AppDataSource } from '../db/dataSource';
import { ShareLink } from '../db/entities/ShareLink';
import { requireAuth } from '../middleware/requireAuth';
import { User } from '../db/entities/User';
import { isPdflatexAvailable } from '../lib/pdflatex';

const router = Router();

router.get('/:code/pdf', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!isPdflatexAvailable()) {
      res.status(503).json({ error: 'PDF compilation unavailable' });
      return;
    }

    const link = await AppDataSource.getRepository(ShareLink).findOne({
      where: { code: req.params.code },
      relations: ['version'],
    });

    if (!link) {
      res.status(404).json({ error: 'Link not found' });
      return;
    }

    const input = Readable.from([link.version.generatedTex]);
    const pdf = latex(input, { errorLogs: 'buffer' as unknown as string });
    const chunks: Buffer[] = [];

    pdf.on('data', (chunk: Buffer) => chunks.push(chunk));
    pdf.on('end', () => {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="resume.pdf"');
      res.send(Buffer.concat(chunks));
    });
    pdf.on('error', (err: Error) => {
      res.status(422).json({ error: err.message });
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:code', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const link = await AppDataSource.getRepository(ShareLink).findOne({
      where: { code: req.params.code },
      relations: ['version', 'version.user'],
    });

    if (!link) {
      res.status(404).json({ error: 'Link not found' });
      return;
    }

    link.clickCount += 1;
    await AppDataSource.getRepository(ShareLink).save(link);

    res.json({
      name: link.version.name,
      generatedTex: link.version.generatedTex,
      clickCount: link.clickCount,
      createdAt: link.version.createdAt,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as User;
    const links = await AppDataSource.getRepository(ShareLink)
      .createQueryBuilder('link')
      .innerJoinAndSelect('link.version', 'version')
      .where('version.userId = :userId', { userId: user.id })
      .orderBy('link.createdAt', 'DESC')
      .getMany();

    res.json(
      links.map((l) => ({
        id: l.id,
        code: l.code,
        clickCount: l.clickCount,
        createdAt: l.createdAt,
        versionName: l.version.name,
        versionId: l.version.id,
      })),
    );
  } catch (err) {
    next(err);
  }
});

export default router;
