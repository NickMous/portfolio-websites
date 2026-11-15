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

export interface ExampleGroup<P> {
  /** Folder path inside examples/, "" for files at its root. */
  folder: string;
  /** Last part of the folder path, shown in the tree. */
  name: string;
  /** Nesting depth: 0 for top-level folders. */
  depth: number;
  files: (P & { name: string })[];
}

/**
 * Example files as a folder tree, in display order: loose files first, then
 * folders by path. Folders that only hold folders get a group too.
 */
export function exampleGroups<P extends PageRef>(examples: P[]): ExampleGroup<P>[] {
  const groups = new Map<string, ExampleGroup<P>>();
  const group = (folder: string) => {
    let g = groups.get(folder);
    if (!g) {
      const parts = folder.split('/');
      g = { folder, name: folder ? parts.at(-1)! : '', depth: parts.length - 1, files: [] };
      groups.set(folder, g);
    }
    return g;
  };
  for (const p of examples) {
    const cut = p.slug.lastIndexOf('/');
    const folder = cut === -1 ? '' : p.slug.slice(0, cut);
    const parts = folder ? folder.split('/') : [];
    parts.forEach((_, i) => group(parts.slice(0, i + 1).join('/')));
    group(folder).files.push({ ...p, name: p.slug.slice(cut + 1) });
  }
  for (const g of groups.values()) g.files.sort((a, b) => a.name.localeCompare(b.name));
  // Segment by segment, so "a/c" sorts right after "a" and before "a-b".
  const byPath = (a: ExampleGroup<P>, b: ExampleGroup<P>) => {
    const x = a.folder ? a.folder.split('/') : [];
    const y = b.folder ? b.folder.split('/') : [];
    for (let i = 0; i < Math.min(x.length, y.length); i++) {
      const order = x[i]!.localeCompare(y[i]!);
      if (order) return order;
    }
    return x.length - y.length;
  };
  return [...groups.values()].sort(byPath);
}
