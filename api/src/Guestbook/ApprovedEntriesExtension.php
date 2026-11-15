<?php

declare(strict_types=1);

namespace App\Guestbook;

use ApiPlatform\Doctrine\Orm\Extension\QueryCollectionExtensionInterface;
use ApiPlatform\Doctrine\Orm\Extension\QueryItemExtensionInterface;
use ApiPlatform\Doctrine\Orm\Util\QueryNameGeneratorInterface;
use ApiPlatform\Metadata\Operation;
use App\Entity\GuestbookEntry;
use Doctrine\ORM\QueryBuilder;

/** The API only ever shows approved entries, in lists and one by one. */
final class ApprovedEntriesExtension implements QueryCollectionExtensionInterface, QueryItemExtensionInterface
{
    public function applyToCollection(QueryBuilder $queryBuilder, QueryNameGeneratorInterface $queryNameGenerator, string $resourceClass, ?Operation $operation = null, array $context = []): void
    {
        $this->onlyApproved($queryBuilder, $resourceClass);
    }

    public function applyToItem(QueryBuilder $queryBuilder, QueryNameGeneratorInterface $queryNameGenerator, string $resourceClass, array $identifiers, ?Operation $operation = null, array $context = []): void
    {
        $this->onlyApproved($queryBuilder, $resourceClass);
    }

    private function onlyApproved(QueryBuilder $queryBuilder, string $resourceClass): void
    {
        if (GuestbookEntry::class !== $resourceClass) {
            return;
        }
        $queryBuilder->andWhere(\sprintf('%s.approvedAt IS NOT NULL', $queryBuilder->getRootAliases()[0]));
    }
}
