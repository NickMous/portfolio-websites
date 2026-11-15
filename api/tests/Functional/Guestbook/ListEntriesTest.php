<?php

declare(strict_types=1);

namespace App\Tests\Functional\Guestbook;

final class ListEntriesTest extends GuestbookTestCase
{
    public function testOnlyApprovedEntriesAreListedNewestFirst(): void
    {
        $this->createEntry('Old', approved: true, createdAt: '2026-10-01 10:00');
        $this->createEntry('Pending', approved: false, createdAt: '2026-11-02 10:00');
        $this->createEntry('New', approved: true, createdAt: '2026-11-01 10:00');

        $response = self::createClient()->request('GET', '/api/guestbook');

        self::assertResponseIsSuccessful();
        $data = $response->toArray();
        self::assertSame(2, $data['totalItems']);
        self::assertSame(['New', 'Old'], array_column($data['member'], 'name'));
        self::assertSame(
            ['@id', '@type', 'name', 'message', 'createdAt'],
            array_keys($data['member'][0]),
        );
    }

    public function testTheListIsPaginated(): void
    {
        for ($i = 0; $i < 21; ++$i) {
            $this->createEntry("Visitor $i", approved: true, createdAt: "2026-11-01 10:$i");
        }

        $data = self::createClient()->request('GET', '/api/guestbook')->toArray();

        self::assertSame(21, $data['totalItems']);
        self::assertCount(20, $data['member']);
        self::assertArrayHasKey('next', $data['view']);
    }

    public function testAnUnapprovedEntryCannotBeFetchedDirectly(): void
    {
        $entry = $this->createEntry(approved: false);

        self::createClient()->request('GET', '/api/guestbook/'.$entry->getId());

        self::assertResponseStatusCodeSame(404);
    }
}
