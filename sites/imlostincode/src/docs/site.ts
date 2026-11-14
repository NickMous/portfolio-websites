import { getCollection, type CollectionEntry } from 'astro:content';

export type Fix = CollectionEntry<'fixes'>['data'];
export type Page = CollectionEntry<'docs'>['data'];

/** Every docs repo with all of its pages, for getStaticPaths. */
export async function docsSite(): Promise<{ fix: Fix; pages: Page[] }[]> {
  const pages = (await getCollection('docs')).map((e) => e.data);
  return (await getCollection('fixes')).map(({ data: fix }) => ({
    fix,
    pages: pages.filter((p) => p.repo === fix.name),
  }));
}
