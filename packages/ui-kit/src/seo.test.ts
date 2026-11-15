import { describe, expect, it } from 'vitest';
import { isIndexable, robotsTxt, sitemapXml } from './seo';

describe('sitemapXml', () => {
  it('lists every page on this domain with its twin on the other one', () => {
    const xml = sitemapXml('webenjoyer', 'nl', ['', 'work/clubvanooit/']);
    expect(xml).toContain('<loc>https://webenjoyer.nl/work/clubvanooit/</loc>');
    expect(xml).toContain(
      '<xhtml:link rel="alternate" hreflang="en" href="https://webenjoyer.com/work/clubvanooit/"/>',
    );
    expect(xml).toContain(
      '<xhtml:link rel="alternate" hreflang="x-default" href="https://webenjoyer.com/"/>',
    );
    expect(xml.match(/<url>/g)).toHaveLength(2);
  });

  it('escapes paths for XML', () => {
    expect(sitemapXml('imlostincode', 'en', ['a&b/'])).toContain(
      '<loc>https://imlostincode.com/a&amp;b/</loc>',
    );
  });
});

describe('robotsTxt', () => {
  it('allows everything and points at this domain’s sitemap', () => {
    expect(robotsTxt('nickmous', 'nl')).toBe(
      'User-agent: *\nAllow: /\n\nSitemap: https://nickmous.nl/sitemap.xml\n',
    );
  });
});

describe('isIndexable', () => {
  it('leaves out pages marked noindex, like the docs redirects', () => {
    expect(isIndexable('<meta name="robots" content="noindex" />')).toBe(false);
    expect(isIndexable('<meta name="robots" content="noindex">')).toBe(false);
    expect(isIndexable('<title>Home</title>')).toBe(true);
  });
});
