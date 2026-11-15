import type en from './en';

export default {
  meta: {
    title: 'nickmous: de persoonlijke kant van Sander',
    description:
      'Dit is de persoonlijke kant: wat ik speel, waar ik aan knutsel, en een gastenboek als je iets wilt achterlaten.',
  },
  nav: {
    games: 'Games',
    projects: 'Projecten',
    about: 'Over mij',
    guestbook: 'Gastenboek',
  },
  hero: {
    line1: 'Hoi, ik ben',
    line2: 'nickmous.',
    line3: 'Ook bekend',
    line4: 'als Sander.',
    intro:
      'Dit is de persoonlijke kant: wat ik speel, waar ik aan knutsel, en een gastenboek als je iets wilt achterlaten.',
    workNote: 'Op zoek naar het werk? Dat staat op',
  },
  sections: {
    sideProjects: 'Zijprojecten',
    sideProjectsIntro: 'Dingen die ik voor mezelf bouw. Klantwerk staat op',
    notCoding: 'Als ik niet aan het coden ben',
    notCodingText:
      '[Two or three sentences about you, starting with the hobbies above. Not the job.]',
  },
  nowPlaying: {
    title: 'Nu aan het spelen',
    refreshes: 'Steam-stats verversen elke 20 min',
    steam: 'Steam',
    switch: 'Switch 2',
    hoursPlayedOne: '{n} uur gespeeld',
    hoursPlayedOther: '{n} uur gespeeld',
    lastPlayed: 'Laatst gespeeld {when}',
    steamTile: 'Steam, afgelopen 2 weken',
    steamHoursOne: '{n} uur',
    steamHoursOther: '{n} uur',
    steamGamesOne: 'in {n} game',
    steamGamesOther: 'in {n} games',
    steamDown: 'Steam reageert nu even niet.',
    switchTile: 'Op de Switch 2',
    switchNote: 'Met de hand bijgewerkt, want Nintendo heeft geen API.',
    nothing: 'De gamestats zijn nu even niet bereikbaar. Probeer het straks nog eens.',
  },
  guestbook: {
    title: 'Laat iets achter',
    intro: 'Teken het gastenboek. Je bericht verschijnt zodra ik het gelezen heb.',
    name: 'Naam',
    message: 'Bericht',
    submit: 'Teken →',
    sending: 'Bezig…',
    sent: 'Bedankt! Je bericht verschijnt zodra ik het gelezen heb.',
    tooMany: 'Dat zijn veel berichten. Probeer het over een uur nog eens.',
    failed: 'Versturen lukte niet. Probeer het straks nog eens.',
    nameMissing: 'Vul je naam in.',
    nameTooLong: 'Houd je naam op maximaal 40 tekens.',
    nameInvalid: 'Die naam werkt niet. Houd hem op maximaal 40 tekens.',
    messageMissing: 'Schrijf een bericht.',
    messageTooLong: 'Houd je bericht op maximaal 500 tekens.',
    messageInvalid: 'Dat bericht werkt niet. Houd het op maximaal 500 tekens.',
    entriesLabel: 'Berichten van bezoekers',
    empty: 'Nog geen berichten. Wees de eerste.',
    honeypot: 'Laat dit leeg',
  },
  hobbies: {
    orchestra: 'Orkest · [instrument]',
    electronic: 'Elektronische muziek op repeat',
    cycling: 'Fietsen',
    volleyball: 'Volleybal',
  },
  footer: {
    secret: 'Er zit ergens op deze pagina een geheim.',
  },
} satisfies typeof en;
