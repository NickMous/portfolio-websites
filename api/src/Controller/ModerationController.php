<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\GuestbookEntry;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Clock\ClockInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\UriSigner;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\Routing\Attribute\Route;

/**
 * The links in the moderator email. Opening one (GET) shows the entry and a
 * button; only pressing it (POST to the same signed URL) changes anything, so
 * a mail scanner that follows links cannot approve or delete entries.
 */
final class ModerationController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly UriSigner $signer,
        private readonly ClockInterface $clock,
    ) {
    }

    #[Route('/guestbook/{id}/approve', name: 'guestbook_approve', methods: ['GET', 'POST'], requirements: ['id' => '\d+'])]
    public function approve(Request $request, int $id): Response
    {
        $entry = $this->entry($request, $id);
        if ($request->isMethod('POST')) {
            $entry->approve($this->clock->now());
            $this->em->flush();

            return $this->render('guestbook/done.html.twig', ['message' => 'Approved. It is on the guestbook now.']);
        }

        return $this->render('guestbook/moderate.html.twig', ['entry' => $entry, 'action' => 'Approve']);
    }

    #[Route('/guestbook/{id}/delete', name: 'guestbook_delete', methods: ['GET', 'POST'], requirements: ['id' => '\d+'])]
    public function delete(Request $request, int $id): Response
    {
        $entry = $this->entry($request, $id);
        if ($request->isMethod('POST')) {
            $this->em->remove($entry);
            $this->em->flush();

            return $this->render('guestbook/done.html.twig', ['message' => 'Deleted.']);
        }

        return $this->render('guestbook/moderate.html.twig', ['entry' => $entry, 'action' => 'Delete']);
    }

    private function entry(Request $request, int $id): GuestbookEntry
    {
        // Checks the signature and the expiry the link was signed with.
        if (!$this->signer->checkRequest($request)) {
            throw new AccessDeniedHttpException('This link is not valid (any more).');
        }

        return $this->em->find(GuestbookEntry::class, $id)
            ?? throw $this->createNotFoundException('This entry no longer exists.');
    }
}
