import { describe, expect, it } from 'vitest';
import { exampleGroups, prevNext, versionTarget, type PageRef } from './nav';

const page = (version: string, section: PageRef['section'], slug = '', order = 0): PageRef => ({
  version,
  section,
  slug,
  order,
});

const pages = [
  page('1.2', 'overview'),
  page('1.2', 'doc', 'install', 1),
  page('1.2', 'doc', 'configure', 2),
  page('1.1', 'overview'),
  page('1.1', 'doc', 'setup', 1),
  page('main', 'overview'),
];

describe('versionTarget', () => {
  it('stays on the same page when the other version has it', () => {
    expect(versionTarget(pages, page('1.1', 'doc', 'install'), '1.2')).toEqual(
      page('1.2', 'doc', 'install', 1),
    );
  });

  it('falls back to the first doc of the other version', () => {
    expect(versionTarget(pages, page('1.2', 'doc', 'configure'), '1.1')).toEqual(
      page('1.1', 'doc', 'setup', 1),
    );
  });

  it('falls back to the overview when the other version has no docs', () => {
    expect(versionTarget(pages, page('1.2', 'doc', 'install'), 'main')).toEqual(
      page('main', 'overview'),
    );
  });
});

describe('prevNext', () => {
  it('walks the docs of one version in order', () => {
    const docs = pages.filter((p) => p.section === 'doc' && p.version === '1.2');

    expect(prevNext(docs, 'install')).toEqual({
      prev: undefined,
      next: page('1.2', 'doc', 'configure', 2),
    });
    expect(prevNext(docs, 'configure')).toEqual({
      prev: page('1.2', 'doc', 'install', 1),
      next: undefined,
    });
  });
});

describe('exampleGroups', () => {
  const file = (slug: string) => ({ version: '1.0', section: 'example' as const, slug, order: 0 });

  it('groups example files by folder: loose files first, then folders by path', () => {
    const groups = exampleGroups([
      file('overlay-ssr/kustomization.yaml'),
      file('README.md'),
      file('docker/Dockerfile'),
      file('overlay-ssr/generator/env.yaml'),
      file('docker/.dockerignore'),
    ]);

    expect(groups.map((g) => [g.folder, g.name, g.depth, g.files.map((f) => f.name)])).toEqual([
      ['', '', 0, ['README.md']],
      ['docker', 'docker', 0, ['.dockerignore', 'Dockerfile']],
      ['overlay-ssr', 'overlay-ssr', 0, ['kustomization.yaml']],
      ['overlay-ssr/generator', 'generator', 1, ['env.yaml']],
    ]);
  });

  it('keeps subfolders right under their parent', () => {
    const groups = exampleGroups([file('a-b/x.yaml'), file('a/c/y.yaml'), file('a/z.yaml')]);

    expect(groups.map((g) => g.folder)).toEqual(['a', 'a/c', 'a-b']);
  });

  it('lists a folder that only holds folders, so the tree has no gaps', () => {
    const groups = exampleGroups([file('k8s/prod/patches/a.yaml')]);

    expect(groups.map((g) => [g.name, g.depth, g.files.length])).toEqual([
      ['k8s', 0, 0],
      ['prod', 1, 0],
      ['patches', 2, 1],
    ]);
  });
});
