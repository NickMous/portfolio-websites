import { execFileSync } from 'node:child_process';
import { OWNER } from './owner';
import { parseRepoConfig, selectDocsRepos, type GitHubRepo, type RepoConfig } from './repos';

/**
 * Token for API rate limits (60 requests/hour without one, too few for a
 * build). CI passes GITHUB_TOKEN; locally the gh CLI login is used.
 */
export function resolveToken(
  env: Record<string, string | undefined>,
  ghToken: () => string,
): string | undefined {
  if (env.GITHUB_TOKEN) return env.GITHUB_TOKEN;
  try {
    return ghToken().trim() || undefined;
  } catch {
    return undefined;
  }
}

const token = resolveToken(process.env, () =>
  execFileSync('gh', ['auth', 'token'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }),
);

/** Error text for a failed API call; a rate limit says how to lift it. */
export function apiError(
  status: number,
  url: string,
  body: string,
  remaining: string | null,
): string {
  if ((status === 403 || status === 429) && (remaining === '0' || /rate limit/i.test(body))) {
    return (
      `GitHub API rate limit hit for ${url}. Log in with \`gh auth login\` ` +
      `or set GITHUB_TOKEN, then build again.`
    );
  }
  return `GitHub API ${status} for ${url}: ${body}`;
}

// One build fetches each URL once, even when several loaders ask for it.
const cache = new Map<string, Promise<Response>>();

async function get(url: string): Promise<Response> {
  let pending = cache.get(url);
  if (!pending) {
    const headers: Record<string, string> = { 'User-Agent': 'imlostincode-docs-loader' };
    if (url.startsWith('https://api.github.com/')) {
      headers.Accept = 'application/vnd.github+json';
      if (token) headers.Authorization = `Bearer ${token}`;
    }
    pending = fetch(url, { headers });
    cache.set(url, pending);
  }
  return (await pending).clone();
}

/** GET a GitHub API path (all pages); a failure fails the build. */
export async function api<T>(path: string): Promise<T> {
  const results: unknown[] = [];
  let url: string | undefined = `https://api.github.com${path}`;
  while (url) {
    const res = await get(url);
    if (!res.ok) {
      const remaining = res.headers.get('x-ratelimit-remaining');
      throw new Error(apiError(res.status, url, await res.text(), remaining));
    }
    const body = (await res.json()) as unknown;
    if (!Array.isArray(body)) return body as T;
    results.push(...body);
    url = /<([^>]+)>;\s*rel="next"/.exec(res.headers.get('link') ?? '')?.[1];
  }
  return results as T;
}

/** A file at a ref, or undefined when it does not exist. */
export async function rawFile(
  repo: string,
  ref: string,
  path: string,
): Promise<string | undefined> {
  const url = `https://raw.githubusercontent.com/${OWNER}/${repo}/${ref}/${path}`;
  const res = await get(url);
  if (res.status === 404) return undefined;
  if (!res.ok) throw new Error(`GitHub raw ${res.status} for ${url}`);
  return res.text();
}

export interface DocsRepo {
  repo: GitHubRepo;
  config: RepoConfig;
}

/** NickMous's public repos with the docs topic, with their card config. */
export async function listDocsRepos(): Promise<DocsRepo[]> {
  // /users/:owner/repos only ever lists public repos; selectDocsRepos checks again.
  const repos = await api<GitHubRepo[]>(`/users/${OWNER}/repos?per_page=100&type=owner`);
  return Promise.all(
    selectDocsRepos(repos).map(async (repo) => ({
      repo,
      config: parseRepoConfig(
        await rawFile(repo.name, repo.default_branch, 'imlostincode.json'),
        repo,
      ),
    })),
  );
}
