import type en from './en';

export default {
  meta: {
    title: 'WebEnjoyer: websites door Sander',
    description:
      'WebEnjoyer, dat ben ik, Sander. In mijn vrije tijd bouw ik websites, en oplossingen voor problemen waar ik tegenaan loop.',
  },
  nav: {
    work: 'Werk',
    openSource: 'Open source',
    schoolStuff: 'Schoolwerk',
    sayHi: 'Zeg hoi',
  },
  hero: {
    surfing: 'Surfen',
    theWebComma: 'op het web,',
    creating: 'bouwen',
    theWebPeriod: 'aan het web.',
    intro:
      'WebEnjoyer, dat ben ik, Sander. In mijn vrije tijd bouw ik websites, en oplossingen voor problemen waar ik tegenaan loop. Allerlei sites voor allerlei doelen, gemaakt in Astro en Symfony, op hosting die ik zelf beheer.',
    note: 'Voorlopig volgeboekt. Hoi zeggen mag altijd.',
  },
  sections: {
    nowShowing: 'Nu te zien',
    comingSoon: 'Binnenkort',
    openSource: 'Open source',
    openSourceIntro:
      'Dingen die ik voor mijn eigen projecten maakte, opgeschoond zodat iedereen ze kan gebruiken. Aantekeningen en valkuilen staan op',
    earlyWork: 'Vroeg werk',
    earlyWorkIntro: 'Schoolprojecten. Nog wat ruw, maar hier begon het.',
  },
  repoTags: {
    package: 'npm-pakket',
    kit: 'deployment kit',
  },
  stubs: {
    school: 'School',
    group: 'Groep',
  },
} satisfies typeof en;
