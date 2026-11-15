<?php

declare(strict_types=1);

namespace App\Controller\Admin;

use App\Entity\SwitchGame;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\DateField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IntegerField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;
use EasyCorp\Bundle\EasyAdminBundle\Field\UrlField;

/** @extends AbstractCrudController<SwitchGame> */
final class SwitchGameCrudController extends AbstractCrudController
{
    public static function getEntityFqcn(): string
    {
        return SwitchGame::class;
    }

    public function configureCrud(Crud $crud): Crud
    {
        return $crud
            ->setEntityLabelInSingular('Switch game')
            ->setEntityLabelInPlural('Switch games')
            ->setDefaultSort(['lastPlayed' => 'DESC']);
    }

    public function configureFields(string $pageName): iterable
    {
        yield TextField::new('title');
        yield UrlField::new('art')->setHelp('https link to box or key art (portrait works best).');
        yield IntegerField::new('hoursPlayed');
        yield DateField::new('lastPlayed');
    }
}
