<?php

declare(strict_types=1);

namespace App\Tests\Functional\Guestbook;

use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\Mailer\Envelope;
use Symfony\Component\Mailer\Exception\TransportException;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\Mime\RawMessage;

final class PostEntryTest extends GuestbookTestCase
{
    public function testAnEntryIsStoredUnapprovedAndMailedToTheModerator(): void
    {
        self::createClient()->request('POST', '/api/guestbook', ['json' => [
            'name' => '  Ada  ',
            'message' => 'Nice site!',
        ]]);

        self::assertResponseStatusCodeSame(202);

        $entries = $this->allEntries();
        self::assertCount(1, $entries);
        self::assertSame('Ada', $entries[0]->getName());
        self::assertSame('Nice site!', $entries[0]->getMessage());
        self::assertFalse($entries[0]->isApproved());

        self::assertEmailCount(1);
        $email = self::getMailerMessage();
        self::assertInstanceOf(Email::class, $email);
        self::assertEmailAddressContains($email, 'To', 'moderator@example.com');
        self::assertEmailTextBodyContains($email, 'Nice site!');
        self::assertEmailTextBodyContains($email, '/guestbook/'.$entries[0]->getId().'/approve?');
        self::assertEmailTextBodyContains($email, '/guestbook/'.$entries[0]->getId().'/delete?');
    }

    public function testNothingIsStoredWhenTheMailCannotBeSent(): void
    {
        // An entry nobody was told about would wait for approval forever.
        $client = self::createClient();
        self::getContainer()->set(MailerInterface::class, new class implements MailerInterface {
            public function send(RawMessage $message, ?Envelope $envelope = null): void
            {
                throw new TransportException('SMTP is down');
            }
        });

        $client->request('POST', '/api/guestbook', ['json' => ['name' => 'Ada', 'message' => 'Hi']]);

        self::assertResponseStatusCodeSame(500);
        self::assertCount(0, $this->allEntries());
    }

    /** @return iterable<string, array{array<string, string>}> */
    public static function invalidEntries(): iterable
    {
        yield 'no name' => [['name' => '', 'message' => 'Hi']];
        yield 'only spaces as name' => [['name' => '   ', 'message' => 'Hi']];
        yield 'name too long' => [['name' => str_repeat('a', 41), 'message' => 'Hi']];
        yield 'no message' => [['name' => 'Ada', 'message' => '']];
        yield 'message too long' => [['name' => 'Ada', 'message' => str_repeat('a', 501)]];
    }

    /** @param array<string, string> $body */
    #[DataProvider('invalidEntries')]
    public function testInvalidEntriesAreRejected(array $body): void
    {
        self::createClient()->request('POST', '/api/guestbook', ['json' => $body]);

        self::assertResponseStatusCodeSame(422);
        self::assertCount(0, $this->allEntries());
        self::assertEmailCount(0);
    }

    public function testTheLongestAllowedEntryIsAccepted(): void
    {
        self::createClient()->request('POST', '/api/guestbook', ['json' => [
            'name' => str_repeat('a', 40),
            'message' => str_repeat('a', 500),
        ]]);

        self::assertResponseStatusCodeSame(202);
    }

    public function testAFilledHoneypotLooksAcceptedButIsDropped(): void
    {
        self::createClient()->request('POST', '/api/guestbook', ['json' => [
            'name' => 'Bot',
            'message' => 'Buy things',
            'website' => 'https://spam.example',
        ]]);

        self::assertResponseStatusCodeSame(202);
        self::assertCount(0, $this->allEntries());
        self::assertEmailCount(0);
    }

    public function testPostingIsRateLimitedPerVisitor(): void
    {
        $client = self::createClient();
        $client->disableReboot();
        $post = fn (string $ip) => $client->request('POST', '/api/guestbook', [
            'json' => ['name' => 'Ada', 'message' => 'Hi'],
            'headers' => ['CF-Connecting-IP' => $ip],
        ]);

        for ($i = 0; $i < 3; ++$i) {
            $post('203.0.113.7');
            self::assertResponseStatusCodeSame(202);
        }
        $post('203.0.113.7');
        self::assertResponseStatusCodeSame(429);

        $post('198.51.100.1');
        self::assertResponseStatusCodeSame(202);
    }
}
