<?php

declare(strict_types=1);

namespace App\Tests\Functional\Switch;

use ApiPlatform\Test\ApiTestCase;
use App\Entity\SwitchGame;
use Doctrine\ORM\EntityManagerInterface;

final class SwitchGamesTest extends ApiTestCase
{
    protected static ?bool $alwaysBootKernel = false;

    private function addGame(string $title, int $hours, string $lastPlayed, ?string $art = null): void
    {
        $em = self::getContainer()->get(EntityManagerInterface::class);
        $game = new SwitchGame();
        $game->setTitle($title);
        $game->setHoursPlayed($hours);
        $game->setLastPlayed(new \DateTimeImmutable($lastPlayed));
        $game->setArt($art);
        $em->persist($game);
        $em->flush();
    }

    public function testGamesAreListedMostRecentlyPlayedFirst(): void
    {
        $this->addGame('Older game', 80, '2026-09-01');
        $this->addGame('Current game', 12, '2026-11-14', 'https://example.com/art.jpg');

        /** @var array{member: list<array<string, mixed>>} $data */
        $data = self::createClient()->request('GET', '/api/switch')->toArray();

        self::assertResponseIsSuccessful();
        self::assertSame(['Current game', 'Older game'], array_column($data['member'], 'title'));
        $first = $data['member'][0];
        unset($first['@id'], $first['@type']);
        self::assertSame([
            'title' => 'Current game',
            'art' => 'https://example.com/art.jpg',
            'hoursPlayed' => 12,
            'lastPlayed' => '2026-11-14',
        ], $first);
    }

    public function testTheListCannotBeWrittenToThroughTheApi(): void
    {
        self::createClient()->request('POST', '/api/switch', ['json' => ['title' => 'Hack']]);

        self::assertResponseStatusCodeSame(405);
    }
}
