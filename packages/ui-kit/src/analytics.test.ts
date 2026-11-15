// @vitest-environment happy-dom
// @vitest-environment-options {"url": "https://nickmous.com/"}
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadUmami, track, trackOutboundLinks, umamiConfig } from './analytics';

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

describe('track', () => {
  afterEach(() => {
    delete window.umami;
  });

  it('sends the event to Umami', () => {
    const calls: unknown[][] = [];
    window.umami = { track: (...args: unknown[]) => void calls.push(args) };
    track('konami', { input: 'keys' });
    expect(calls).toEqual([['konami', { input: 'keys' }]]);
  });

  it('does nothing when the tracker is blocked or not loaded', () => {
    expect(() => track('konami')).not.toThrow();
  });
});

describe('trackOutboundLinks', () => {
  const calls: unknown[][] = [];
  trackOutboundLinks(document, 'nickmous.com');
  beforeEach(() => {
    window.umami = { track: (...args: unknown[]) => void calls.push(args) };
  });

  const click = (html: string) => {
    calls.length = 0;
    document.body.innerHTML = html;
    const target = document.body.querySelector('[data-target]') ?? document.body.firstElementChild!;
    target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    document.body.innerHTML = '';
    return calls;
  };
  // happy-dom would try to navigate; keep the page where it is.
  window.addEventListener('click', (e) => e.preventDefault(), { capture: true });

  it('tracks a click on a link to another site', () => {
    expect(
      click('<a href="https://github.com/NickMous"><span data-target>GitHub</span></a>'),
    ).toEqual([['outbound-link', { url: 'https://github.com/NickMous' }]]);
  });

  it('leaves internal links, email links and links with their own event alone', () => {
    expect(click('<a href="/#games">Games</a>')).toEqual([]);
    expect(click('<a href="https://nickmous.com/x">Self</a>')).toEqual([]);
    expect(click('<a href="mailto:a@b.c">Mail</a>')).toEqual([]);
    expect(
      click('<a href="https://nickmous.nl/" data-umami-event="language-switch">NL</a>'),
    ).toEqual([]);
  });
});
