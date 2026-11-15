/**
 * The poster colors, for images rendered outside the browser (favicons, OG
 * images). theme.css is the source of truth; a test keeps these in step.
 */
export const palette = {
  ink: '#141414',
  white: '#ffffff',
  yellow: '#f2b705',
  blue: '#1f4fd8',
  red: '#c8321c',
  green: '#0b7a4d',
} as const;

/** Text color on a lead color: ink on yellow (white on yellow fails contrast), white otherwise. */
export const onColor = (lead: 'yellow' | 'blue' | 'red' | 'green') =>
  lead === 'yellow' ? palette.ink : palette.white;
