export interface CachedRepo {
  name: string;
  description: string | null;
  primaryLanguage: string | null;
  stars: number;
  forkCount: number;
  commitCount: number;
  updatedAt: string;
  pushedAt: string;
}

export interface RepoAnalysisEntry {
  bullets: string[];
  displayName: string;
  repoUpdatedAt: string;
  analyzedAt: string;
}

export type RepoAnalysisCache = Record<string, RepoAnalysisEntry>;

/** How long cached repo list is served without hitting GitHub. */
export const REPOS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export function repoFingerprint(repo: { pushedAt?: string; updatedAt: string }): string {
  return repo.pushedAt || repo.updatedAt;
}

export function isReposCacheFresh(cachedAt: Date | string | null | undefined): boolean {
  if (!cachedAt) return false;
  const ts = typeof cachedAt === 'string' ? new Date(cachedAt).getTime() : cachedAt.getTime();
  return Date.now() - ts < REPOS_CACHE_TTL_MS;
}

export function buildRawBulletsFromCache(
  cache: RepoAnalysisCache | null | undefined,
  repoNames: string[],
): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  if (!cache) return result;
  for (const name of repoNames) {
    if (cache[name]?.bullets?.length) {
      result[name] = cache[name].bullets;
    }
  }
  return result;
}

export function buildDisplayNamesFromCache(
  cache: RepoAnalysisCache | null | undefined,
  repoNames: string[],
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const name of repoNames) {
    result[name] = cache?.[name]?.displayName ?? name;
  }
  return result;
}
