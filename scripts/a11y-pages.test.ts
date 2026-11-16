import { describe, expect, it } from 'vitest';
import { pool, samplePages } from './a11y-pages.ts';

describe('samplePages', () => {
  it('keeps only the first example file pages per repo and version', () => {
    const paths = [
      '/',
      '/kit/examples/1.0/',
      '/kit/examples/1.0/a/',
      '/kit/examples/1.0/b/',
      '/kit/examples/1.0/c/d/',
      '/kit/examples/2.0/a/',
      '/other/examples/1.0/x/',
      '/other/examples/1.0/y/',
    ];
    expect(samplePages(paths, 2)).toEqual([
      '/',
      '/kit/examples/1.0/',
      '/kit/examples/1.0/a/',
      '/kit/examples/1.0/b/',
      '/kit/examples/2.0/a/',
      '/other/examples/1.0/x/',
      '/other/examples/1.0/y/',
    ]);
  });

  it('keeps every page that is not an example file', () => {
    const paths = ['/kit/', '/kit/docs/1.0/', '/kit/docs/1.0/a/', '/kit/docs/1.0/b/'];
    expect(samplePages(paths, 1)).toEqual(paths);
  });
});

describe('pool', () => {
  it('returns results in input order and never runs more than the limit at once', async () => {
    let running = 0;
    let peak = 0;
    const result = await pool([30, 10, 20, 5, 15], 2, async (ms) => {
      running++;
      peak = Math.max(peak, running);
      await new Promise((r) => setTimeout(r, ms));
      running--;
      return ms * 2;
    });
    expect(result).toEqual([60, 20, 40, 10, 30]);
    expect(peak).toBe(2);
  });
});
