// @ts-check
import { getLocale, siteUrl } from '@portfolio/ui-kit';
import { portfolioSite } from '@portfolio/ui-kit/integration';
import { docsFonts } from '@portfolio/ui-kit/fonts';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

// One build per locale: LOCALE=en → imlostincode.com, LOCALE=nl → imlostincode.nl.
const locale = getLocale();

// docsFonts adds the code font for the docs pages.

export default defineConfig({
  site: siteUrl('imlostincode', locale),
  outDir: `dist/${locale}`,
  output: 'static',
  integrations: [portfolioSite('imlostincode')],
  fonts: docsFonts,
  vite: {
    plugins: [tailwindcss()],
  },
});
