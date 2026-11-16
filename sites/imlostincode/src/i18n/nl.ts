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
    stillLost: 'Nog verdwaald',
    stillLostIntro:
      'Het projectkerkhof. Dingen die ik begon en weer stopte. Sommige worden teruggevonden.',
  },
  cards: {
    docs: 'Docs',
  },
  docs: {
    version: 'Versie',
    latest: 'nieuwste',
    unreleased: 'niet uitgebracht',
    projectNav: 'Project',
    overview: 'Overzicht',
    docs: 'Docs',
    examples: 'Voorbeelden',
    changelog: 'Changelog',
    docsForVersion: 'Docs voor deze versie →',
    noNotes: 'Geen notities bij deze release.',
    sidebar: 'Documentatie',
    unreleasedBadge: 'Niet uitgebracht',
    readingMain: 'Je leest de docs van',
    canChange: 'Dit kan nog veranderen voor de volgende release.',
    backToLatest: 'Terug naar de nieuwste release →',
    previous: '← Vorige',
    next: 'Volgende →',
    editOnGitHub: 'Bewerk deze pagina op GitHub ↗',
    newTab: '(opent in een nieuw tabblad)',
    viewOnGitHub: 'Bekijk op GitHub ↗',
    noOverview: 'Geen README in deze versie. Die is ook verdwaald.',
    redirecting: 'Doorsturen naar',
  },
  footer: {
    stuck: 'Vastgelopen met een van deze?',
    tellMe: 'Laat het me weten',
  },
} satisfies typeof en;
