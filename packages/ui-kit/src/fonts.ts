import type { AstroUserConfig } from 'astro';
import { fontProviders } from 'astro/config';

type FontFamily = NonNullable<AstroUserConfig['fonts']>[number];

// Self-hosted at build time by Astro's Fonts API (Fontsource as the source).
// Astro also generates metric-matched fallbacks, so text doesn't shift on swap.
const shared = {
  provider: fontProviders.fontsource(),
  subsets: ['latin'],
  formats: ['woff2'],
  display: 'swap',
  styles: ['normal'],
} satisfies Partial<FontFamily>;

export const displayFont: FontFamily = {
  ...shared,
  name: 'Big Shoulders Display',
  cssVariable: '--font-big-shoulders',
  weights: [700, 900],
  fallbacks: ['Arial Narrow', 'sans-serif'],
};

export const bodyFont: FontFamily = {
  ...shared,
  name: 'Libre Franklin',
  cssVariable: '--font-libre-franklin',
  weights: [400, 500, 700],
  fallbacks: ['sans-serif'],
};

export const codeFont: FontFamily = {
  ...shared,
  name: 'Fira Code',
  cssVariable: '--font-fira-code',
  weights: [400, 500],
  fallbacks: ['monospace'],
};

/** For `fonts` in astro.config of every site. */
export const siteFonts: FontFamily[] = [displayFont, bodyFont];

/** For sites with documentation pages (imlostincode): adds Fira Code. */
export const docsFonts: FontFamily[] = [displayFont, bodyFont, codeFont];
