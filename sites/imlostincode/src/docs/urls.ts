/**
 * URL path of an example file. Leading dots go (".dockerignore" →
 * "dockerignore"): the server refuses dot paths.
 */
export function examplePath(path: string): string {
  return path
    .split('/')
    .map((segment) => segment.replace(/^\.+/, ''))
    .join('/');
}

/** Site URLs for docs pages, shared by the loader (link rewriting) and the pages. */
export const docsUrls = {
  /** Overview of the default version: the project's landing page. */
  repo: (repo: string) => `/${repo}/`,
  overview: (repo: string, version: string, defaultVersion: string) =>
    version === defaultVersion ? `/${repo}/` : `/${repo}/overview/${version}/`,
  doc: (repo: string, version: string, slug: string) => `/${repo}/docs/${version}/${slug}/`,
  /** Index of a version's example files, grouped by folder. */
  examples: (repo: string, version: string) => `/${repo}/examples/${version}/`,
  /** One example file, at its path inside examples/. */
  example: (repo: string, version: string, path: string) =>
    `/${repo}/examples/${version}/${examplePath(path)}/`,
  /** Every release of the repo with its notes. */
  changelog: (repo: string) => `/${repo}/changelog/`,
  /** Anchor of a folder group on the examples index. */
  exampleAnchor: (path: string) =>
    `example-${path
      .toLowerCase()
      .replace(/[^a-z\d]+/g, '-')
      .replace(/^-|-$/g, '')}`,
};

/**
 * Where a link to examples/<path> goes: a file to its page, a folder to its
 * group on the index, and examples/ itself to the index.
 */
export function exampleLink(
  repo: string,
  version: string,
  path: string,
  files: ReadonlySet<string>,
): string {
  if (files.has(path)) return docsUrls.example(repo, version, path);
  const index = docsUrls.examples(repo, version);
  return path ? `${index}#${docsUrls.exampleAnchor(path)}` : index;
}
