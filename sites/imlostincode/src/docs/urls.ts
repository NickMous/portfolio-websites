/** Site URLs for docs pages, shared by the loader (link rewriting) and the pages. */
export const docsUrls = {
  /** Overview of the default version: the project's landing page. */
  repo: (repo: string) => `/${repo}/`,
  overview: (repo: string, version: string, defaultVersion: string) =>
    version === defaultVersion ? `/${repo}/` : `/${repo}/overview/${version}/`,
  doc: (repo: string, version: string, slug: string) => `/${repo}/docs/${version}/${slug}/`,
  /** All example files of a version on one page, one anchor per file. */
  examples: (repo: string, version: string) => `/${repo}/examples/${version}/`,
  exampleAnchor: (path: string) =>
    `example-${path
      .toLowerCase()
      .replace(/[^a-z\d]+/g, '-')
      .replace(/^-|-$/g, '')}`,
};
