<?php

declare(strict_types=1);

namespace App\Steam;

use Psr\Cache\CacheItemPoolInterface;
use Psr\Clock\ClockInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\DependencyInjection\Attribute\Target;
use Symfony\Contracts\HttpClient\Exception\ExceptionInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

/**
 * Sander's Steam stats, fetched server-side so the API key never reaches a
 * browser. Steam is asked at most once per REFRESH_AFTER; when it fails, the
 * last good answer is served (with its own fetchedAt) for as long as needed.
 */
class SteamStats
{
    public const int REFRESH_AFTER = 20 * 60;
    private const int RECENT_GAMES = 6;
    private const string CACHE_KEY = 'steam_snapshot';

    public function __construct(
        #[Target('steam.client')]
        private readonly HttpClientInterface $steam,
        #[Autowire(service: 'cache.steam')]
        private readonly CacheItemPoolInterface $cache,
        private readonly ClockInterface $clock,
        #[Autowire(env: 'STEAM_API_KEY')]
        #[\SensitiveParameter]
        private readonly string $apiKey,
        #[Autowire(env: 'STEAM_ID')]
        private readonly string $steamId,
    ) {
    }

    public function current(): SteamSnapshot
    {
        // Kept without expiry: the stale copy is the fallback when Steam fails.
        $item = $this->cache->getItem(self::CACHE_KEY);
        $cached = $item->isHit() ? $item->get() : null;
        $cached = $cached instanceof SteamSnapshot ? $cached : null;

        $now = $this->clock->now();
        if (null !== $cached && $now->getTimestamp() - $cached->fetchedAt->getTimestamp() < self::REFRESH_AFTER) {
            return $cached;
        }

        try {
            $fresh = $this->fetch($now);
        } catch (SteamUnavailable $e) {
            return $cached ?? throw $e;
        }

        $this->cache->save($item->set($fresh));

        return $fresh;
    }

    private function fetch(\DateTimeImmutable $now): SteamSnapshot
    {
        try {
            $data = $this->steam->request('GET', '/IPlayerService/GetOwnedGames/v1/', [
                'query' => [
                    'key' => $this->apiKey,
                    'steamid' => $this->steamId,
                    'include_appinfo' => 1,
                    'include_played_free_games' => 1,
                ],
            ])->toArray();
        } catch (ExceptionInterface $e) {
            // Not chained: the exception message would contain the URL, key included.
            throw new SteamUnavailable(\sprintf('Steam request failed (%s)', $e::class));
        }

        $response = $data['response'] ?? null;
        // A private profile answers 200 with an empty response.
        if (!\is_array($response) || !\is_int($response['game_count'] ?? null)) {
            throw new SteamUnavailable('Steam returned no games (is the profile or its game details private?)');
        }

        /** @var list<array{appid: int, name?: string, playtime_forever?: int, playtime_2weeks?: int, rtime_last_played?: int}> $games */
        $games = \is_array($response['games'] ?? null) ? $response['games'] : [];

        $minutesTwoWeeks = array_sum(array_map(static fn (array $g): int => $g['playtime_2weeks'] ?? 0, $games));

        /** @var list<array{appid: int, name?: string, playtime_forever?: int, playtime_2weeks?: int, rtime_last_played: int}> $played */
        $played = array_values(array_filter($games, static fn (array $g): bool => ($g['rtime_last_played'] ?? 0) > 0));
        usort($played, static fn (array $a, array $b): int => $b['rtime_last_played'] <=> $a['rtime_last_played']);

        return new SteamSnapshot(
            gameCount: $response['game_count'],
            hoursLastTwoWeeks: self::hours($minutesTwoWeeks),
            recentGames: array_map(static fn (array $g): array => [
                'appId' => $g['appid'],
                'name' => $g['name'] ?? '',
                'hoursPlayed' => self::hours($g['playtime_forever'] ?? 0),
                'hoursLastTwoWeeks' => self::hours($g['playtime_2weeks'] ?? 0),
                'lastPlayed' => (new \DateTimeImmutable('@'.$g['rtime_last_played']))->format(\DATE_ATOM),
                'art' => \sprintf('https://shared.steamstatic.com/store_item_assets/steam/apps/%d/library_600x900.jpg', $g['appid']),
            ], \array_slice($played, 0, self::RECENT_GAMES)),
            fetchedAt: $now,
        );
    }

    private static function hours(int $minutes): float
    {
        return round($minutes / 60, 1);
    }
}
