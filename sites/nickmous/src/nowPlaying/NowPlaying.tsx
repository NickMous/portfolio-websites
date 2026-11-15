import type { Locale } from '@portfolio/ui-kit';
import { useEffect, useState } from 'preact/hooks';
import { fetchNowPlaying } from './api';
import { lastPlayed, plural } from './format';
import { buildNowPlaying, type GamePoster, type NowPlayingData } from './model';

export interface NowPlayingStrings {
  steam: string;
  switch: string;
  hoursPlayed: { one: string; other: string };
  /** Contains {when}. */
  lastPlayed: string;
  steamTile: string;
  steamHours: { one: string; other: string };
  steamGames: { one: string; other: string };
  steamDown: string;
  switchTile: string;
  switchNote: string;
  nothing: string;
}

interface Props {
  /** Fetched at build time, so the section is filled before any script runs. */
  initial: NowPlayingData;
  /** When `initial` was fetched; the first render must match the static HTML. */
  builtAt: string;
  apiBase: string;
  locale: Locale;
  strings: NowPlayingStrings;
}

const posterColors = [
  { surface: 'bg-blue text-white', badge: 'bg-white text-ink', art: 'bg-blue-tint' },
  { surface: 'bg-white text-ink', badge: 'bg-ink text-white', art: 'bg-grey-tint' },
];

function Poster({
  game,
  index,
  now,
  locale,
  strings,
}: {
  game: GamePoster;
  index: number;
  now: Date;
  locale: Locale;
  strings: NowPlayingStrings;
}) {
  const colors = posterColors[index % posterColors.length]!;
  return (
    <article class={`flex min-w-0 flex-[1_1_340px] flex-col ${colors.surface}`}>
      <div class="flex flex-wrap items-start justify-between gap-3 px-6 pt-6">
        <h3 class="min-w-0 type-poster wrap-break-word">{game.title}</h3>
        <span
          class={`inline-block px-[9px] py-1.5 text-[13px] leading-none font-bold whitespace-nowrap uppercase ${colors.badge}`}
        >
          {game.platform === 'steam' ? strings.steam : strings.switch}
        </span>
      </div>
      {game.art ? (
        <img
          src={game.art}
          alt=""
          loading="lazy"
          decoding="async"
          class="mx-6 my-5 h-[220px] w-[calc(100%-3rem)] object-cover"
        />
      ) : (
        <div class={`mx-6 my-5 h-[220px] ${colors.art}`} aria-hidden="true" />
      )}
      <div class="mt-auto ticket-line flex flex-wrap justify-between gap-2 px-6 py-3.5 text-[14px] font-medium">
        <span>{plural(game.hoursPlayed, strings.hoursPlayed, locale)}</span>
        <span>
          {strings.lastPlayed.replace('{when}', lastPlayed(game.lastPlayed, now, locale))}
        </span>
      </div>
    </article>
  );
}

/**
 * "Now playing": the two most recently played games (Steam or Switch) as
 * posters, plus a Steam tile and a Switch tile. Rendered at build time from
 * the API, then refreshed in the browser so it never shows a stale build.
 */
export default function NowPlaying({ initial, builtAt, apiBase, locale, strings }: Props) {
  const [data, setData] = useState(initial);
  const [now, setNow] = useState(() => new Date(builtAt));

  useEffect(() => {
    setNow(new Date());
    void fetchNowPlaying(apiBase).then((fresh) =>
      // A platform that doesn't answer now keeps what the build had.
      setData((old) => ({
        steam: fresh.steam ?? old.steam,
        switchGames: fresh.switchGames ?? old.switchGames,
      })),
    );
  }, [apiBase]);

  const { posters, steamTile, switchTile } = buildNowPlaying(data);

  if (posters.length === 0 && !steamTile && !switchTile) {
    return <p class="bg-ink p-6 text-[17px] text-white">{strings.nothing}</p>;
  }

  return (
    <div class="flex flex-wrap gap-7 max-sm:gap-5">
      {posters.map((game, i) => (
        <Poster game={game} index={i} now={now} locale={locale} strings={strings} />
      ))}
      <div class="flex flex-[1_1_260px] flex-col gap-5">
        <div class="flex flex-col gap-1.5 bg-ink p-6 text-white">
          <span class="text-[13px] font-bold tracking-[1px] text-yellow uppercase">
            {strings.steamTile}
          </span>
          {steamTile ? (
            <>
              <span class="font-display text-[72px] leading-[0.9] font-black max-sm:text-[56px]">
                {plural(steamTile.hours, strings.steamHours, locale)}
              </span>
              <span class="text-[15px]">{plural(steamTile.games, strings.steamGames, locale)}</span>
            </>
          ) : (
            <span class="text-[15px]">{strings.steamDown}</span>
          )}
        </div>
        <div class="flex flex-1 flex-col gap-1.5 bg-red p-6 text-white">
          <span class="text-[13px] font-bold tracking-[1px] uppercase">{strings.switchTile}</span>
          {switchTile && (
            <span class="font-display text-[40px] leading-[0.95] font-black wrap-break-word uppercase">
              {switchTile.title}
            </span>
          )}
          <span class="text-[15px]">{strings.switchNote}</span>
        </div>
      </div>
    </div>
  );
}
