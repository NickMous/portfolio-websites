/**
 * Accessibility audit of the built sites (run `npm run build` first):
 *
 *   npm run a11y                      # every site, both locales
 *   npm run a11y -- nickmous          # one site
 *
 * For each page, at phone and desktop width:
 * - axe-core: WCAG 2.2 A/AA plus best practices
 * - touch targets under 44×44 px (links inside running text are exempt)
 * - keyboard: Tab through the page; every stop needs a visible focus
 *   indicator with at least 3:1 contrast against what is behind it
 *
 * Exits non-zero when anything fails, so CI can gate on it.
 */
import AxeBuilder from '@axe-core/playwright';
import { createReadStream, existsSync, readdirSync, statSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { extname, join } from 'node:path';
import { chromium, type Page } from 'playwright';

const SITES = ['sanderdh', 'webenjoyer', 'imlostincode', 'nickmous'];
const LOCALES = ['en', 'nl'];
const WIDTHS = [390, 1280];
const MIN_TARGET = 44;
const MIN_FOCUS_CONTRAST = 3;

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
};

function serve(dir: string): Promise<{ server: Server; port: number }> {
  const server = createServer((req, res) => {
    let path = join(dir, decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname));
    if (existsSync(path) && statSync(path).isDirectory()) path = join(path, 'index.html');
    if (!existsSync(path)) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { 'Content-Type': TYPES[extname(path)] ?? 'application/octet-stream' });
    createReadStream(path).pipe(res);
  });
  return new Promise((resolve) =>
    server.listen(0, () => {
      const address = server.address();
      resolve({ server, port: typeof address === 'object' && address ? address.port : 0 });
    }),
  );
}

/** URL paths of every page in a built site, skipping the docs redirects. */
function pages(dir: string, base = '/'): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (!name.startsWith('_') && name !== 'og') out.push(...pages(full, `${base}${name}/`));
    } else if (name === 'index.html') {
      out.push(base);
    }
  }
  return out;
}

interface Problem {
  rule: string;
  detail: string;
}

/** Runs in the page. */
function smallTargets(min: number): Problem[] {
  const selector =
    'a[href], button, select, input:not([type=hidden]), textarea, summary, [tabindex]:not([tabindex="-1"])';
  const problems: Problem[] = [];
  for (const el of document.querySelectorAll<HTMLElement>(selector)) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0 || el.closest('[aria-hidden="true"], [hidden]')) continue;
    // Visually hidden until focused (the skip link); its focused state is checked by Tab.
    if (r.width <= 1 && r.height <= 1) continue;
    // A link in a sentence is exempt (WCAG 2.5.8 "inline" exception).
    const style = getComputedStyle(el);
    const inSentence = [...(el.parentElement?.childNodes ?? [])].some(
      (n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? '').trim() !== '',
    );
    if (style.display === 'inline' && inSentence) continue;
    // Hit areas widened with a pseudo-element count (the EN/NL switch uses after:-inset-y).
    let { width, height } = r;
    for (const pseudo of ['::before', '::after'] as const) {
      const p = getComputedStyle(el, pseudo);
      if (p.content === 'none' || p.position !== 'absolute') continue;
      const grow = (a: string, b: string) =>
        Math.max(0, -parseFloat(a) || 0) + Math.max(0, -parseFloat(b) || 0);
      width = Math.max(width, r.width + grow(p.left, p.right));
      height = Math.max(height, r.height + grow(p.top, p.bottom));
    }
    if (width < min || height < min) {
      const label = (el.getAttribute('aria-label') || el.textContent || '')
        .trim()
        .replace(/\s+/g, ' ');
      problems.push({
        rule: 'target-size-44',
        detail: `${el.tagName.toLowerCase()} "${label.slice(0, 40)}" is ${Math.round(width)}×${Math.round(height)}`,
      });
    }
  }
  return problems;
}

