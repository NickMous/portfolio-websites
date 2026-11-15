import { describe, expect, it } from 'vitest';
import { fetchNowPlaying } from './api';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('fetchNowPlaying', () => {
  it('reads Steam stats and the Switch list from the API', async () => {
    const asked: string[] = [];
    const data = await fetchNowPlaying('https://api.example', async (url) => {
      asked.push(String(url));
      return String(url).endsWith('/api/steam')
        ? json({ gameCount: 1 })
        : json({ member: [{ title: 'Mario Kart World' }] });
    });

    expect(asked.sort()).toEqual([
      'https://api.example/api/steam',
      'https://api.example/api/switch',
    ]);
    expect(data.steam).toEqual({ gameCount: 1 });
    expect(data.switchGames).toEqual([{ title: 'Mario Kart World' }]);
  });

  it('gives up on one platform without losing the other', async () => {
    const data = await fetchNowPlaying('https://api.example', async (url) =>
      String(url).endsWith('/api/steam') ? json({ error: 'down' }, 503) : json({ member: [] }),
    );

    expect(data).toEqual({ steam: null, switchGames: [] });
  });

  it('treats an unreachable API as no data', async () => {
    const data = await fetchNowPlaying('https://api.example', async () => {
      throw new TypeError('fetch failed');
    });

    expect(data).toEqual({ steam: null, switchGames: null });
  });
});
