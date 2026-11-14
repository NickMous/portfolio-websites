import type en from './en';

export default {
  meta: {
    title: 'imlostincode: ik los mijn eigen problemen op',
    description:
      'Dingen die ik bouwde omdat iets me in de weg zat, opgeschoond zodat iedereen ze kan gebruiken. Open source, gratis, en gemaakt met meer plezier dan strikt nodig.',
  },
  nav: {
    fixes: 'De fixes',
    stillLost: 'Nog verdwaald',
  },
  hero: {
    line1: 'Ik los mijn eigen',
    line2: 'problemen op.',
    line3: 'Jij krijgt',
    line4: 'de fixes.',
    intro:
      'Dingen die ik bouwde omdat iets me in de weg zat, opgeschoond zodat iedereen ze kan gebruiken. Open source, gratis, en gemaakt met meer plezier dan strikt nodig.',
  },
  getLost: {
    button: 'Laat me verdwalen →',
    nowLostIn: 'Je bent nu verdwaald in',
  },
  sections: {
    fixes: 'De fixes',
    fixesIntro: 'Elk heeft eigen docs, rechtstreeks uit de repo, voor elke versie.',
    noFixes: '[NO FIXES PUBLISHED YET]',
    stillLost: 'Nog verdwaald',
    stillLostIntro:
      'Het projectkerkhof. Dingen die ik begon en weer stopte. Sommige worden teruggevonden.',
  },
  cards: {
    docs: 'Docs',
  },
  footer: {
    stuck: 'Vastgelopen met een van deze?',
    tellMe: 'Laat het me weten',
  },
} satisfies typeof en;
