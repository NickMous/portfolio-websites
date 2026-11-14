import { describe, expect, it } from 'vitest';
import { badgeStatus, displayHost, groupProjects, nextProject, type ProjectLike } from './projects';

const project = (id: string, data: Partial<ProjectLike['data']>): ProjectLike => ({
  id,
  data: { kind: 'client', status: 'live', featured: false, order: 0, ...data },
});

describe('groupProjects', () => {
  it('sorts each project into the homepage section it belongs to', () => {
    const groups = groupProjects([
      project('oktoberfest', { featured: true }),
      project('netstation', { kind: 'personal', status: 'in-testing' }),
      project('beanstash', { kind: 'school', status: 'archived' }),
      project('unfeatured-client', { featured: false }),
    ]);

    expect(groups.nowShowing.map((p) => p.id)).toEqual(['oktoberfest']);
    expect(groups.comingSoon.map((p) => p.id)).toEqual(['netstation']);
    expect(groups.earlyWork.map((p) => p.id)).toEqual(['beanstash']);
  });

  it('never shows a featured project that is still in testing as a live poster', () => {
    const groups = groupProjects([project('netstation', { featured: true, status: 'in-testing' })]);

    expect(groups.nowShowing).toEqual([]);
    expect(groups.comingSoon.map((p) => p.id)).toEqual(['netstation']);
  });

  it('keeps the configured order within a section', () => {
    const groups = groupProjects([
      project('debrug', { featured: true, order: 3 }),
      project('oktoberfest', { featured: true, order: 1 }),
      project('clubvanooit', { featured: true, order: 2 }),
    ]);

    expect(groups.nowShowing.map((p) => p.id)).toEqual(['oktoberfest', 'clubvanooit', 'debrug']);
  });
});

describe('badgeStatus', () => {
  it('shows no badge for archived work', () => {
    expect(badgeStatus('archived')).toBeUndefined();
  });
});

describe('displayHost', () => {
  it('drops the protocol, www and path', () => {
    expect(displayHost('https://www.example.nl/agenda/')).toBe('example.nl');
  });
});

describe('nextProject', () => {
  const list = [project('a', {}), project('b', {}), project('c', {})];

  it('returns the following project and wraps around after the last', () => {
    expect(nextProject(list, 'a')?.id).toBe('b');
    expect(nextProject(list, 'c')?.id).toBe('a');
  });

  it('has no next poster when the project is the only one', () => {
    expect(nextProject([project('a', {})], 'a')).toBeUndefined();
  });
});
