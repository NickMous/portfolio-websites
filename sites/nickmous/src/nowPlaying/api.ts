import { apiBase, type Fetch } from '../apiBase';
import type { NowPlayingData, SteamStats, SwitchGame } from './model';

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
