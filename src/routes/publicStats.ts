import { Router, Request, Response, NextFunction } from 'express';
import { getPublicStats } from '../lib/platformStats';

const router = Router();

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

router.get('/public', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
    if (isRateLimited(ip)) {
      res.status(429).json({ error: 'Too many requests' });
      return;
    }

    const stats = await getPublicStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

export default router;
