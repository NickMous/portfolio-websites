import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import opentype from 'opentype.js';
import { expect, it } from 'vitest';
import { svgPathData } from './glyphs';

it('writes valid path data where opentype.js’s own toPathData() did not', () => {
  const require = createRequire(import.meta.url);
  const bytes = readFileSync(
    require.resolve('@fontsource/libre-franklin/files/libre-franklin-latin-700-normal.woff'),
  );
  const font = opentype.parse(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  );
  // This exact call produced "NaN" with toPathData(1).
  const d = svgPathData(font.getPath('sanderdh.com', 80, 590, 30));
  expect(d).toMatch(/^M[-\d. MLQCZ]+$/);
  expect(d).not.toContain('NaN');
});
