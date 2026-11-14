// @ts-check
import { getLocale, siteUrl } from '@portfolio/ui-kit';
import { siteFonts } from '@portfolio/ui-kit/fonts';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

// One build per locale: LOCALE=en → webenjoyer.com, LOCALE=nl → webenjoyer.nl.
const locale = getLocale();

export default defineConfig({
  site: siteUrl('webenjoyer', locale),
  outDir: `dist/${locale}`,
  output: 'static',
  fonts: siteFonts,
  vite: {
    plugins: [tailwindcss()],
  },
});
