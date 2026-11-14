// @ts-check
import { siteFonts } from '@portfolio/ui-kit/fonts';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://sanderdh.com',
  output: 'static',
  fonts: siteFonts,
  vite: {
    plugins: [tailwindcss()],
  },
});
