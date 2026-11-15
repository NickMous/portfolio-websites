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
    title: '[Project]',
    color: 'blue',
    oneLiner: { en: '[One line about it]', nl: '[One line about it]' },
  },
  {
    title: '[Project]',
    color: 'red',
    oneLiner: { en: '[One line about it]', nl: '[One line about it]' },
  },
];
