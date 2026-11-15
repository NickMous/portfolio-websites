<?php

declare(strict_types=1);

namespace App\Tests\Functional\Admin;

use App\Entity\GuestbookEntry;
use App\Entity\SwitchGame;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\Security\Core\User\InMemoryUser;

final class AdminTest extends WebTestCase
{
    private KernelBrowser $client;

    protected function setUp(): void
    {
        $this->client = self::createClient();
    }

    private function em(): EntityManagerInterface
    {
        return self::getContainer()->get(EntityManagerInterface::class);
    }

    private function logIn(): void
    {
        $this->client->loginUser(new InMemoryUser('admin', null, ['ROLE_ADMIN']), 'admin');
    }

    /** @return iterable<string, array{string}> */
    public static function adminPages(): iterable
    {
        yield 'dashboard' => ['/admin'];
        yield 'switch games' => ['/admin/switch-game'];
        yield 'guestbook' => ['/admin/guestbook-entry'];
    }

    #[DataProvider('adminPages')]
    public function testTheAdminNeedsALogin(string $page): void
    {
        $this->client->request('GET', $page);

        self::assertResponseRedirects('/login');
    }

    public function testLoggingInWithTheRightPasswordOpensTheAdmin(): void
    {
        $this->client->request('GET', '/login');
        $this->client->submitForm('Sign in', ['_username' => 'admin', '_password' => 'test-password']);
        $this->client->followRedirect();

        self::assertResponseIsSuccessful();
        self::assertSame('/admin', $this->client->getRequest()->getPathInfo());
    }

    public function testAWrongPasswordIsRefused(): void
    {
        $this->client->request('GET', '/login');
        $this->client->submitForm('Sign in', ['_username' => 'admin', '_password' => 'guess']);
        $this->client->followRedirect();
        $this->client->request('GET', '/admin');

        self::assertResponseRedirects('/login');
    }

    public function testASwitchGameCanBeAdded(): void
    {
        $this->logIn();
        $this->client->request('GET', '/admin/switch-game/new');
        $this->client->submitForm('Create', [
            'SwitchGame[title]' => 'Mario Kart World',
            'SwitchGame[art]' => 'https://example.com/mkw.jpg',
            'SwitchGame[hoursPlayed]' => '31',
            'SwitchGame[lastPlayed]' => '2026-11-10',
        ]);

        $games = $this->em()->getRepository(SwitchGame::class)->findAll();
        self::assertCount(1, $games);
        self::assertSame('Mario Kart World', $games[0]->getTitle());
        self::assertSame(31, $games[0]->getHoursPlayed());
        self::assertSame('2026-11-10', $games[0]->getLastPlayed()?->format('Y-m-d'));
    }

    public function testAGuestbookEntryCanBeApprovedFromTheAdmin(): void
    {
        $entry = new GuestbookEntry('Ada', 'Nice site!', new \DateTimeImmutable('2026-11-01'));
        $em = $this->em();
        $em->persist($entry);
        $em->flush();

        $this->logIn();
        $this->client->request('GET', '/admin/guestbook-entry');
        $this->client->submitForm('Approve');

        $em->clear();
        self::assertTrue($em->find(GuestbookEntry::class, $entry->getId())?->isApproved());
    }
}
