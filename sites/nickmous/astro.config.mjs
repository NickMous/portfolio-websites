// @ts-check
import { getLocale, siteUrl } from '@portfolio/ui-kit';
import { portfolioSite } from '@portfolio/ui-kit/integration';
import { siteFonts } from '@portfolio/ui-kit/fonts';
import preact from '@astrojs/preact';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

// One build per locale: LOCALE=en → nickmous.com, LOCALE=nl → nickmous.nl.
const locale = getLocale();

export default defineConfig({
  site: siteUrl('nickmous', locale),
  outDir: `dist/${locale}`,
  output: 'static',
  fonts: siteFonts,
  // Islands (Now playing, the guestbook) are Preact: one component renders
  // at build time and hydrates in the browser.
  integrations: [portfolioSite('nickmous'), preact()],
  vite: {
    plugins: [tailwindcss()],
  },
});
