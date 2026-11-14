import { z } from 'astro/zod';

export const DOCS_TOPIC = 'imlostincode-docs';

/** The fields we use from GitHub's repository listing. */
export interface GitHubRepo {
  name: string;
  html_url: string;
  description: string | null;
  default_branch: string;
  visibility?: string;
  private: boolean;
  topics?: string[];
}

/**
 * Repos that get docs on imlostincode: the topic AND public. Both privacy
 * fields are checked so a private repo never shows up, even with the topic.
 */
export function selectDocsRepos<R extends GitHubRepo>(repos: R[]): R[] {
  return repos.filter(
    (r) => r.visibility === 'public' && !r.private && (r.topics ?? []).includes(DOCS_TOPIC),
  );
}

const configSchema = z.object({
  /** Small label on the card, e.g. "npm package". */
  kind: z.string().default('Project'),
  color: z.enum(['yellow', 'white', 'blue', 'green']).default('white'),
  status: z.enum(['available', 'in-testing']).default('available'),
  oneLiner: z.object({ en: z.string(), nl: z.string().optional() }).optional(),
});

export interface RepoConfig {
  kind: string;
  color: 'yellow' | 'white' | 'blue' | 'green';
  status: 'available' | 'in-testing';
  oneLiner: { en: string; nl: string };
}

/**
 * Card settings from the repo's `imlostincode.json` (on its default branch).
 * Without the file, the GitHub description is the one-liner. Docs are
 * English-only, so a missing Dutch one-liner falls back to English.
 */
export function parseRepoConfig(raw: string | undefined, repo: GitHubRepo): RepoConfig {
  let parsed;
  try {
    parsed = configSchema.parse(raw === undefined ? {} : JSON.parse(raw));
  } catch (error) {
    throw new Error(`Invalid imlostincode.json in ${repo.name}: ${String(error)}`);
  }
  const en = parsed.oneLiner?.en ?? repo.description ?? '[ONE-LINER]';
  return {
    kind: parsed.kind,
    color: parsed.color,
    status: parsed.status,
    oneLiner: { en, nl: parsed.oneLiner?.nl ?? en },
  };
}
