import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';

const router = Router();

function clientUrl(path: string): string {
  const base = process.env.FRONTEND_URL?.replace(/\/$/, '') ?? '';
  return `${base}${path}`;
}

router.get('/github', passport.authenticate('github'));

router.get(
  '/github/callback',
  passport.authenticate('github', {
    failureRedirect: clientUrl('/'),
  }),
  (_req: Request, res: Response) => {
    res.redirect(clientUrl('/app'));
  },
);

router.get('/logout', (req: Request, res: Response, next: NextFunction) => {
  req.logout((err) => {
    if (err) {
      next(err);
      return;
    }
    req.session.destroy(() => {
      res.redirect(clientUrl('/'));
    });
  });
});

export default router;
