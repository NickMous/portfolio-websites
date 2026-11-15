import { locales, type Locale } from './locale';
import { siteUrl, type SiteKey } from './sites';

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * sitemap.xml for one domain. Each page lists its twin on the other domain
 * (same path), like the hreflang links in the page head.
 */
export function sitemapXml(site: SiteKey, locale: Locale, paths: string[]): string {
  const urls = paths.map((path) => {
    const alternates = [
      ...locales.map((l) => [l, siteUrl(site, l, path)] as const),
      ['x-default', siteUrl(site, 'en', path)] as const,
    ].map(
      ([lang, href]) =>
        `    <xhtml:link rel="alternate" hreflang="${lang}" href="${escape(href)}"/>`,
    );
    return [
      '  <url>',
      `    <loc>${escape(siteUrl(site, locale, path))}</loc>`,
      ...alternates,
      '  </url>',
    ].join('\n');
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');
}

export function robotsTxt(site: SiteKey, locale: Locale): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl(site, locale, '/sitemap.xml')}\n`;
}

/** False for pages that ask not to be indexed (the docs redirects). */
export function isIndexable(html: string): boolean {
  return !/<meta name="robots" content="[^"]*noindex/.test(html);
}
