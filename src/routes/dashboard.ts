import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { User } from '../db/entities/User';
import { ResumeVersion } from '../db/entities/ResumeVersion';
import { ShareLink } from '../db/entities/ShareLink';
import { AppDataSource } from '../db/dataSource';
import { getOrCreateResumeSession } from '../lib/sessions';

const router = Router();

router.get('/stats', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as User;
    const session = await getOrCreateResumeSession(user);

    const repos = session.cachedRepos ?? [];
    const commits = repos.reduce((sum, r) => sum + (r.commitCount ?? 0), 0);
    const languages = new Set(
      repos.map((r) => r.primaryLanguage).filter(Boolean) as string[],
    );

    const versionCount = await AppDataSource.getRepository(ResumeVersion).count({
      where: { user: { id: user.id } },
    });

    const totalClicks = await AppDataSource.getRepository(ShareLink)
      .createQueryBuilder('link')
      .innerJoin('link.version', 'version')
      .where('version.userId = :userId', { userId: user.id })
      .select('SUM(link.clickCount)', 'total')
      .getRawOne<{ total: string | null }>();

    res.json({
      reposAnalyzed: repos.length,
      commitsAnalyzed: commits,
      technologiesDetected: languages.size,
      projectsSelected: session.selectedRepos?.length ?? 0,
      savedVersions: versionCount,
      totalLinkClicks: Number(totalClicks?.total ?? 0),
      topProjects: repos.slice(0, 5).map((r) => ({
        name: r.name,
        description: r.description,
        primaryLanguage: r.primaryLanguage,
        commitCount: r.commitCount,
        updatedAt: r.updatedAt,
      })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
