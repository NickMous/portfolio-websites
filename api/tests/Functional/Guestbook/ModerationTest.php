<?php

declare(strict_types=1);

namespace App\Tests\Functional\Guestbook;

use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Component\HttpFoundation\UriSigner;

final class ModerationTest extends GuestbookTestCase
{
    private KernelBrowser $browser;

    protected function setUp(): void
    {
        $this->browser = self::createClient()->getKernelBrowser();
    }

    private function signedUrl(int $id, string $action, string $expires = '+1 day'): string
    {
        $signer = self::getContainer()->get('uri_signer');
        \assert($signer instanceof UriSigner);

        return $signer->sign("http://localhost/guestbook/$id/$action", new \DateTimeImmutable($expires));
    }

    public function testOpeningTheApproveLinkOnlyAsksForConfirmation(): void
    {
        // Mail scanners open links; only the button press may change anything.
        $entry = $this->createEntry('Ada', 'Nice site!');

        $this->browser->request('GET', $this->signedUrl($entry->getId(), 'approve'));

        self::assertResponseIsSuccessful();
        self::assertSelectorTextContains('body', 'Nice site!');
        self::assertFalse($this->allEntries()[0]->isApproved());
    }

    public function testConfirmingTheApproveLinkPublishesTheEntry(): void
    {
        $entry = $this->createEntry();

        $this->browser->request('GET', $this->signedUrl($entry->getId(), 'approve'));
        $this->browser->submitForm('Approve');

        self::assertResponseIsSuccessful();
        self::assertTrue($this->allEntries()[0]->isApproved());
    }

    public function testConfirmingTheDeleteLinkRemovesTheEntry(): void
    {
        $entry = $this->createEntry(approved: true);

        $this->browser->request('GET', $this->signedUrl($entry->getId(), 'delete'));
        $this->browser->submitForm('Delete');

        self::assertResponseIsSuccessful();
        self::assertCount(0, $this->allEntries());
    }

    public function testALinkWithABadSignatureIsRefused(): void
    {
        $entry = $this->createEntry();
        $url = $this->signedUrl($entry->getId(), 'approve');

        $this->browser->request('POST', str_replace('_hash=', '_hash=x', $url));

        self::assertResponseStatusCodeSame(403);
        self::assertFalse($this->allEntries()[0]->isApproved());
    }

    public function testALinkSignedForOneEntryDoesNotWorkForAnother(): void
    {
        $signed = $this->createEntry();
        $other = $this->createEntry();
        $url = str_replace("/{$signed->getId()}/", "/{$other->getId()}/", $this->signedUrl($signed->getId(), 'delete'));

        $this->browser->request('POST', $url);

        self::assertResponseStatusCodeSame(403);
        self::assertCount(2, $this->allEntries());
    }

    public function testAnExpiredLinkIsRefused(): void
    {
        $entry = $this->createEntry();

        $this->browser->request('POST', $this->signedUrl($entry->getId(), 'approve', '-1 minute'));

        self::assertResponseStatusCodeSame(403);
        self::assertFalse($this->allEntries()[0]->isApproved());
    }

    public function testALinkForARemovedEntryIsNotFound(): void
    {
        $entry = $this->createEntry();
        $url = $this->signedUrl($entry->getId(), 'approve');
        $em = $this->entityManager();
        $em->remove($entry);
        $em->flush();

        $this->browser->request('GET', $url);

        self::assertResponseStatusCodeSame(404);
    }
}
