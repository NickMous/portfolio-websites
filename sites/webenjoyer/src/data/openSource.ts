import type { Locale } from '@portfolio/ui-kit';

export interface OpenSourceRepo {
  name: string;
  href: string;
  kind: 'package' | 'kit';
  oneLiner: Record<Locale, string>;
}

/** Repos for the "Open source" section, in display order. */
export const openSourceRepos: OpenSourceRepo[] = [
  {
    name: 'astro-i18n',
    href: 'https://github.com/NickMous/astro-i18n',
    kind: 'package',
    oneLiner: {
      en: 'Type-safe translations for Astro. A typo in a key fails the build, not the live site.',
      nl: 'Typeveilige vertalingen voor Astro. Een typfout in een sleutel laat de build falen, niet de live site.',
    },
  },
  {
    name: 'astro-k8s-deployment-kit',
    href: 'https://github.com/NickMous/astro-k8s-deployment-kit',
    kind: 'kit',
    oneLiner: {
      en: 'Shared deploy setup for Astro sites. Fix it once, and every site picks it up on its next update.',
      nl: 'Gedeelde deploy-setup voor Astro-sites. Eén keer fixen, en elke site neemt het mee bij de volgende update.',
    },
  },
  {
    name: 'symfony-k8s-deployment-kit',
    href: 'https://github.com/NickMous/symfony-k8s-deployment-kit',
    kind: 'kit',
    oneLiner: {
      en: 'The same idea for Symfony apps: one shared deploy setup instead of a copy in every project.',
      nl: 'Hetzelfde idee voor Symfony-apps: één gedeelde deploy-setup in plaats van een kopie in elk project.',
    },
  },
];
