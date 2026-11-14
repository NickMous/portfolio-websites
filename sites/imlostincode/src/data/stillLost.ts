import type { Locale } from '@portfolio/ui-kit';

export interface LostProject {
  name: string;
  /** e.g. "2021 – 2022", or "2023 – ?" while it is being found again. */
  dates: string;
  status: 'stillLost' | 'beingFoundAgain';
  oneLiner: Record<Locale, string>;
}

/** The project graveyard, in display order. */
export const stillLost: LostProject[] = [
  {
    name: 'pico-leds-webserver',
    dates: '[YEAR] – [YEAR]',
    status: 'stillLost',
    oneLiner: { en: '[ONE-LINER]', nl: '[ONE-LINER]' },
  },
  {
    name: 'CycleQuest',
    dates: '[YEAR] – ?',
    status: 'beingFoundAgain',
    oneLiner: { en: '[ONE-LINER]', nl: '[ONE-LINER]' },
  },
];
