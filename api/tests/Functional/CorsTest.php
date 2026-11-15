<?php

declare(strict_types=1);

namespace App\Tests\Functional;

use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

final class CorsTest extends WebTestCase
{
    /** @return iterable<string, array{string}> */
    public static function siteOrigins(): iterable
    {
        yield 'english site' => ['https://nickmous.com'];
        yield 'dutch site' => ['https://nickmous.nl'];
    }

    #[DataProvider('siteOrigins')]
    public function testThePreflightFromASiteIsAllowed(string $origin): void
    {
        $client = self::createClient();
        $client->request('OPTIONS', '/api', server: [
            'HTTP_ORIGIN' => $origin,
            'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'POST',
        ]);

        self::assertResponseHeaderSame('Access-Control-Allow-Origin', $origin);
    }

    /** @return iterable<string, array{string}> */
    public static function otherOrigins(): iterable
    {
        yield 'another domain' => ['https://example.com'];
        yield 'plain http' => ['http://nickmous.com'];
        yield 'lookalike suffix' => ['https://nickmous.com.example.com'];
        yield 'subdomain' => ['https://evil.nickmous.nl'];
    }

    #[DataProvider('otherOrigins')]
    public function testOtherOriginsAreNotAllowed(string $origin): void
    {
        $client = self::createClient();
        $client->request('OPTIONS', '/api', server: [
            'HTTP_ORIGIN' => $origin,
            'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'POST',
        ]);

        self::assertResponseNotHasHeader('Access-Control-Allow-Origin');
    }
}
