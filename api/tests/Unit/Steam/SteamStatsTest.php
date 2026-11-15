<?php

declare(strict_types=1);

namespace App\Tests\Unit\Steam;

use App\Steam\SteamStats;
use App\Steam\SteamUnavailable;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Cache\Adapter\ArrayAdapter;
use Symfony\Component\Clock\MockClock;
use Symfony\Component\HttpClient\MockHttpClient;
use Symfony\Component\HttpClient\Response\JsonMockResponse;
use Symfony\Component\HttpClient\Response\MockResponse;

final class SteamStatsTest extends TestCase
{
    private MockClock $clock;
    /** @var list<MockResponse> */
    private array $responses = [];
    /** @var list<string> */
    private array $requestedUrls = [];
    private SteamStats $steam;

    protected function setUp(): void
    {
        $this->clock = new MockClock('2026-11-15 12:00:00');
        $http = new MockHttpClient(function (string $method, string $url): MockResponse {
            $this->requestedUrls[] = $url;

            return array_shift($this->responses) ?? throw new \LogicException('Unexpected request to Steam');
        }, 'https://api.steampowered.com');

        $this->steam = new SteamStats($http, new ArrayAdapter(), $this->clock, 'SECRET-KEY', '76561190000000000');
    }

    /** @return array<string, mixed> */
    private function game(int $appId, string $name, int $minutes, int $minutesTwoWeeks = 0, string $lastPlayed = ''): array
    {
        return [
            'appid' => $appId,
            'name' => $name,
            'playtime_forever' => $minutes,
            'playtime_2weeks' => $minutesTwoWeeks,
            'rtime_last_played' => '' === $lastPlayed ? 0 : (new \DateTimeImmutable($lastPlayed))->getTimestamp(),
        ];
    }

    /** @param list<array<string, mixed>> $games */
    private function steamReturns(int $gameCount, array $games): void
    {
        foreach ($games as &$game) {
            // Steam leaves playtime_2weeks out for games not played recently.
            if (0 === $game['playtime_2weeks']) {
                unset($game['playtime_2weeks']);
            }
        }
        $this->responses[] = new JsonMockResponse(['response' => ['game_count' => $gameCount, 'games' => $games]]);
    }

    public function testItSummarisesTheAccount(): void
    {
        $this->steamReturns(42, [
            $this->game(10, 'Old favourite', 6000, lastPlayed: '2026-01-02 20:00'),
            $this->game(20, 'Current game', 754, 90, '2026-11-14 21:30'),
            $this->game(30, 'Never started', 0),
            $this->game(40, 'Also this week', 300, 30, '2026-11-12 18:00'),
        ]);

        $stats = $this->steam->current()->jsonSerialize();

        self::assertSame(42, $stats['gameCount']);
        self::assertSame(2.0, $stats['hoursLastTwoWeeks']);
        self::assertSame('2026-11-15T12:00:00+00:00', $stats['fetchedAt']);
        self::assertSame(['Current game', 'Also this week', 'Old favourite'], array_column($stats['recentGames'], 'name'));
        self::assertSame([
            'appId' => 20,
            'name' => 'Current game',
            'hoursPlayed' => 12.6,
            'hoursLastTwoWeeks' => 1.5,
            'lastPlayed' => '2026-11-14T21:30:00+00:00',
            'art' => 'https://shared.steamstatic.com/store_item_assets/steam/apps/20/library_600x900.jpg',
        ], $stats['recentGames'][0]);
    }

    public function testItKeepsTheSixMostRecentlyPlayedGames(): void
    {
        $games = [];
        for ($day = 1; $day <= 8; ++$day) {
            $games[] = $this->game($day, "Game $day", 60, lastPlayed: "2026-11-0$day 12:00");
        }
        $this->steamReturns(8, $games);

        $stats = $this->steam->current()->jsonSerialize();

        self::assertSame([8, 7, 6, 5, 4, 3], array_column($stats['recentGames'], 'appId'));
    }

    public function testItAsksSteamForTheConfiguredAccountWithTheKey(): void
    {
        $this->steamReturns(0, []);

        $this->steam->current();

        self::assertCount(1, $this->requestedUrls);
        $url = parse_url($this->requestedUrls[0]);
        self::assertSame('/IPlayerService/GetOwnedGames/v1/', $url['path'] ?? null);
        parse_str($url['query'] ?? '', $query);
        self::assertSame('SECRET-KEY', $query['key'] ?? null);
        self::assertSame('76561190000000000', $query['steamid'] ?? null);
        self::assertSame('1', $query['include_appinfo'] ?? null);
        self::assertSame('1', $query['include_played_free_games'] ?? null);
    }

    public function testTheKeyNeverEndsUpInTheOutput(): void
    {
        $this->steamReturns(1, [$this->game(20, 'Current game', 60, 60, '2026-11-14 21:30')]);

        self::assertStringNotContainsString('SECRET-KEY', (string) json_encode($this->steam->current()));
    }

    public function testItReusesTheAnswerForTwentyMinutes(): void
    {
        $this->steamReturns(1, []);
        $this->steamReturns(2, []);

        $first = $this->steam->current();
        $this->clock->sleep(19 * 60);
        $cached = $this->steam->current();
        $this->clock->sleep(2 * 60);
        $refreshed = $this->steam->current();

        self::assertSame(1, $first->jsonSerialize()['gameCount']);
        self::assertSame(1, $cached->jsonSerialize()['gameCount']);
        self::assertSame(2, $refreshed->jsonSerialize()['gameCount']);
        self::assertCount(2, $this->requestedUrls);
    }

    /** @return iterable<string, array{MockResponse}> */
    public static function failures(): iterable
    {
        yield 'server error' => [new MockResponse('', ['http_code' => 500])];
        yield 'rate limited' => [new MockResponse('', ['http_code' => 429])];
        yield 'not json' => [new MockResponse('<html>')];
        yield 'private profile' => [new JsonMockResponse(['response' => []])];
        yield 'network error' => [new MockResponse('', ['error' => 'Connection timed out'])];
    }

    #[DataProvider('failures')]
    public function testWhenSteamFailsItServesTheLastGoodAnswer(MockResponse $failure): void
    {
        $this->steamReturns(5, []);
        $this->responses[] = $failure;

        $this->steam->current();
        $this->clock->sleep(30 * 60);
        $stale = $this->steam->current()->jsonSerialize();

        self::assertSame(5, $stale['gameCount']);
        self::assertSame('2026-11-15T12:00:00+00:00', $stale['fetchedAt']);
    }

    #[DataProvider('failures')]
    public function testWhenSteamFailsWithNothingCachedItSaysSo(MockResponse $failure): void
    {
        $this->responses[] = $failure;

        $this->expectException(SteamUnavailable::class);
        $this->steam->current();
    }
}
