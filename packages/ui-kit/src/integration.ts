import type { AstroIntegration } from 'astro';
import { readFile, writeFile } from 'node:fs/promises';
import { getLocale } from './locale';
import { isIndexable, robotsTxt, sitemapXml } from './seo';
import type { SiteKey } from './sites';

/**
 * Shared per-site build extras: `/og.png` (the site's social preview), and
 * after the build a sitemap.xml and robots.txt for this domain. Pages marked
 * noindex (the docs redirects) stay out of the sitemap.
 */
export function portfolioSite(site: SiteKey): AstroIntegration {
  const locale = getLocale();
  return {
    name: 'portfolio-site',
    hooks: {
      'astro:config:setup': ({ injectRoute }) => {
        injectRoute({
          pattern: '/og.png',
          entrypoint: new URL('./routes/og.png.ts', import.meta.url),
          prerender: true,
        });
      },
      'astro:build:done': async ({ dir, pages, logger }) => {
        const paths: string[] = [];
        for (const { pathname } of pages) {
          let html: string;
          try {
            html = await readFile(new URL(`${pathname}index.html`, dir), 'utf8');
          } catch {
            continue; // not an HTML page (og.png and other endpoints)
          }
          if (isIndexable(html)) paths.push(pathname);
        }
        paths.sort();
        await writeFile(new URL('sitemap.xml', dir), sitemapXml(site, locale, paths));
        await writeFile(new URL('robots.txt', dir), robotsTxt(site, locale));
        logger.info(`sitemap.xml with ${paths.length} pages, robots.txt`);
      },
    },
  };
}
