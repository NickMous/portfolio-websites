<?php

declare(strict_types=1);

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\GetCollection;
use App\Repository\SwitchGameRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Context;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Serializer\Normalizer\DateTimeNormalizer;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * A Switch 2 game for "Now playing". Nintendo has no API, so Sander keeps
 * these up to date by hand in the admin; the API only reads them.
 */
#[ORM\Entity(repositoryClass: SwitchGameRepository::class)]
#[ApiResource(
    operations: [new GetCollection(uriTemplate: '/switch')],
    normalizationContext: ['groups' => ['switch:read']],
    order: ['lastPlayed' => 'DESC'],
    paginationEnabled: false,
)]
class SwitchGame
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 100)]
    #[Assert\NotBlank]
    #[Assert\Length(max: 100)]
    #[Groups(['switch:read'])]
    private string $title = '';

    /** Box or key art, hosted elsewhere. */
    #[ORM\Column(length: 500, nullable: true)]
    #[Assert\Url(protocols: ['https'], requireTld: true)]
    #[Assert\Length(max: 500)]
    #[Groups(['switch:read'])]
    private ?string $art = null;

    #[ORM\Column]
    #[Assert\PositiveOrZero]
    #[Groups(['switch:read'])]
    private int $hoursPlayed = 0;

    // Nullable only until the admin form is filled in; NotNull guards the rest.
    #[ORM\Column(type: Types::DATE_IMMUTABLE)]
    #[Assert\NotNull]
    #[Groups(['switch:read'])]
    #[Context([DateTimeNormalizer::FORMAT_KEY => 'Y-m-d'])]
    private ?\DateTimeImmutable $lastPlayed = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getTitle(): string
    {
        return $this->title;
    }

    public function setTitle(string $title): void
    {
        $this->title = $title;
    }

    public function getArt(): ?string
    {
        return $this->art;
    }

    public function setArt(?string $art): void
    {
        $this->art = $art;
    }

    public function getHoursPlayed(): int
    {
        return $this->hoursPlayed;
    }

    public function setHoursPlayed(int $hoursPlayed): void
    {
        $this->hoursPlayed = $hoursPlayed;
    }

    public function getLastPlayed(): ?\DateTimeImmutable
    {
        return $this->lastPlayed;
    }

    public function setLastPlayed(?\DateTimeImmutable $lastPlayed): void
    {
        $this->lastPlayed = $lastPlayed;
    }

    public function __toString(): string
    {
        return $this->title;
    }
}