/** Runs in the page: the focused element's indicator against its surroundings. */
function focusIndicator(): { label: string; contrast: number; visible: boolean } | null {
  const el = document.activeElement as HTMLElement | null;
  if (!el || el === document.body) return null;
  const rgb = (c: string) => (c.match(/[\d.]+/g) ?? []).map(Number);
  const lum = (c: string) => {
    const [r = 0, g = 0, b = 0] = rgb(c).map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const ratio = (a: string, b: string) => {
    const [x, y] = [lum(a), lum(b)];
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  };
  const opaque = (c: string) => c !== 'transparent' && rgb(c)[3] !== 0;
  let behind = 'rgb(255, 255, 255)';
  for (let n = el.parentElement; n; n = n.parentElement) {
    const bg = getComputedStyle(n).backgroundColor;
    if (opaque(bg)) {
      behind = bg;
      break;
    }
  }
  const s = getComputedStyle(el);
  const colors: string[] = [];
  if (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2) colors.push(s.outlineColor);
  // A solid ring drawn with box-shadow (no blur) also counts.
  for (const m of s.boxShadow.matchAll(/(rgba?\([^)]*\))\s+0px\s+0px\s+0px\s+(\d+(?:\.\d+)?)px/g)) {
    if (parseFloat(m[2] ?? '0') >= 2 && m[1]) colors.push(m[1]);
  }
  const label = `${el.tagName.toLowerCase()} "${(el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40)}"`;
  const contrast = Math.max(0, ...colors.map((c) => ratio(c, behind)));
  return { label, contrast: Math.round(contrast * 100) / 100, visible: colors.length > 0 };
}

async function keyboardProblems(page: Page): Promise<Problem[]> {
  const problems: Problem[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < 120; i++) {
    await page.keyboard.press('Tab');
    const f = await page.evaluate(focusIndicator);
    if (!f) break;
    if (seen.has(f.label)) {
      if (i > 0 && [...seen][0] === f.label) break; // wrapped around
      continue;
    }
    seen.add(f.label);
    if (!f.visible)
      problems.push({ rule: 'focus-visible', detail: `${f.label}: no focus indicator` });
    else if (f.contrast < MIN_FOCUS_CONTRAST)
      problems.push({ rule: 'focus-contrast', detail: `${f.label}: indicator ${f.contrast}:1` });
  }
  return problems;
}

async function main() {
  const root = new URL('..', import.meta.url).pathname;
  const sites = process.argv.slice(2).length ? process.argv.slice(2) : SITES;
  const browser = await chromium.launch();
  const results = new Map<string, Set<string>>(); // "site rule detail" -> where
  let pageCount = 0;

  for (const site of sites) {
    for (const locale of LOCALES) {
      const dir = join(root, 'sites', site, 'dist', locale);
      if (!existsSync(dir)) throw new Error(`${dir} missing: run npm run build first`);
      const { server, port } = await serve(dir);
      try {
        for (const path of pages(dir)) {
          for (const width of WIDTHS) {
            const context = await browser.newContext({ viewport: { width, height: 900 } });
            const page = await context.newPage();
            // The API is not part of this audit; fail fast instead of waiting.
            await page.route(/api\.nickmous\.com/, (route) => route.abort());
            await page.goto(`http://localhost:${port}${path}`, { waitUntil: 'load' });
            if (await page.locator('meta[http-equiv="refresh"]').count()) {
              await context.close();
              continue;
            }
            pageCount++;
            const axe = await new AxeBuilder({ page })
              .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
              .analyze();
            const problems: Problem[] = [
              ...axe.violations.flatMap((v) =>
                v.nodes.map((n) => ({
                  rule: `axe:${v.id}`,
                  detail: `${n.target.join(' ')}: ${v.help}`,
                })),
              ),
              ...(await page.evaluate(smallTargets, MIN_TARGET)),
              ...(await keyboardProblems(page)),
            ];
            for (const p of problems) {
              const key = `${site}  ${p.rule}  ${p.detail}`;
              if (!results.has(key)) results.set(key, new Set());
              results.get(key)!.add(`${locale}${path}@${width}`);
            }
            await context.close();
          }
        }
      } finally {
        server.close();
      }
    }
  }
  await browser.close();

  console.log(`Audited ${pageCount} page views.`);
  for (const [key, where] of [...results].sort()) {
    const list = [...where];
    console.log(
      `✗ ${key}\n    ${list.slice(0, 4).join(', ')}${list.length > 4 ? ` +${list.length - 4} more` : ''}`,
    );
  }
  console.log(results.size ? `${results.size} problem(s).` : 'No problems found.');
  process.exitCode = results.size ? 1 : 0;
}

await main();
