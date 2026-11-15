<?php

declare(strict_types=1);

namespace App\Entity;

use ApiPlatform\Metadata\ApiProperty;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use App\Guestbook\NewGuestbookEntry;
use App\Guestbook\SubmitEntryProcessor;
use App\Repository\GuestbookEntryRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

/**
 * A note left on nickmous. Visitors only ever see approved entries (see
 * ApprovedEntriesExtension); new ones wait for Sander to approve them from
 * the email he gets.
 */
#[ORM\Entity(repositoryClass: GuestbookEntryRepository::class)]
#[ORM\Index(name: 'guestbook_entry_approved_created', columns: ['approved_at', 'created_at'])]
#[ApiResource(
    shortName: 'GuestbookEntry',
    operations: [
        new GetCollection(uriTemplate: '/guestbook'),
        new Get(uriTemplate: '/guestbook/{id}'),
        new Post(
            uriTemplate: '/guestbook',
            status: 202,
            input: NewGuestbookEntry::class,
            output: false,
            processor: SubmitEntryProcessor::class,
        ),
    ],
    normalizationContext: ['groups' => ['entry:read']],
    order: ['createdAt' => 'DESC'],
    paginationItemsPerPage: 20,
)]
class GuestbookEntry
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[ApiProperty(identifier: true)]
    private ?int $id = null;

    #[ORM\Column(length: NewGuestbookEntry::MAX_NAME)]
    #[Groups(['entry:read'])]
    private string $name;

    #[ORM\Column(type: Types::TEXT)]
    #[Groups(['entry:read'])]
    private string $message;

    #[ORM\Column]
    #[Groups(['entry:read'])]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $approvedAt = null;

    public function __construct(string $name, string $message, \DateTimeImmutable $createdAt)
    {
        $this->name = $name;
        $this->message = $message;
        $this->createdAt = $createdAt;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function getMessage(): string
    {
        return $this->message;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function isApproved(): bool
    {
        return null !== $this->approvedAt;
    }

    public function approve(\DateTimeImmutable $at): void
    {
        $this->approvedAt ??= $at;
    }
}
