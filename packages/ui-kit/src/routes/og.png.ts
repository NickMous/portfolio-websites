import type { APIRoute } from 'astro';
import { getLocale } from '../locale';
import { renderOgImage } from '../og';
import { sites, type SiteKey } from '../sites';

/** The site's default social preview: its wordmark, poster style. */
export const GET: APIRoute = ({ site: url }) => {
  const site = (Object.keys(sites) as SiteKey[]).find((key) =>
    (Object.values(sites[key].domains) as string[]).includes(url?.hostname ?? ''),
  );
  if (!site) throw new Error(`No site for ${url?.href}; set \`site\` in astro.config`);
  const png = renderOgImage({ site, title: sites[site].name, locale: getLocale() });
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
