<?php

declare(strict_types=1);

namespace App\Steam;

/**
 * What the "Now playing" section shows from Steam, as of $fetchedAt.
 *
 * @phpstan-type Game array{appId: int, name: string, hoursPlayed: float, hoursLastTwoWeeks: float, lastPlayed: string, art: string}
 */
final readonly class SteamSnapshot implements \JsonSerializable
{
    /** @param list<Game> $recentGames */
    public function __construct(
        public int $gameCount,
        public float $hoursLastTwoWeeks,
        public int $gamesLastTwoWeeks,
        public array $recentGames,
        public \DateTimeImmutable $fetchedAt,
    ) {
    }

    /** @return array{gameCount: int, hoursLastTwoWeeks: float, gamesLastTwoWeeks: int, recentGames: list<Game>, fetchedAt: string} */
    public function jsonSerialize(): array
    {
        return [
            'gameCount' => $this->gameCount,
            'hoursLastTwoWeeks' => $this->hoursLastTwoWeeks,
            'gamesLastTwoWeeks' => $this->gamesLastTwoWeeks,
            'recentGames' => $this->recentGames,
            'fetchedAt' => $this->fetchedAt->format(\DATE_ATOM),
        ];
    }
}
