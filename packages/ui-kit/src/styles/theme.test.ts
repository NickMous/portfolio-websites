import { compile } from '@tailwindcss/node';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// Guards the design rules the theme enforces by removing Tailwind defaults.
// Token values themselves are not tested: they are data, not behavior.

const base = path.dirname(new URL(import.meta.url).pathname);

async function build(candidates: string[]): Promise<string> {
  const compiler = await compile('@import "tailwindcss";\n@import "./theme.css";', {
    base,
    onDependency: () => {},
  });
  return compiler.build(candidates);
}

/** Classes from the list that Tailwind actually generated. */
async function generated(candidates: string[]): Promise<string[]> {
  const css = await build(candidates);
  return candidates.filter((c) => css.includes(`.${c} {`));
}

describe('theme', () => {
  it('only offers design-system colors', async () => {
    expect(await generated(['bg-slate-500', 'text-gray-700', 'bg-black'])).toEqual([]);
  });

  it('has no border radius, shadows or blur', async () => {
    const forbidden = [
      'rounded-md',
      'rounded-lg',
      'shadow-md',
      'drop-shadow-md',
      'backdrop-blur-md',
    ];
    expect(await generated(forbidden)).toEqual([]);
  });

  it('keeps poster-hover still for prefers-reduced-motion', async () => {
    expect(await build(['poster-hover'])).toMatch(/prefers-reduced-motion: reduce/);
  });
});
