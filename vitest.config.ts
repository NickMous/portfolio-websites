import { defineConfig } from 'vitest/config';

// Each workspace is its own Vitest project; a workspace can add its own
// vitest.config.ts (e.g. using Astro's getViteConfig) when it needs one.
export default defineConfig({
  test: {
    projects: ['packages/*/', 'sites/*/'],
    passWithNoTests: true,
  },
});
