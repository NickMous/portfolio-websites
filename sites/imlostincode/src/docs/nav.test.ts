import { describe, expect, it } from 'vitest';
import { prevNext, versionTarget, type PageRef } from './nav';

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
