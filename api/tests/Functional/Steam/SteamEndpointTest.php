<?php

declare(strict_types=1);

namespace App\Tests\Functional\Steam;

use App\Steam\SteamStats;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\Cache\Adapter\ArrayAdapter;
use Symfony\Component\Clock\MockClock;
use Symfony\Component\HttpClient\MockHttpClient;
use Symfony\Component\HttpClient\Response\JsonMockResponse;
use Symfony\Component\HttpClient\Response\MockResponse;

final class SteamEndpointTest extends WebTestCase
{
    private function steamAnswers(MockResponse $response): void
    {
        self::getContainer()->set(SteamStats::class, new SteamStats(
            new MockHttpClient($response, 'https://api.steampowered.com'),
            new ArrayAdapter(),
            new MockClock('2026-11-15 12:00:00'),
            'SECRET-KEY',
            '76561190000000000',
        ));
    }

    public function testItServesTheStatsAsCacheableJson(): void
    {
        $client = self::createClient();
        $this->steamAnswers(new JsonMockResponse(['response' => ['game_count' => 3, 'games' => []]]));

        $client->request('GET', '/api/steam');

        self::assertResponseIsSuccessful();
        self::assertResponseHeaderSame('Content-Type', 'application/json');
        self::assertResponseHeaderSame('Cache-Control', 'max-age=300, public');
        $body = (string) $client->getResponse()->getContent();
        /** @var array{gameCount: int} $stats */
        $stats = json_decode($body, true, flags: \JSON_THROW_ON_ERROR);
        self::assertSame(3, $stats['gameCount']);
        self::assertStringNotContainsString('SECRET-KEY', $body);
    }

    public function testWhenSteamIsDownWithNothingCachedItAnswers503(): void
    {
        $client = self::createClient();
        $this->steamAnswers(new MockResponse('', ['http_code' => 503]));

        $client->request('GET', '/api/steam');

        self::assertResponseStatusCodeSame(503);
        self::assertResponseHeaderSame('Retry-After', '60');
    }
}
