import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { compileTexToPdf, getLatexFontStatus } from '../lib/latexCompile';
import { isPdflatexAvailable, pdflatexErrorMessage } from '../lib/pdflatex';

const router = Router();

router.get('/status', requireAuth, (_req: Request, res: Response) => {
  const fonts = getLatexFontStatus();
  res.json({
    available: isPdflatexAvailable(),
    fontAssets: fonts.ok,
    texmfHome: fonts.texmfHome,
    ...(fonts.ok ? {} : { missingFontAssets: fonts.missing }),
  });
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

    try {
      const pdfBuffer = await compileTexToPdf(tex);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="resume.pdf"');
      res.send(pdfBuffer);
    } catch (err) {
      const message =
        err instanceof Error && err.message.includes('Unable to run pdflatex')
          ? pdflatexErrorMessage()
          : err instanceof Error
            ? err.message
            : 'PDF compilation failed';
      res.status(422).json({ error: message });
    }
  } catch (err) {
    next(err);
  }
});

export default router;
