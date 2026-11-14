// @ts-check
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://sanderdh.com',
  output: 'static',
  vite: {
    plugins: [tailwindcss()],
  },
});
