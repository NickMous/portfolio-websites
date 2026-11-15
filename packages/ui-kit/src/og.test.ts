import { describe, expect, it } from 'vitest';
import { fitTitle, renderOgImage } from './og';

// Every character 0.5em wide: easy to reason about.
const measure = (text: string, size: number) => text.length * size * 0.5;

describe('fitTitle', () => {
  const box = { width: 1000, height: 400, maxSize: 200, minSize: 60, maxLines: 3, lineHeight: 1 };

  it('uses the largest size at which the title fits', () => {
    // 10 chars at 200 → 1000 wide: fits on one line at the maximum size.
    expect(fitTitle('ABCDEFGHIJ', box, measure)).toEqual({ size: 200, lines: ['ABCDEFGHIJ'] });
  });

  it('wraps on spaces before shrinking', () => {
    const fit = fitTitle('CLUB VAN OOIT WOERDEN', box, measure);
    expect(fit.lines.length).toBeGreaterThan(1);
    expect(fit.lines.join(' ')).toBe('CLUB VAN OOIT WOERDEN');
    for (const line of fit.lines) expect(measure(line, fit.size)).toBeLessThanOrEqual(1000);
    expect(fit.lines.length * fit.size).toBeLessThanOrEqual(400);
  });

  it('stops at the minimum size, so a very long title is never unreadable', () => {
    expect(fitTitle('X'.repeat(200), box, measure).size).toBe(60);
  });
});

describe('renderOgImage', () => {
  it('renders a 1200×630 PNG', () => {
    const png = renderOgImage({ site: 'nickmous', title: 'nickmous', kicker: 'nickmous.com' });
    expect(png.subarray(1, 4).toString()).toBe('PNG');
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630]);
  });
});
