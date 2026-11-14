/** The fields navigation needs from a docs page. */
export interface PageRef {
  version: string;
  section: 'overview' | 'doc' | 'example';
  slug: string;
  order: number;
}

const byOrder = (a: PageRef, b: PageRef) => a.order - b.order || a.slug.localeCompare(b.slug);

/** Docs pages of one version, in sidebar order. */
export function docsOf<P extends PageRef>(pages: P[], version: string): P[] {
  return pages.filter((p) => p.version === version && p.section === 'doc').sort(byOrder);
}

/**
 * Where the version picker goes: the same page in the other version, else that
 * version's first page in the same tab, else its overview.
 */
export function versionTarget<P extends PageRef>(
  pages: P[],
  current: PageRef,
  version: string,
): P | undefined {
  const inVersion = pages.filter((p) => p.version === version);
  const same = inVersion.find((p) => p.section === current.section && p.slug === current.slug);
  if (same) return same;
  const sameTab = inVersion.filter((p) => p.section === current.section).sort(byOrder)[0];
  return sameTab ?? inVersion.find((p) => p.section === 'overview');
}

/** Previous and next page within an ordered list of docs. */
export function prevNext<P extends PageRef>(
  docs: P[],
  slug: string,
): { prev: P | undefined; next: P | undefined } {
  const i = docs.findIndex((p) => p.slug === slug);
  return { prev: i > 0 ? docs[i - 1] : undefined, next: i >= 0 ? docs[i + 1] : undefined };
}
