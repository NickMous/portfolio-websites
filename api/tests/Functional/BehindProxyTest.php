<?php

declare(strict_types=1);

namespace App\Tests\Functional;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\Mime\Email;

/**
 * In production TLS ends before the app: Cloudflare and the ingress speak
 * https, and the request reaches PHP as http with X-Forwarded-Proto. The app
 * has to see it as https, or browser logins fail the CSRF origin check and
 * links it generates point at http.
 */
final class BehindProxyTest extends WebTestCase
{
    private const array VIA_TLS_PROXY = [
        'REMOTE_ADDR' => '10.42.0.15',
        'HTTP_X_FORWARDED_PROTO' => 'https',
        'HTTP_X_FORWARDED_PORT' => '443',
        'HTTP_HOST' => 'api.nickmous.com',
    ];

    public function testAdminLoginWorksThroughTheTlsProxy(): void
    {
        $client = self::createClient(server: self::VIA_TLS_PROXY);
        $client->request('GET', '/login');
        $client->submitForm('Sign in', ['_username' => 'admin', '_password' => 'test-password'], serverParameters: [
            'HTTP_ORIGIN' => 'https://api.nickmous.com',
        ]);

        self::assertResponseRedirects('https://api.nickmous.com/admin');
    }

    public function testModerationLinksUseHttpsThroughTheTlsProxy(): void
    {
        $client = self::createClient(server: self::VIA_TLS_PROXY);
        $client->jsonRequest('POST', '/api/guestbook', ['name' => 'Ada', 'message' => 'Hi']);

        $email = self::getMailerMessage();
        self::assertInstanceOf(Email::class, $email);
        self::assertEmailTextBodyContains($email, 'https://api.nickmous.com/guestbook/');
    }
}
