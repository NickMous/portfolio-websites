import type { Loader } from 'astro/loaders';
import { docFile, docTitle, renderCodeFile, renderMarkdown, type RenderContext } from './content';
import { api, listDocsRepos, rawFile } from './github';
import { OWNER } from './owner';
import type { RepoConfig } from './repos';
import { docsUrls, exampleLink } from './urls';
import { selectVersions, type DocsVersion, type GitHubRelease } from './versions';

export interface Fix extends RepoConfig {
  name: string;
  url: string;
  versions: DocsVersion[];
  defaultVersion: string;
}

export interface DocsPage {
  repo: string;
  version: string;
  section: 'overview' | 'doc' | 'example';
  /** Doc slug, or the file path inside examples/. */
  slug: string;
  title: string;
  order: number;
  /** Path in the repo, for "Edit this page on GitHub". */
  path: string;
  ref: string;
  html: string;
}

interface TreeEntry {
  path: string;
  type: 'blob' | 'tree';
  size?: number;
}

// Example files above this size are left out rather than dumped on a page.
const MAX_EXAMPLE_BYTES = 100_000;

async function loadVersion(fix: Fix, version: DocsVersion): Promise<DocsPage[]> {
  const { name: repo } = fix;
  const { ref } = version;
  const tree = await api<{ tree: TreeEntry[]; truncated: boolean }>(
    `/repos/${OWNER}/${repo}/git/trees/${encodeURIComponent(ref)}?recursive=1`,
  );
  if (tree.truncated)
    throw new Error(`Git tree of ${repo}@${ref} is too large to list in one call`);

  const blobs = tree.tree.filter((e) => e.type === 'blob');
  const examples = blobs.filter(
    (e) => e.path.startsWith('examples/') && (e.size ?? 0) <= MAX_EXAMPLE_BYTES,
  );
  const exampleFiles = new Set(examples.map((e) => e.path.slice('examples/'.length)));

  const ctx = (filePath: string): RenderContext => ({
    repo,
    ref,
    filePath,
    urls: {
      overview: () => docsUrls.overview(repo, version.id, fix.defaultVersion),
      doc: (slug) => docsUrls.doc(repo, version.id, slug),
      example: (path) => exampleLink(repo, version.id, path, exampleFiles),
    },
  });
  const read = async (path: string) => {
    const text = await rawFile(repo, ref, path);
    if (text === undefined) throw new Error(`${repo}@${ref}: ${path} listed but not found`);
    return text;
  };
  const page = (data: Omit<DocsPage, 'repo' | 'version' | 'ref'>): DocsPage => ({
    repo,
    version: version.id,
    ref,
    ...data,
  });

  const pages: Promise<DocsPage>[] = [];

  const readme = blobs.find((e) => /^readme\.md$/i.test(e.path));
  if (readme) {
    pages.push(
      read(readme.path).then(async (raw) => {
        // The header already shows the project name; drop a README title that repeats it.
        const name = repo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const md = raw.replace(new RegExp(`^\\s*# +${name}\\s*\\n`, 'i'), '');
        return page({
          section: 'overview',
          slug: '',
          title: fix.name,
          order: 0,
          path: readme.path,
          html: await renderMarkdown(md, ctx(readme.path)),
        });
      }),
    );
  }

  for (const entry of blobs.filter((e) => /^docs\/[^/]+\.md$/i.test(e.path))) {
    const filename = entry.path.slice('docs/'.length);
    const { order, slug } = docFile(filename);
    pages.push(
      read(entry.path).then(async (md) =>
        page({
          section: 'doc',
          slug,
          title: docTitle(md, filename),
          order,
          path: entry.path,
          html: await renderMarkdown(md, ctx(entry.path)),
        }),
      ),
    );
  }

  examples.forEach((entry, i) => {
    const slug = entry.path.slice('examples/'.length);
    pages.push(
      read(entry.path).then(async (text) =>
        page({
          section: 'example',
          slug,
          title: slug,
          order: i,
          path: entry.path,
          html: /\.md$/i.test(entry.path)
            ? await renderMarkdown(text, ctx(entry.path))
            : await renderCodeFile(text, entry.path, ctx(entry.path)),
        }),
      ),
    );
  });

  return Promise.all(pages);
}

/** Everything both collections need, fetched once per build. */
let everything: Promise<{ fixes: Fix[]; pages: DocsPage[] }> | undefined;

function loadEverything() {
  everything ??= (async () => {
    const fixes: Fix[] = await Promise.all(
      (await listDocsRepos()).map(async ({ repo, config }) => {
        const releases = await api<GitHubRelease[]>(
          `/repos/${OWNER}/${repo.name}/releases?per_page=100`,
        );
        const { versions, defaultVersion } = selectVersions(releases, repo.default_branch);
        return { name: repo.name, url: repo.html_url, ...config, versions, defaultVersion };
      }),
    );
    const pages = (
      await Promise.all(fixes.flatMap((fix) => fix.versions.map((v) => loadVersion(fix, v))))
    ).flat();
    return { fixes, pages };
  })();
  return everything;
}

/** One entry per docs repo (the cards on the homepage and the docs headers). */
export function fixesLoader(): Loader {
  return {
    name: 'imlostincode-fixes',
    load: async ({ store, parseData, logger }) => {
      const { fixes } = await loadEverything();
      store.clear();
      for (const fix of fixes) {
        store.set({ id: fix.name, data: await parseData({ id: fix.name, data: { ...fix } }) });
      }
      logger.info(`${fixes.length} docs repos`);
    },
  };
}

/** One entry per overview, doc page and example file, per version. */
export function docsLoader(): Loader {
  return {
    name: 'imlostincode-docs',
    load: async ({ store, parseData, logger }) => {
      const { pages } = await loadEverything();
      store.clear();
      for (const p of pages) {
        const id = `${p.repo}/${p.version}/${p.section}/${p.slug}`;
        store.set({ id, data: await parseData({ id, data: { ...p } }) });
      }
      logger.info(`${pages.length} docs pages`);
    },
  };
}
