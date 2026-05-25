import { Octokit } from '@octokit/rest';
import { RequestError } from '@octokit/request-error';
import { User } from '../db/entities/User';
import { decrypt } from '../utils/crypto';

export function createOctokitForUser(user: User): Octokit {
  return new Octokit({ auth: decrypt(user.accessToken) });
}

export function daysAgoIso(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

export function formatResumeMonthYear(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}

/** Resume-style project date range from GitHub created_at / pushed_at. */
export function formatProjectDateRange(createdAt: string, pushedAt?: string): string {
  const start = formatResumeMonthYear(createdAt);
  if (!pushedAt) return start;

  const endFormatted = formatResumeMonthYear(pushedAt);
  if (start === endFormatted) return start;

  const daysSincePush = (Date.now() - new Date(pushedAt).getTime()) / 86400000;
  const end = daysSincePush <= 60 ? 'Present' : endFormatted;
  return `${start} -- ${end}`;
}

function isEmptyOrMissingRepoError(err: unknown): boolean {
  if (!(err instanceof RequestError)) return false;
  if (err.status === 404) return true;
  if (err.status === 409) return true;
  return err.message.toLowerCase().includes('empty');
}

export async function countUserCommitsSince(
  octokit: Octokit,
  owner: string,
  repo: string,
  username: string,
  since: string,
): Promise<number> {
  let count = 0;
  let page = 1;

  try {
    while (true) {
      const { data } = await octokit.repos.listCommits({
        owner,
        repo,
        author: username,
        since,
        per_page: 100,
        page,
      });

      count += data.length;
      if (data.length < 100) break;
      page += 1;
    }
  } catch (err) {
    if (isEmptyOrMissingRepoError(err)) return 0;
    throw err;
  }

  return count;
}

export interface CommitDetail {
  message: string;
  filesChanged: number;
  additions: number;
  deletions: number;
}

export interface RepoAnalysisData {
  repoName: string;
  createdAt: string;
  pushedAt: string;
  stars: number;
  languages: Record<string, number>;
  commits: CommitDetail[];
  pullRequests: { title: string; body: string }[];
  readme: string;
}

export async function fetchRepoAnalysisData(
  octokit: Octokit,
  owner: string,
  repoName: string,
  username: string,
): Promise<RepoAnalysisData> {
  const { data: repoMeta } = await octokit.repos.get({ owner, repo: repoName });

  let commits: Awaited<ReturnType<typeof octokit.repos.listCommits>>['data'] = [];
  try {
    ({ data: commits } = await octokit.repos.listCommits({
      owner,
      repo: repoName,
      author: username,
      per_page: 100,
    }));
  } catch (err) {
    if (!isEmptyOrMissingRepoError(err)) throw err;
  }

  const commitDetails: CommitDetail[] = [];
  for (const commit of commits) {
    try {
      const { data: detail } = await octokit.repos.getCommit({
        owner,
        repo: repoName,
        ref: commit.sha,
      });
      commitDetails.push({
        message: detail.commit.message,
        filesChanged: detail.files?.length ?? 0,
        additions: detail.stats?.additions ?? 0,
        deletions: detail.stats?.deletions ?? 0,
      });
    } catch {
      commitDetails.push({
        message: commit.commit.message,
        filesChanged: 0,
        additions: 0,
        deletions: 0,
      });
    }
  }

  let languages: Record<string, number> = {};
  try {
    const { data: langs } = await octokit.repos.listLanguages({ owner, repo: repoName });
    languages = langs;
  } catch {
    languages = {};
  }

  const { data: prs } = await octokit.pulls.list({
    owner,
    repo: repoName,
    state: 'closed',
    per_page: 50,
  }).catch((err) => {
    if (isEmptyOrMissingRepoError(err)) return { data: [] };
    throw err;
  });

  const mergedByUser = prs
    .filter((pr) => pr.user?.login === username && pr.merged_at !== null)
    .slice(0, 10)
    .map((pr) => ({
      title: pr.title,
      body: pr.body ?? '',
    }));

  let readme = '';
  try {
    const { data: readmeData } = await octokit.repos.getReadme({ owner, repo: repoName });
    readme = Buffer.from(readmeData.content, 'base64').toString('utf-8');
  } catch {
    readme = '';
  }

  return {
    repoName,
    createdAt: repoMeta.created_at ?? new Date().toISOString(),
    pushedAt: repoMeta.pushed_at ?? repoMeta.updated_at ?? new Date().toISOString(),
    stars: repoMeta.stargazers_count,
    languages,
    commits: commitDetails,
    pullRequests: mergedByUser,
    readme,
  };
}

export const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));
