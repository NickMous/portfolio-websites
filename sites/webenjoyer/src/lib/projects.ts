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
