<?php

declare(strict_types=1);

namespace App\Controller\Admin;

use App\Entity\GuestbookEntry;
use Doctrine\ORM\EntityManagerInterface;
use EasyCorp\Bundle\EasyAdminBundle\Attribute\AdminRoute;
use EasyCorp\Bundle\EasyAdminBundle\Config\Action;
use EasyCorp\Bundle\EasyAdminBundle\Config\Actions;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\BooleanField;
use EasyCorp\Bundle\EasyAdminBundle\Field\DateTimeField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextareaField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;
use Psr\Clock\ClockInterface;
use Symfony\Component\HttpFoundation\Response;

/**
 * Every entry, approved or not, to approve or remove. Entries come from
 * visitors, so they can't be created or edited here.
 *
 * @extends AbstractCrudController<GuestbookEntry>
 */
final class GuestbookEntryCrudController extends AbstractCrudController
{
    public static function getEntityFqcn(): string
    {
        return GuestbookEntry::class;
    }

    public function configureCrud(Crud $crud): Crud
    {
        return $crud
            ->setEntityLabelInSingular('Guestbook entry')
            ->setEntityLabelInPlural('Guestbook')
            ->setDefaultSort(['createdAt' => 'DESC']);
    }

    public function configureActions(Actions $actions): Actions
    {
        $approve = Action::new('approve', 'Approve', 'fa fa-check')
            ->linkToCrudAction('approve')
            ->renderAsForm()
            ->displayIf(static fn (GuestbookEntry $entry): bool => !$entry->isApproved());

        return $actions
            ->disable(Action::NEW, Action::EDIT)
            ->add(Crud::PAGE_INDEX, $approve)
            ->add(Crud::PAGE_DETAIL, $approve);
    }

    public function configureFields(string $pageName): iterable
    {
        yield TextField::new('name');
        yield TextareaField::new('message');
        yield DateTimeField::new('createdAt');
        yield BooleanField::new('approved')->renderAsSwitch(false);
    }

    #[AdminRoute('/{id}/approve', 'approve', options: ['methods' => ['POST']])]
    public function approve(GuestbookEntry $entry, EntityManagerInterface $em, ClockInterface $clock): Response
    {
        $entry->approve($clock->now());
        $em->flush();
        $this->addFlash('success', 'Approved.');

        return $this->redirectToRoute('admin_guestbook_entry_index');
    }
}
