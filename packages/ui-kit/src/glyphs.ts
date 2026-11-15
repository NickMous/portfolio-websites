import type opentype from 'opentype.js';

const n = (v: number) => String(Math.round(v * 100) / 100);

/**
 * SVG path data for an opentype.js path. Its own toPathData() is not used:
 * in opentype.js 2.0 it sometimes writes "NaN" or runs two numbers together,
 * and resvg then drops the rest of the path.
 */
export function svgPathData(path: opentype.Path): string {
  return path.commands
    .map((c) => {
      switch (c.type) {
        case 'M':
        case 'L':
          return `${c.type}${n(c.x)} ${n(c.y)}`;
        case 'Q':
          return `Q${n(c.x1)} ${n(c.y1)} ${n(c.x)} ${n(c.y)}`;
        case 'C':
          return `C${n(c.x1)} ${n(c.y1)} ${n(c.x2)} ${n(c.y2)} ${n(c.x)} ${n(c.y)}`;
        default:
          return 'Z';
      }
    })
    .join('');
}
