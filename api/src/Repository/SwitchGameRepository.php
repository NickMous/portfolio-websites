<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\SwitchGame;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/** @extends ServiceEntityRepository<SwitchGame> */
class SwitchGameRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, SwitchGame::class);
    }
}
