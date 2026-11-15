<?php

declare(strict_types=1);

namespace App\Guestbook;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\GuestbookEntry;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Clock\ClockInterface;
use Symfony\Component\DependencyInjection\Attribute\Target;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;
use Symfony\Component\RateLimiter\RateLimiterFactoryInterface;

/** @implements ProcessorInterface<NewGuestbookEntry, null> */
final readonly class SubmitEntryProcessor implements ProcessorInterface
{
    public function __construct(
        private EntityManagerInterface $em,
        private ModeratorMailer $mailer,
        private ClockInterface $clock,
        private RequestStack $requests,
        #[Target('guestbook')]
        private RateLimiterFactoryInterface $limiter,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): null
    {
        $limit = $this->limiter->create($this->visitor())->consume();
        if (!$limit->isAccepted()) {
            throw new TooManyRequestsHttpException($limit->getRetryAfter()->getTimestamp() - $this->clock->now()->getTimestamp());
        }

        if ('' !== $data->website) {
            return null;
        }

        // The mail needs the entry's id, and an entry the mail never reached
        // would wait for approval forever: store and send succeed together.
        $this->em->wrapInTransaction(function () use ($data): void {
            $entry = new GuestbookEntry(trim($data->name), trim($data->message), $this->clock->now());
            $this->em->persist($entry);
            $this->em->flush();
            $this->mailer->sendForApproval($entry);
        });

        return null;
    }

    /**
     * Cloudflare sits in front of the API and the ingress does not pass on the
     * original X-Forwarded-For, so the visitor's address comes from Cloudflare's
     * header. Faking it only gets someone a fresh rate limit bucket.
     */
    private function visitor(): string
    {
        $request = $this->requests->getCurrentRequest();

        return $request?->headers->get('CF-Connecting-IP') ?? $request?->getClientIp() ?? 'unknown';
    }
}
