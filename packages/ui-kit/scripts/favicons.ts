/**
 * Writes favicon.svg, favicon.ico and apple-touch-icon.png into each site's
 * public/: one lowercase letter in Big Shoulders on a square in the site's
 * lead color. The files are committed; rerun after changing a color or letter:
 *
 *   npm run favicons -w @portfolio/ui-kit
 */
import { Resvg } from '@resvg/resvg-js';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';
import { encodeIco, FAVICON_BOX, faviconSvg } from '../src/favicon.ts';
import { sites, type SiteKey } from '../src/sites.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const theme = readFileSync(join(root, 'packages/ui-kit/src/styles/theme.css'), 'utf8');
const color = (name: string) => {
  const match = new RegExp(`--color-${name}:\\s*(#[0-9a-f]{6})`, 'i').exec(theme);
  if (!match?.[1]) throw new Error(`--color-${name} not found in theme.css`);
  return match[1];
};

// Same pairs as the posters: ink on yellow (white on yellow fails contrast), white otherwise.
const letters: Record<SiteKey, string> = {
  webenjoyer: 'w',
  nickmous: 'n',
  imlostincode: 'i',
  sanderdh: 's',
};
const ink = (site: SiteKey) => (sites[site].lead === 'yellow' ? color('ink') : color('white'));

const require = createRequire(import.meta.url);
const fontFile =
  require.resolve('@fontsource/big-shoulders-display/files/big-shoulders-display-latin-900-normal.woff');
const fontBytes = readFileSync(fontFile);
// A Buffer can be a view on a larger shared pool; hand over only its own bytes.
const font = opentype.parse(
  fontBytes.buffer.slice(fontBytes.byteOffset, fontBytes.byteOffset + fontBytes.byteLength),
);

/** The letter as a path, as large as fits and centred on its own outline. */
function letterPath(letter: string): string {
  const box = FAVICON_BOX;
  const probe = font.getPath(letter, 0, 0, 100).getBoundingBox();
  const scale = Math.min((box * 0.72) / (probe.y2 - probe.y1), (box * 0.8) / (probe.x2 - probe.x1));
  const size = 100 * scale;
  const x = (box - (probe.x2 - probe.x1) * scale) / 2 - probe.x1 * scale;
  const y = (box - (probe.y2 - probe.y1) * scale) / 2 - probe.y1 * scale;
  return font.getPath(letter, x, y, size).toPathData(2);
}

const png = (svg: string, size: number) =>
  new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();

for (const site of Object.keys(letters) as SiteKey[]) {
  const svg = faviconSvg({
    path: letterPath(letters[site]),
    background: color(sites[site].lead),
    color: ink(site),
  });
  const out = join(root, 'sites', site, 'public');
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, 'favicon.svg'), svg);
  writeFileSync(
    join(out, 'favicon.ico'),
    encodeIco([16, 32, 48].map((size) => ({ size, png: png(svg, size) }))),
  );
  writeFileSync(join(out, 'apple-touch-icon.png'), png(svg, 180));
  console.log(`${site}: ${letters[site]} on ${sites[site].lead}`);
}
