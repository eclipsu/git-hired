import { Router, Request, Response, NextFunction } from 'express';
import { Readable } from 'stream';
import latex from 'node-latex';
import { requireAuth } from '../middleware/requireAuth';
import { isPdflatexAvailable, pdflatexErrorMessage } from '../lib/pdflatex';

const router = Router();

router.get('/status', requireAuth, (_req: Request, res: Response) => {
  res.json({ available: isPdflatexAvailable() });
});

router.post('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!isPdflatexAvailable()) {
      res.status(503).json({ error: pdflatexErrorMessage() });
      return;
    }

    const { tex } = req.body as { tex?: string };

    if (!tex || typeof tex !== 'string') {
      res.status(400).json({ error: 'tex is required' });
      return;
    }

    const input = Readable.from([tex]);
    const pdf = latex(input, { errorLogs: 'buffer' as unknown as string });
    const chunks: Buffer[] = [];

    pdf.on('data', (chunk: Buffer) => chunks.push(chunk));
    pdf.on('end', () => {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="resume.pdf"');
      res.send(Buffer.concat(chunks));
    });
    pdf.on('error', (err: Error) => {
      const message = err.message.includes('Unable to run pdflatex')
        ? pdflatexErrorMessage()
        : err.message;
      res.status(422).json({ error: message });
    });
  } catch (err) {
    next(err);
  }
});

export default router;
