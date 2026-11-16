/** The fields we use from GitHub's release listing. */
export interface GitHubRelease {
  tag_name: string;
  name: string | null;
  body: string | null;
  published_at: string | null;
  draft: boolean;
  prerelease: boolean;
}

export interface DocsVersion {
  /** URL segment: "main" or "<major>.<minor>". */
  id: string;
  /** Git ref the content comes from: the default branch or a release tag. */
  ref: string;
  /** The default branch: shown with the UNRELEASED bar. */
  unreleased: boolean;
}

export interface VersionSelection {
  /** Picker order: main first, then release lines newest → oldest. */
  versions: DocsVersion[];
  /** Latest release line, or main when there are no releases. */
  defaultVersion: string;
}

// Plain X.Y.Z with an optional "v"; suffixed tags (-beta.1) are pre-releases.
const SEMVER = /^v?(\d+)\.(\d+)\.(\d+)$/;

/**
 * One docs version per major.minor line, from its highest patch release.
 * Drafts and pre-releases never become a docs version.
 */
export function selectVersions(releases: GitHubRelease[], mainBranch = 'main'): VersionSelection {
  const lines = new Map<string, { ref: string; parts: [number, number, number] }>();

  for (const release of releases) {
    if (release.draft || release.prerelease) continue;
    const match = SEMVER.exec(release.tag_name);
    if (!match) continue;
    const parts = [Number(match[1]), Number(match[2]), Number(match[3])] as [
      number,
      number,
      number,
    ];
    const id = `${parts[0]}.${parts[1]}`;
    const current = lines.get(id);
    if (!current || parts[2] > current.parts[2]) lines.set(id, { ref: release.tag_name, parts });
  }

  const released = [...lines.entries()]
    .sort(([, a], [, b]) => b.parts[0] - a.parts[0] || b.parts[1] - a.parts[1])
    .map(([id, { ref }]): DocsVersion => ({ id, ref, unreleased: false }));

  return {
    versions: [{ id: 'main', ref: mainBranch, unreleased: true }, ...released],
    defaultVersion: released[0]?.id ?? 'main',
  };
}

export interface ChangelogEntry {
  tag: string;
  /** The release title, or the tag when it has none. */
  name: string;
  /** Publish date, YYYY-MM-DD. */
  date: string;
  /** The docs version (major.minor) this release belongs to. */
  version: string;
  /** Release notes as written on GitHub (markdown). */
  notes: string;
}

/** The releases that are docs versions, newest first, for the changelog. */
export function changelogEntries(releases: GitHubRelease[]): ChangelogEntry[] {
  return releases
    .flatMap((release) => {
      const match = SEMVER.exec(release.tag_name);
      if (release.draft || release.prerelease || !match) return [];
      const parts = [Number(match[1]), Number(match[2]), Number(match[3])];
      return [{ release, parts }];
    })
    .sort(
      (a, b) => b.parts[0]! - a.parts[0]! || b.parts[1]! - a.parts[1]! || b.parts[2]! - a.parts[2]!,
    )
    .map(({ release, parts }) => ({
      tag: release.tag_name,
      name: release.name?.trim() || release.tag_name,
      date: (release.published_at ?? '').slice(0, 10),
      version: `${parts[0]}.${parts[1]}`,
      notes: release.body?.trim() ?? '',
    }));
}
