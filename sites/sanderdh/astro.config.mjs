// @ts-check
import { getLocale, siteUrl } from '@portfolio/ui-kit';
import { siteFonts } from '@portfolio/ui-kit/fonts';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

// One build per locale: LOCALE=en → sanderdh.com, LOCALE=nl → sanderdh.nl.
const locale = getLocale();

export default defineConfig({
  site: siteUrl('sanderdh', locale),
  outDir: `dist/${locale}`,
  output: 'static',
  fonts: siteFonts,
  vite: {
    plugins: [tailwindcss()],
  },
});
