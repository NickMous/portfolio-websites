const EXAMPLE_FILE = /^\/([^/]+)\/examples\/([^/]+)\/.+/;

/**
 * Every example file page shares one template, so the audit only needs a few
 * of them per repo and version; all other pages are kept.
 */
export function samplePages(paths: readonly string[], perVersion: number): string[] {
  const seen = new Map<string, number>();
  return paths.filter((path) => {
    const m = EXAMPLE_FILE.exec(path);
    if (!m) return true;
    const key = `${m[1]}/${m[2]}`;
    const count = seen.get(key) ?? 0;
    seen.set(key, count + 1);
    return count < perVersion;
  });
}

/** Runs fn over items with at most `limit` running at once; results keep input order. */
export async function pool<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i] as T);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
