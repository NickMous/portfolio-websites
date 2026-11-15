<?php

declare(strict_types=1);

namespace App\Guestbook;

use App\Entity\GuestbookEntry;
use Psr\Clock\ClockInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\UriSigner;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;

/** Emails Sander a new entry with signed approve and delete links. */
final readonly class ModeratorMailer
{
    public const string LINK_LIFETIME = '+30 days';

    public function __construct(
        private MailerInterface $mailer,
        private UrlGeneratorInterface $urls,
        private UriSigner $signer,
        private ClockInterface $clock,
        #[Autowire(env: 'GUESTBOOK_MODERATOR_EMAIL')]
        private string $moderator,
        #[Autowire(env: 'MAILER_FROM')]
        private string $from,
    ) {
    }

    public function sendForApproval(GuestbookEntry $entry): void
    {
        $expires = $this->clock->now()->modify(self::LINK_LIFETIME);
        $link = fn (string $route) => $this->signer->sign(
            $this->urls->generate($route, ['id' => $entry->getId()], UrlGeneratorInterface::ABSOLUTE_URL),
            $expires,
        );

        $this->mailer->send((new Email())
            ->from($this->from)
            ->to($this->moderator)
            ->subject(\sprintf('Guestbook: new entry from %s', $entry->getName()))
            ->text(<<<TEXT
                {$entry->getName()} left a note on nickmous:

                {$entry->getMessage()}

                Approve: {$link('guestbook_approve')}
                Delete:  {$link('guestbook_delete')}

                The links work for 30 days. Opening one asks before it changes anything.
                TEXT));
    }
}
