/** Shapes of the API's GET /api/steam and GET /api/switch (see api/). */
export interface SteamStats {
  gameCount: number;
  hoursLastTwoWeeks: number;
  gamesLastTwoWeeks: number;
  recentGames: {
    appId: number;
    name: string;
    hoursPlayed: number;
    hoursLastTwoWeeks: number;
    lastPlayed: string;
    art: string;
  }[];
  fetchedAt: string;
}

export interface SwitchGame {
  title: string;
  art: string | null;
  hoursPlayed: number;
  /** Y-m-d */
  lastPlayed: string;
}

/** What the API answered; null where a platform could not be reached. */
export interface NowPlayingData {
  steam: SteamStats | null;
  switchGames: SwitchGame[] | null;
}

export interface GamePoster {
  title: string;
  platform: 'steam' | 'switch';
  art: string | null;
  hoursPlayed: number;
  lastPlayed: string;
}

export interface NowPlaying {
  posters: GamePoster[];
  steamTile: { hours: number; games: number } | null;
  switchTile: { title: string } | null;
}

const POSTERS = 2;

export function buildNowPlaying({ steam, switchGames }: NowPlayingData): NowPlaying {
  const fromSteam: GamePoster[] = (steam?.recentGames ?? []).map((g) => ({
    title: g.name,
    platform: 'steam',
    art: g.art,
    hoursPlayed: g.hoursPlayed,
    lastPlayed: g.lastPlayed,
  }));
  const fromSwitch: GamePoster[] = (switchGames ?? []).map((g) => ({
    title: g.title,
    platform: 'switch',
    art: g.art,
    hoursPlayed: g.hoursPlayed,
    lastPlayed: g.lastPlayed,
  }));

  const posters = [...fromSteam, ...fromSwitch]
    .sort((a, b) => Date.parse(b.lastPlayed) - Date.parse(a.lastPlayed))
    .slice(0, POSTERS);

  // The API lists Switch games most recently played first.
  const latestSwitch = switchGames?.[0];

  return {
    posters,
    steamTile: steam ? { hours: steam.hoursLastTwoWeeks, games: steam.gamesLastTwoWeeks } : null,
    switchTile: latestSwitch ? { title: latestSwitch.title } : null,
  };
}
