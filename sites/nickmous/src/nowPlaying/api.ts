import type { NowPlayingData, SteamStats, SwitchGame } from './model';

/**
 * The nickmous API. Set PUBLIC_API_URL to point a build (or `npm run dev`)
 * at another one, e.g. a local `api/` on http://localhost:8000.
 */
export const apiBase: string = import.meta.env.PUBLIC_API_URL ?? 'https://api.nickmous.com';

type Fetch = (url: string, init?: RequestInit) => Promise<Response>;

async function get<T>(fetchImpl: Fetch, url: string): Promise<T | null> {
  try {
    const response = await fetchImpl(url, {
      headers: { Accept: 'application/ld+json' },
      signal: AbortSignal.timeout(5000),
    });
    return response.ok ? ((await response.json()) as T) : null;
  } catch {
    return null;
  }
}

/** Both platforms at once; either can come back null on its own. */
export async function fetchNowPlaying(
  base: string = apiBase,
  fetchImpl: Fetch = fetch,
): Promise<NowPlayingData> {
  const [steam, switchList] = await Promise.all([
    get<SteamStats>(fetchImpl, `${base}/api/steam`),
    get<{ member: SwitchGame[] }>(fetchImpl, `${base}/api/switch`),
  ]);
  return { steam, switchGames: switchList?.member ?? null };
}
