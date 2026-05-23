import { Request, Response, NextFunction } from 'express';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (req.isAuthenticated()) {
    next();
    return;
  }
  res.status(401).json({ error: 'Unauthorized' });
}
