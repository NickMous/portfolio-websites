<?php

declare(strict_types=1);

namespace App\Tests\Functional\Guestbook;

use ApiPlatform\Test\ApiTestCase;
use App\Entity\GuestbookEntry;
use Doctrine\ORM\EntityManagerInterface;

abstract class GuestbookTestCase extends ApiTestCase
{
    protected static ?bool $alwaysBootKernel = false;

    protected function entityManager(): EntityManagerInterface
    {
        return self::getContainer()->get(EntityManagerInterface::class);
    }

    protected function createEntry(
        string $name = 'Ada',
        string $message = 'Nice site!',
        bool $approved = false,
        string $createdAt = '2026-11-01 12:00',
    ): GuestbookEntry {
        $entry = new GuestbookEntry($name, $message, new \DateTimeImmutable($createdAt));
        if ($approved) {
            $entry->approve(new \DateTimeImmutable($createdAt));
        }
        $em = $this->entityManager();
        $em->persist($entry);
        $em->flush();

        return $entry;
    }

    /** @return list<GuestbookEntry> */
    protected function allEntries(): array
    {
        $em = $this->entityManager();
        $em->clear();

        return $em->getRepository(GuestbookEntry::class)->findAll();
    }
}
