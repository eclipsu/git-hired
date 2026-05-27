import { AppDataSource } from '../db/dataSource';
import { PlatformStats } from '../db/entities/PlatformStats';
import { ResumeGenerationEvent } from '../db/entities/ResumeGenerationEvent';
import { User } from '../db/entities/User';

export interface PublicStats {
  resumesGenerated: number;
  atsPassRate: number;
  avgTimeMinutes: number;
}

export interface GenerationRecordInput {
  user: User;
  durationMs: number | null;
  pageCount: number;
  fitIterations: number;
  hasJobDescription: boolean;
  atsMatchPercent: number;
  passedAts: boolean;
}

const CACHE_TTL_MS = 5 * 60 * 1000;

let cachedStats: PublicStats | null = null;
let cacheExpiresAt = 0;

async function getOrCreateStatsRow(): Promise<PlatformStats> {
  const repo = AppDataSource.getRepository(PlatformStats);
  let row = await repo.findOne({ where: { id: 1 } });
  if (!row) {
    row = repo.create({ id: 1 });
    await repo.save(row);
  }
  return row;
}

function derivePublicStats(row: PlatformStats): PublicStats {
  const resumesGenerated = row.resumesGenerated;
  const atsPassRate =
    resumesGenerated > 0 ? Math.round((row.atsPassCount / resumesGenerated) * 100) : 0;
  const avgTimeMinutes =
    row.durationCount > 0
      ? Math.round(row.totalDurationMs / row.durationCount / 60000)
      : 0;

  return { resumesGenerated, atsPassRate, avgTimeMinutes };
}

export function invalidatePublicStatsCache(): void {
  cachedStats = null;
  cacheExpiresAt = 0;
}

export async function recordGeneration(input: GenerationRecordInput): Promise<void> {
  await AppDataSource.transaction(async (manager) => {
    const eventRepo = manager.getRepository(ResumeGenerationEvent);
    const statsRepo = manager.getRepository(PlatformStats);

    const event = eventRepo.create({
      user: input.user,
      durationMs: input.durationMs,
      pageCount: input.pageCount,
      fitIterations: input.fitIterations,
      hasJobDescription: input.hasJobDescription,
      atsMatchPercent: input.atsMatchPercent,
      passedAts: input.passedAts,
    });
    await eventRepo.save(event);

    let stats = await statsRepo.findOne({ where: { id: 1 } });
    if (!stats) {
      stats = statsRepo.create({ id: 1 });
    }

    stats.resumesGenerated += 1;
    if (input.passedAts) {
      stats.atsPassCount += 1;
    }
    if (input.durationMs != null && input.durationMs >= 0) {
      stats.totalDurationMs += input.durationMs;
      stats.durationCount += 1;
    }

    await statsRepo.save(stats);
  });

  invalidatePublicStatsCache();
}

export async function getPublicStats(): Promise<PublicStats> {
  const now = Date.now();
  if (cachedStats && now < cacheExpiresAt) {
    return cachedStats;
  }

  const row = await getOrCreateStatsRow();
  cachedStats = derivePublicStats(row);
  cacheExpiresAt = now + CACHE_TTL_MS;
  return cachedStats;
}

export async function seedResumeCount(count: number): Promise<void> {
  const repo = AppDataSource.getRepository(PlatformStats);
  let row = await repo.findOne({ where: { id: 1 } });
  if (!row) {
    row = repo.create({ id: 1, resumesGenerated: count });
  } else {
    row.resumesGenerated = Math.max(row.resumesGenerated, count);
  }
  await repo.save(row);
  invalidatePublicStatsCache();
}
