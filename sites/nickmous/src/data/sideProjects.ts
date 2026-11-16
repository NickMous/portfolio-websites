import type { Locale, PosterColor } from '@portfolio/ui-kit';

export interface SideProject {
  title: string;
  /** Repo names keep their case; other titles are set in capitals. */
  keepCase?: boolean;
  href?: string;
  color: PosterColor;
  oneLiner: Record<Locale, string>;
}

/** Side projects, in display order. Later synced from GitHub. */
export const sideProjects: SideProject[] = [
  {
    title: 'astro-i18n',
    keepCase: true,
    href: 'https://github.com/NickMous/astro-i18n',
    color: 'green',
    oneLiner: {
      en: 'My own translation package, because I wanted typos in keys to break the build.',
      nl: 'Mijn eigen vertaalpakket, omdat ik wilde dat typfouten in sleutels de build laten falen.',
    },
  },
  {
    title: 'netstation',
    keepCase: true,
    href: 'https://github.com/NickMous/netstation',
    color: 'blue',
    oneLiner: {
      en: 'Thin clients that boot over the network and start fresh every time.',
      nl: 'Thin clients die via het netwerk opstarten en elke keer schoon beginnen.',
    },
  },
  {
    title: 'Environment-Switcher',
    keepCase: true,
    href: 'https://github.com/NickMous/Environment-Switcher',
    color: 'red',
    oneLiner: {
      en: "A browser extension that opens the page you're on in another environment, like local or live, with one click.",
      nl: 'Een browserextensie die de pagina waar je bent met één klik in een andere omgeving opent, zoals lokaal of live.',
    },
  },
];
