import { describe, expect, it } from 'vitest';
import { selectVersions, type GitHubRelease } from './versions';

const release = (tag_name: string, data: Partial<GitHubRelease> = {}): GitHubRelease => ({
  tag_name,
  draft: false,
  prerelease: false,
  ...data,
});

describe('selectVersions', () => {
  it('keeps the highest patch of each major.minor line, newest line first, after main', () => {
    const { versions } = selectVersions([
      release('v2.1.0'),
      release('v2.1.3'),
      release('v2.1.1'),
      release('v0.3.2'),
      release('v0.4.0'),
      release('v2.0.5'),
    ]);

    expect(versions.map((v) => [v.id, v.ref])).toEqual([
      ['main', 'main'],
      ['2.1', 'v2.1.3'],
      ['2.0', 'v2.0.5'],
      ['0.4', 'v0.4.0'],
      ['0.3', 'v0.3.2'],
    ]);
  });

  it('sorts numerically, not alphabetically', () => {
    const { versions } = selectVersions([
      release('v1.9.0'),
      release('v1.10.0'),
      release('v1.10.2'),
    ]);

    expect(versions.map((v) => v.ref)).toEqual(['main', 'v1.10.2', 'v1.9.0']);
  });

  it('skips drafts, pre-releases and tags that are not semver', () => {
    const { versions } = selectVersions([
      release('v1.0.0'),
      release('v1.1.0', { draft: true }),
      release('v1.2.0', { prerelease: true }),
      release('v1.3.0-beta.1'),
      release('nightly'),
    ]);

    expect(versions.map((v) => v.ref)).toEqual(['main', 'v1.0.0']);
  });

  it('labels main as unreleased and defaults to the latest release', () => {
    const result = selectVersions([release('1.0.0'), release('1.1.0')]);

    expect(result.versions[0]).toMatchObject({ id: 'main', unreleased: true });
    expect(result.defaultVersion).toBe('1.1');
  });

  it('defaults to main when there are no releases', () => {
    const result = selectVersions([]);

    expect(result.versions.map((v) => v.id)).toEqual(['main']);
    expect(result.defaultVersion).toBe('main');
  });

  it('reads main from the repo default branch name', () => {
    const { versions } = selectVersions([], 'master');

    expect(versions[0]).toMatchObject({ id: 'main', ref: 'master' });
  });
});
