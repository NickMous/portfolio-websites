export type ProjectKind = 'client' | 'school' | 'personal';
export type ProjectStatus = 'live' | 'in-progress' | 'in-testing' | 'archived';

/** The fields the homepage needs to sort; matches the `projects` collection. */
export interface ProjectLike {
  id: string;
  data: {
    kind: ProjectKind;
    status: ProjectStatus;
    featured: boolean;
    order: number;
  };
}

export interface ProjectGroups<P extends ProjectLike> {
  /** Featured client work: big posters in "Now showing". */
  nowShowing: P[];
  /** Anything in testing: the dashed "Coming soon" strip. */
  comingSoon: P[];
  /** School projects: stubs in "Early work". */
  earlyWork: P[];
}

const byOrder = <P extends ProjectLike>(a: P, b: P) => a.data.order - b.data.order;

/** Sorts projects into the homepage sections, so adding an entry is all it takes. */
export function groupProjects<P extends ProjectLike>(projects: P[]): ProjectGroups<P> {
  const comingSoon = projects.filter((p) => p.data.status === 'in-testing');
  const nowShowing = projects.filter(
    (p) => p.data.kind === 'client' && p.data.featured && p.data.status !== 'in-testing',
  );
  const earlyWork = projects.filter((p) => p.data.kind === 'school');

  return {
    nowShowing: nowShowing.sort(byOrder),
    comingSoon: comingSoon.sort(byOrder),
    earlyWork: earlyWork.sort(byOrder),
  };
}

/** Badge status for a project, or none for archived work. */
export function badgeStatus(
  status: ProjectStatus,
): 'live' | 'inProgress' | 'inTesting' | undefined {
  return ({ live: 'live', 'in-progress': 'inProgress', 'in-testing': 'inTesting' } as const)[
    status as 'live'
  ];
}

/** "https://www.example.nl/" → "example.nl", for the poster's ticket strip. */
export function displayHost(url: string): string {
  return new URL(url).hostname.replace(/^www\./, '');
}

/** The project after `id` for the "Next poster" band, wrapping to the first. */
export function nextProject<P extends { id: string }>(list: P[], id: string): P | undefined {
  if (list.length < 2) return undefined;
  const index = list.findIndex((p) => p.id === id);
  return list[(index + 1) % list.length];
}
