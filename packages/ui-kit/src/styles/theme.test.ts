import { compile } from '@tailwindcss/node';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const base = path.dirname(new URL(import.meta.url).pathname);

/** Compile the theme with Tailwind and return the CSS generated for the given classes. */
async function build(...candidates: string[]): Promise<string> {
  const compiler = await compile('@import "tailwindcss";\n@import "./theme.css";', {
    base,
    onDependency: () => {},
  });
  return compiler.build(candidates);
}

/** Body of the rule for a single class, or undefined when Tailwind generated nothing. */
async function rule(candidate: string): Promise<string | undefined> {
  const css = await build(candidate);
  const selector = '.' + candidate.replace(/[^a-zA-Z0-9_-]/g, (c) => `\\${c}`);
  const start = css.indexOf(`${selector} {`);
  if (start === -1) return undefined;
  // Grab the balanced block so nested @media / &:hover rules are included.
  let depth = 0;
  for (let i = css.indexOf('{', start); i < css.length; i++) {
    if (css[i] === '{') depth++;
    if (css[i] === '}' && --depth === 0) return css.slice(start, i + 1);
  }
  return undefined;
}

const colors: Record<string, string> = {
  ink: '#141414',
  paper: '#FFFFFF',
  white: '#FFFFFF',
  yellow: '#F2B705',
  blue: '#1F4FD8',
  red: '#C8321C',
  green: '#0B7A4D',
  'grey-tint': '#EDEDE8',
  'red-tint': '#FBE3DE',
  'red-tint-2': '#F7DCD6',
  'blue-tint': '#DCE5FB',
  'blue-tint-2': '#C8D6FA',
  'green-tint': '#DDF1E6',
  'green-tint-2': '#BFE6D3',
  'yellow-tint': '#FCEFC2',
  muted: '#555555',
  'callout-red-text': '#A3281A',
};

describe('colors', () => {
  it.each(Object.entries(colors))('%s is %s', async (name, hex) => {
    const css = await build(`bg-${name}`);
    expect(css).toContain(`.bg-${name}`);
    expect(css.toLowerCase()).toContain(`--color-${name}: ${hex.toLowerCase()}`);
  });

  it.each(['bg-slate-500', 'text-gray-700', 'bg-black', 'bg-indigo-600'])(
    'drops the default palette (%s)',
    async (candidate) => {
      expect(await rule(candidate)).toBeUndefined();
    },
  );
});

describe('fonts', () => {
  it.each([
    ['display', 'Big Shoulders Display'],
    ['body', 'Libre Franklin'],
    ['mono', 'Fira Code'],
  ])('font-%s uses %s', async (name, family) => {
    const css = await build(`font-${name}`);
    expect(css).toContain(`.font-${name}`);
    expect(css).toMatch(new RegExp(`--font-${name}: ['"]${family}['"]`));
  });
});

describe('shapes', () => {
  it.each(['rounded-sm', 'rounded-md', 'rounded-lg', 'rounded-xl', 'rounded-2xl'])(
    'has no border radius (%s)',
    async (candidate) => {
      expect(await rule(candidate)).toBeUndefined();
    },
  );

  it('keeps rounded-full for the EN/NL pill', async () => {
    expect(await rule('rounded-full')).toMatch(/border-radius: calc\(infinity \* 1px\)/);
  });

  it.each(['shadow-sm', 'shadow-md', 'shadow-lg', 'drop-shadow-md', 'inset-shadow-sm'])(
    'has no shadows (%s)',
    async (candidate) => {
      expect(await rule(candidate)).toBeUndefined();
    },
  );

  it.each(['blur-md', 'backdrop-blur-md', 'backdrop-blur-sm'])(
    'has no blur (%s)',
    async (candidate) => {
      expect(await rule(candidate)).toBeUndefined();
    },
  );

  it('frame is a 3px solid ink border', async () => {
    expect(await rule('frame')).toMatch(/border: 3px solid var\(--color-ink\)/);
  });

  it('ticket-line is a 3px dashed top border in the current text color', async () => {
    expect(await rule('ticket-line')).toMatch(/border-top: 3px dashed currentcolor/i);
  });
});

describe('layout', () => {
  it('container-page is 1200px wide with 32px padding, 20px on phones', async () => {
    const css = await rule('container-page');
    expect(css).toMatch(/max-width: 1200px/);
    expect(css).toMatch(/padding-inline: 32px/);
    expect(css).toMatch(/@media[^{]*40rem[^{]*\{[^}]*padding-inline: 20px/);
  });
});

describe('type scale', () => {
  const display = /font-family: var\(--font-display\)/;

  it('type-hero: clamp on desktop, 84px on phones', async () => {
    const css = await rule('type-hero');
    expect(css).toMatch(display);
    expect(css).toMatch(/font-weight: 900/);
    expect(css).toMatch(/text-transform: uppercase/);
    expect(css).toMatch(/font-size: clamp\(64px, 11vw, 168px\)/);
    expect(css).toMatch(/line-height: 0\.86/);
    expect(css).toMatch(/@media[^{]*40rem[^{]*\{[^}]*font-size: 84px/);
  });

  it.each([
    ['type-h2', '64px', '48px'],
    ['type-poster', '52px', '44px'],
    ['type-stub', '34px', '30px'],
    ['type-cta', 'clamp(56px, 9vw, 128px)', '72px'],
  ])('%s is %s, %s on phones', async (candidate, desktop, phone) => {
    const css = await rule(candidate);
    expect(css).toMatch(display);
    expect(css).toMatch(/text-transform: uppercase/);
    expect(css).toContain(`font-size: ${desktop}`);
    expect(css).toMatch(new RegExp(`@media[^{]*40rem[^{]*\\{[^}]*font-size: ${phone}`));
  });

  it('type-label is 13px bold uppercase with 1px tracking', async () => {
    const css = await rule('type-label');
    expect(css).toMatch(/font-size: 13px/);
    expect(css).toMatch(/font-weight: 700/);
    expect(css).toMatch(/text-transform: uppercase/);
    expect(css).toMatch(/letter-spacing: 1px/);
  });

  it('type-intro is 20px at line-height 1.5', async () => {
    const css = await rule('type-intro');
    expect(css).toMatch(/font-size: 20px/);
    expect(css).toMatch(/line-height: 1\.5/);
  });
});

describe('motion', () => {
  it('poster-hover lifts and tilts on hover with a .2s transition', async () => {
    const css = await rule('poster-hover');
    expect(css).toMatch(/transition: transform 0?\.2s/);
    expect(css).toMatch(/&:hover[^{]*\{[^}]*transform: rotate\(-1deg\) translateY\(-4px\)/);
  });

  it('poster-hover stays still for prefers-reduced-motion', async () => {
    expect(await rule('poster-hover')).toMatch(/prefers-reduced-motion: reduce/);
  });
});
