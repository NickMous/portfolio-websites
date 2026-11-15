import { describe, expect, it } from 'vitest';
import { buildNowPlaying, type SteamStats, type SwitchGame } from './model';
import { lastPlayed } from './format';

const steamGame = (name: string, lastPlayed: string, hoursPlayed = 10) => ({
  appId: name.length,
  name,
  hoursPlayed,
  hoursLastTwoWeeks: 1,
  lastPlayed,
  art: `https://cdn.example/${name}.jpg`,
});

const steam: SteamStats = {
  gameCount: 120,
  hoursLastTwoWeeks: 14.5,
  gamesLastTwoWeeks: 3,
  recentGames: [
    steamGame('Factorio', '2026-11-14T20:00:00+00:00', 321.4),
    steamGame('Celeste', '2026-11-01T20:00:00+00:00'),
  ],
  fetchedAt: '2026-11-15T12:00:00+00:00',
};

const switchGames: SwitchGame[] = [
  { title: 'Hollow Knight: Silksong', art: null, hoursPlayed: 40, lastPlayed: '2026-11-12' },
  {
    title: 'Mario Kart World',
    art: 'https://x/mkw.jpg',
    hoursPlayed: 31,
    lastPlayed: '2026-10-02',
  },
];

describe('buildNowPlaying', () => {
  it('shows the two most recently played games across both platforms', () => {
    const { posters } = buildNowPlaying({ steam, switchGames });

    expect(posters).toEqual([
      {
        title: 'Factorio',
        platform: 'steam',
        art: 'https://cdn.example/Factorio.jpg',
        hoursPlayed: 321.4,
        lastPlayed: '2026-11-14T20:00:00+00:00',
      },
      {
        title: 'Hollow Knight: Silksong',
        platform: 'switch',
        art: null,
        hoursPlayed: 40,
        lastPlayed: '2026-11-12',
      },
    ]);
  });

  it('fills the Steam tile from the stats and the Switch tile with the latest Switch game', () => {
    const { steamTile, switchTile } = buildNowPlaying({ steam, switchGames });

    expect(steamTile).toEqual({ hours: 14.5, games: 3 });
    expect(switchTile).toEqual({ title: 'Hollow Knight: Silksong' });
  });

  it('keeps showing one platform when the other is unavailable', () => {
    const result = buildNowPlaying({ steam: null, switchGames });

    expect(result.posters.map((p) => p.title)).toEqual([
      'Hollow Knight: Silksong',
      'Mario Kart World',
    ]);
    expect(result.steamTile).toBeNull();
    expect(result.switchTile).toEqual({ title: 'Hollow Knight: Silksong' });
  });

  it('has nothing to show when neither platform answered', () => {
    expect(buildNowPlaying({ steam: null, switchGames: null })).toEqual({
      posters: [],
      steamTile: null,
      switchTile: null,
    });
  });
});

describe('lastPlayed', () => {
  const now = new Date('2026-11-15T12:00:00+00:00');

  it.each([
    ['2026-11-15T08:00:00+00:00', 'en', 'today'],
    ['2026-11-14T23:00:00+00:00', 'en', 'yesterday'],
    ['2026-11-12', 'en', '3 days ago'],
    ['2026-09-01', 'en', '2 months ago'],
    ['2026-11-14T23:00:00+00:00', 'nl', 'gisteren'],
    ['2026-11-12', 'nl', '3 dagen geleden'],
  ] as const)('%s in %s is "%s"', (date, locale, expected) => {
    expect(lastPlayed(date, now, locale)).toBe(expected);
  });
});
