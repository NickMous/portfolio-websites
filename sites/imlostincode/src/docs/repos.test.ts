import { describe, expect, it } from 'vitest';
import { parseRepoConfig, selectDocsRepos, type GitHubRepo } from './repos';

const repo = (name: string, data: Partial<GitHubRepo> = {}): GitHubRepo => ({
  name,
  html_url: `https://github.com/NickMous/${name}`,
  description: null,
  default_branch: 'main',
  visibility: 'public',
  private: false,
  topics: ['imlostincode-docs'],
  ...data,
});

describe('selectDocsRepos', () => {
  it('keeps only public repos with the imlostincode-docs topic', () => {
    const selected = selectDocsRepos([
      repo('netstation'),
      repo('no-topic', { topics: ['astro'] }),
      repo('secret', { visibility: 'private', private: true }),
    ]);

    expect(selected.map((r) => r.name)).toEqual(['netstation']);
  });

  it('never lets a private repo through, even when only one of the flags says so', () => {
    const selected = selectDocsRepos([
      repo('flag-only', { private: true }),
      repo('visibility-only', { visibility: 'internal' }),
    ]);

    expect(selected).toEqual([]);
  });
});

describe('parseRepoConfig', () => {
  it('falls back to the GitHub description and neutral defaults without a config file', () => {
    const config = parseRepoConfig(undefined, repo('netstation', { description: 'Boots things.' }));

    expect(config).toEqual({
      kind: 'Project',
      color: 'white',
      status: 'available',
      oneLiner: { en: 'Boots things.', nl: 'Boots things.' },
    });
  });

  it('reads a config file and fills in the Dutch one-liner from English', () => {
    const config = parseRepoConfig(
      JSON.stringify({
        kind: 'Ansible collection',
        color: 'blue',
        status: 'in-testing',
        oneLiner: { en: 'Boots.' },
      }),
      repo('netstation'),
    );

    expect(config).toEqual({
      kind: 'Ansible collection',
      color: 'blue',
      status: 'in-testing',
      oneLiner: { en: 'Boots.', nl: 'Boots.' },
    });
  });

  it('fails the build on an invalid config instead of guessing', () => {
    expect(() => parseRepoConfig('{"color": "purple"}', repo('netstation'))).toThrow(/netstation/);
  });
});
