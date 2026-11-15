// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { loadUmami, umamiConfig } from './analytics';

const config = umamiConfig('nickmous');

afterEach(() => {
  document.head.innerHTML = '';
});

const scripts = () =>
  [...document.head.querySelectorAll('script')].map((s) => ({
    src: s.src,
    id: s.dataset.websiteId,
    domains: s.dataset.domains,
    defer: s.defer,
  }));

describe('loadUmami', () => {
  it('adds the tracker and the recorder on the site’s own domains', () => {
    for (const hostname of ['nickmous.com', 'nickmous.nl']) {
      document.head.innerHTML = '';
      loadUmami(document, hostname, config);
      expect(scripts()).toEqual([
        {
          src: 'https://analytics.nickmous.nl/script.js',
          id: config.websiteId,
          domains: 'nickmous.com,nickmous.nl',
          defer: true,
        },
        {
          src: 'https://analytics.nickmous.nl/recorder.js',
          id: config.websiteId,
          domains: 'nickmous.com,nickmous.nl',
          defer: true,
        },
      ]);
    }
  });

  // The recorder ignores data-domains, so local builds and previews must not load it at all.
  it('adds nothing anywhere else', () => {
    for (const hostname of ['localhost', 'www.nickmous.com', 'webenjoyer.com']) {
      loadUmami(document, hostname, config);
    }
    expect(scripts()).toEqual([]);
  });
});

describe('umamiConfig', () => {
  it('gives every site its own website id', () => {
    const ids = (['sanderdh', 'webenjoyer', 'imlostincode', 'nickmous'] as const).map(
      (site) => umamiConfig(site).websiteId,
    );
    expect(new Set(ids).size).toBe(4);
  });
});
