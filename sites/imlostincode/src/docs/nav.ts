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
  /** Path from the group it sits in, shown in the tree. */
  name: string;
  /** Nesting depth: 0 for groups not inside another group. */
  depth: number;
  files: (P & { name: string })[];
}

/**
 * Example files as a folder tree, in display order: loose files first, then
 * folders by path. A folder without files of its own gets no group; its name
 * goes into the next folder down that has files ("k8s/prod/patches").
 */
export function exampleGroups<P extends PageRef>(examples: P[]): ExampleGroup<P>[] {
  const groups = new Map<string, ExampleGroup<P>>();
  const group = (folder: string) => {
    let g = groups.get(folder);
    if (!g) {
      g = { folder, name: folder, depth: 0, files: [] };
      groups.set(folder, g);
    }
    return g;
  };
  for (const p of examples) {
    const cut = p.slug.lastIndexOf('/');
    const folder = cut === -1 ? '' : p.slug.slice(0, cut);
    group(folder).files.push({ ...p, name: p.slug.slice(cut + 1) });
  }
  for (const g of groups.values()) {
    g.files.sort((a, b) => a.name.localeCompare(b.name));
    // Name and depth relative to the closest folder above that has a group.
    const parts = g.folder ? g.folder.split('/') : [];
    const parents = parts
      .slice(0, -1)
      .map((_, i) => parts.slice(0, i + 1).join('/'))
      .filter((p) => groups.has(p));
    const parent = parents.at(-1);
    g.depth = parents.length;
    if (parent) g.name = g.folder.slice(parent.length + 1);
  }
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
