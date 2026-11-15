<?php

declare(strict_types=1);

namespace App\Guestbook;

use Symfony\Component\Validator\Constraints as Assert;

/** What the "Leave a mark" form posts. */
final class NewGuestbookEntry
{
    public const int MAX_NAME = 40;
    public const int MAX_MESSAGE = 500;

    #[Assert\NotBlank(normalizer: 'trim')]
    #[Assert\Length(max: self::MAX_NAME, normalizer: 'trim')]
    public string $name = '';

    #[Assert\NotBlank(normalizer: 'trim')]
    #[Assert\Length(max: self::MAX_MESSAGE, normalizer: 'trim')]
    public string $message = '';

    /**
     * Honeypot: hidden from people by the form, so only bots fill it in.
     * Such a post gets the normal response and is then dropped.
     */
    public string $website = '';
}
