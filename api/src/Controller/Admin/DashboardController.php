<?php

declare(strict_types=1);

namespace App\Controller\Admin;

use EasyCorp\Bundle\EasyAdminBundle\Attribute\AdminDashboard;
use EasyCorp\Bundle\EasyAdminBundle\Config\Dashboard;
use EasyCorp\Bundle\EasyAdminBundle\Config\MenuItem;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractDashboardController;
use Symfony\Component\HttpFoundation\Response;

/** Sander's backoffice: Switch games by hand, and the guestbook. */
#[AdminDashboard(routePath: '/admin', routeName: 'admin')]
final class DashboardController extends AbstractDashboardController
{
    public function index(): Response
    {
        return $this->redirectToRoute('admin_switch_game_index');
    }

    public function configureDashboard(): Dashboard
    {
        return Dashboard::new()->setTitle('nickmous');
    }

    public function configureMenuItems(): iterable
    {
        yield MenuItem::linkTo(SwitchGameCrudController::class, 'Switch games', 'fa fa-gamepad');
        yield MenuItem::linkTo(GuestbookEntryCrudController::class, 'Guestbook', 'fa fa-book');
        yield MenuItem::linkToLogout('Log out', 'fa fa-sign-out');
    }
}
