// @ts-check
import { siteFonts } from '@portfolio/ui-kit/fonts';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

// Preview of every ui-kit component. Never deployed; built in CI so a broken
// component fails the build.
export default defineConfig({
  output: 'static',
  fonts: siteFonts,
  vite: {
    plugins: [tailwindcss()],
  },
});
