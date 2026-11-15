import { Resvg } from '@resvg/resvg-js';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import opentype from 'opentype.js';
import { siteUrl, sites, type SiteKey } from './sites';
import { svgPathData } from './glyphs';
import { locales } from './locale';
import { onColor, palette } from './palette';

export interface TitleBox {
  width: number;
  height: number;
  maxSize: number;
  minSize: number;
  maxLines: number;
  /** Line height as a multiple of the font size. */
  lineHeight: number;
}

type Measure = (text: string, size: number) => number;

function wrap(words: string[], width: number, size: number, measure: Measure): string[] {
  const lines: string[] = [];
  for (const word of words) {
    const last = lines.at(-1);
    if (last !== undefined && measure(`${last} ${word}`, size) <= width) {
      lines[lines.length - 1] = `${last} ${word}`;
    } else {
      lines.push(word);
    }
  }
  return lines;
}

/** The largest size (in steps of 4) at which the title fits the box, wrapped on spaces. */
export function fitTitle(
  text: string,
  box: TitleBox,
  measure: Measure,
): { size: number; lines: string[] } {
  const words = text.split(/\s+/).filter(Boolean);
  for (let size = box.maxSize; size > box.minSize; size -= 4) {
    const lines = wrap(words, box.width, size, measure);
    const fits =
      lines.length <= box.maxLines &&
      lines.length * size * box.lineHeight <= box.height &&
      lines.every((line) => measure(line, size) <= box.width);
    if (fits) return { size, lines };
  }
  return { size: box.minSize, lines: wrap(words, box.width, box.minSize, measure) };
}

const require = createRequire(import.meta.url);
const fonts = new Map<string, opentype.Font>();
function font(file: string): opentype.Font {
  let loaded = fonts.get(file);
  if (!loaded) {
    const bytes = readFileSync(require.resolve(file));
    // A Buffer can be a view on a larger shared pool; hand over only its own bytes.
    loaded = opentype.parse(
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    );
    fonts.set(file, loaded);
  }
  return loaded;
}
const display = () =>
  font('@fontsource/big-shoulders-display/files/big-shoulders-display-latin-900-normal.woff');
const body = () => font('@fontsource/libre-franklin/files/libre-franklin-latin-700-normal.woff');

const W = 1200;
const H = 630;
const PAD = 80;
const STRIP = 84;

/**
 * A poster-style social preview: the site's lead color, a big uppercase
 * title, an optional label above it and the domain in an ink strip.
 */
export function renderOgImage({
  site,
  title,
  kicker,
  locale = 'en',
}: {
  site: SiteKey;
  title: string;
  kicker?: string;
  locale?: (typeof locales)[number];
}): Buffer {
  const lead = sites[site].lead;
  const background = palette[lead];
  const ink = onColor(lead);
  const big = display();
  const small = body();

  const parts: string[] = [];
  let top = PAD;
  if (kicker) {
    parts.push(svgPathData(small.getPath(kicker.toUpperCase(), PAD, top + 26, 32)));
    top += 26 + 40;
  }

  const box: TitleBox = {
    width: W - 2 * PAD,
    height: H - STRIP - PAD / 2 - top,
    maxSize: 240,
    minSize: 72,
    maxLines: 3,
    lineHeight: 0.92,
  };
  const { size, lines } = fitTitle(title.toUpperCase(), box, (text, s) =>
    big.getAdvanceWidth(text, s),
  );
  const capHeight = (big.tables['os2']?.sCapHeight ?? big.unitsPerEm * 0.7) / big.unitsPerEm;
  lines.forEach((line, i) => {
    const baseline = top + capHeight * size + i * size * box.lineHeight;
    parts.push(svgPathData(big.getPath(line, PAD, baseline, size)));
  });

  const domain = new URL(siteUrl(site, locale)).host;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
    `<rect width="${W}" height="${H}" fill="${background}"/>` +
    `<path d="${parts.join(' ')}" fill="${ink}"/>` +
    `<rect y="${H - STRIP}" width="${W}" height="${STRIP}" fill="${palette.ink}"/>` +
    `<path d="${svgPathData(small.getPath(domain, PAD, H - STRIP / 2 + 11, 30))}" fill="${palette.white}"/>` +
    `<rect x="6" y="6" width="${W - 12}" height="${H - 12}" fill="none" stroke="${palette.ink}" stroke-width="12"/>` +
    `</svg>`;
  return new Resvg(svg).render().asPng();
}
