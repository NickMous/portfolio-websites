<?php

declare(strict_types=1);

namespace App\Controller;

use App\Steam\SteamStats;
use App\Steam\SteamUnavailable;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

/** Steam stats for the "Now playing" section on nickmous. */
final class SteamController
{
    #[Route('/api/steam', name: 'steam_stats', methods: ['GET'])]
    public function __invoke(SteamStats $steam): JsonResponse
    {
        try {
            $response = new JsonResponse($steam->current());
        } catch (SteamUnavailable) {
            return new JsonResponse(['error' => 'Steam is not answering right now.'], 503, ['Retry-After' => '60']);
        }

        // Browsers and Cloudflare may reuse it for a few minutes; the server
        // only asks Steam every 20 minutes anyway.
        return $response->setPublic()->setMaxAge(300);
    }
}
