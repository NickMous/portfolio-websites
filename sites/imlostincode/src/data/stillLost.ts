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
    dates: '2024 – 2024',
    status: 'stillLost',
    oneLiner: {
      en: 'A Raspberry Pi Pico W that serves a web page for controlling an LED strip.',
      nl: 'Een Raspberry Pi Pico W die een webpagina serveert om een ledstrip te bedienen.',
    },
  },
  {
    name: 'CycleQuest',
    dates: '2024 – ?',
    status: 'beingFoundAgain',
    oneLiner: {
      en: 'A cycling puzzle trail for teams, with checkpoints and questions along the route. Version two, in Laravel.',
      nl: 'Een fietspuzzeltocht voor teams, met checkpoints en vragen onderweg. Versie twee, in Laravel.',
    },
  },
];
