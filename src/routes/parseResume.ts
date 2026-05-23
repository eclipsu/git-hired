import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import { requireAuth } from '../middleware/requireAuth';
import { User } from '../db/entities/User';
import { ResumeSession } from '../db/entities/ResumeSession';
import { AppDataSource } from '../db/dataSource';
import { getOrCreateResumeSession } from '../lib/sessions';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.post(
  '/',
  requireAuth,
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      const ext = file.originalname.split('.').pop()?.toLowerCase();
      let text = '';

      if (ext === 'pdf') {
        const parsed = await pdfParse(file.buffer);
        text = parsed.text;
      } else if (ext === 'docx') {
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        text = result.value;
      } else {
        res.status(400).json({ error: 'Only PDF and DOCX files are supported' });
        return;
      }

      const user = req.user as User;
      const session = await getOrCreateResumeSession(user);
      session.uploadedResumeText = text;
      await AppDataSource.getRepository(ResumeSession).save(session);

      console.log('[parse-resume] Parsed', file.originalname, `(${text.length} chars)`);

      res.json({ text, filename: file.originalname });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
