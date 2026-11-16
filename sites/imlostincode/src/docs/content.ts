import rehypeShiki from '@shikijs/rehype';
import type { Element, ElementContent, Root as HastRoot } from 'hast';
import type { Blockquote, Paragraph, Root as MdastRoot } from 'mdast';
import path from 'node:path';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';
import { OWNER } from './owner';

// --- Files --------------------------------------------------------------

/**
 * "02-getting-started.md" → order 2, slug "getting-started". Unnumbered files go
 * last (a finite number, since the collection schema rejects Infinity).
 */
export function docFile(filename: string): { order: number; slug: string } {
  const base = filename.replace(/\.md$/i, '');
  const match = /^(\d+)[-_](.+)$/.exec(base);
  return match
    ? { order: Number(match[1]), slug: match[2]! }
    : { order: Number.MAX_SAFE_INTEGER, slug: base };
}

/** Sidebar title: the first "# " heading outside code blocks, else from the filename. */
export function docTitle(markdown: string, filename: string): string {
  const prose = markdown.replace(/^(```|~~~)[\s\S]*?^\1/gm, '');
  const heading = /^# +(.+?)\s*#*\s*$/m.exec(prose)?.[1];
  if (heading) return heading;
  const words = docFile(filename).slug.replace(/[-_]+/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

// --- Rendering ----------------------------------------------------------

export interface RenderContext {
  repo: string;
  /** Git ref the file was read from. */
  ref: string;
  /** Path of the markdown file in the repo, e.g. "docs/01-introduction.md". */
  filePath: string;
  /** Site URLs for the version being rendered. */
  urls: {
    overview: () => string;
    doc: (slug: string) => string;
    example: (path: string) => string;
  };
}

const ALERT_LABELS: Record<string, string> = {
  NOTE: 'Note',
  TIP: 'Tip',
  IMPORTANT: 'Important',
  WARNING: 'Gotcha',
  CAUTION: 'Careful',
};

/** GitHub alerts (`> [!WARNING]`) become `<div class="callout">` with a label. */
function remarkAlerts() {
  return (tree: MdastRoot) => {
    visit(tree, 'blockquote', (node: Blockquote) => {
      const first = node.children[0];
      if (first?.type !== 'paragraph') return;
      const text = first.children[0];
      if (text?.type !== 'text') return;
      const match = /^\[!(\w+)\]\s*/.exec(text.value);
      const label = match && ALERT_LABELS[match[1]!.toUpperCase()];
      if (!match || !label) return;

      text.value = text.value.slice(match[0].length);
      if (!text.value) first.children.shift();
      if (first.children.length === 0) node.children.shift();

      const labelNode: Paragraph = {
        type: 'paragraph',
        children: [{ type: 'text', value: label }],
        data: { hProperties: { className: ['callout-label'] } },
      };
      node.children.unshift(labelNode);
      node.data = {
        hName: 'div',
        hProperties: { className: ['callout'], dataCallout: match[1]!.toLowerCase() },
      };
    });
  };
}

const EXTERNAL = /^([a-z][a-z\d+.-]*:|\/\/)/i;

/** Where a repo-relative path should point on the site, or on GitHub. */
function rewrite(target: string, kind: 'link' | 'image', ctx: RenderContext): string {
  if (!target || target.startsWith('#') || EXTERNAL.test(target)) return target;

  const [, rawPath = '', suffix = ''] = /^([^?#]*)(.*)$/.exec(target) ?? [];
  const resolved = rawPath.startsWith('/')
    ? path.posix.normalize(rawPath.slice(1))
    : path.posix.normalize(path.posix.join(path.posix.dirname(ctx.filePath), rawPath));
  const file = resolved.replace(/^(\.\/)+/, '').replace(/\/$/, '');

  if (kind === 'image') {
    return `https://raw.githubusercontent.com/${OWNER}/${ctx.repo}/${ctx.ref}/${file}${suffix}`;
  }
  if (/^readme\.md$/i.test(file)) return ctx.urls.overview() + suffix;
  const doc = /^docs\/([^/]+\.md)$/i.exec(file);
  if (doc) return ctx.urls.doc(docFile(doc[1]!).slug) + suffix;
  if (file === 'examples' || file.startsWith('examples/')) {
    return ctx.urls.example(file.replace(/^examples\/?/, '')) + suffix;
  }
  return `https://github.com/${OWNER}/${ctx.repo}/blob/${ctx.ref}/${file}${suffix}`;
}

/** Rewrites links and images, from markdown and raw HTML alike. */
function rehypeRepoUrls(ctx: RenderContext) {
  return (tree: HastRoot) => {
    visit(tree, 'element', (node: Element) => {
      const { href, src } = node.properties;
      if (node.tagName === 'a' && typeof href === 'string') {
        node.properties.href = rewrite(href, 'link', ctx);
      }
      if (node.tagName === 'img' && typeof src === 'string') {
        node.properties.src = rewrite(src, 'image', ctx);
      }
    });
  };
}

/**
 * The page title is the h1, so the document's top heading level becomes h2
 * (or `topLevel`), and no heading sits more than one level below the one before it.
 */
function rehypeHeadingLevels(topLevel = 2) {
  return (tree: HastRoot) => {
    const headings: Element[] = [];
    visit(tree, 'element', (node: Element) => {
      if (/^h[1-6]$/.test(node.tagName)) headings.push(node);
    });
    const top = Math.min(...headings.map((h) => Number(h.tagName[1])));
    let previous = topLevel - 1;
    for (const heading of headings) {
      const level = Math.min(Number(heading.tagName[1]) - top + topLevel, previous + 1, 6);
      heading.tagName = `h${level}`;
      previous = level;
    }
  };
}

/** Wide tables scroll sideways; focusable so that works from the keyboard too. */
function rehypeFocusableTables() {
  return (tree: HastRoot) => {
    visit(tree, 'element', (node: Element) => {
      if (node.tagName === 'table') node.properties.tabIndex = 0;
    });
  };
}

/** Wraps fenced code in a frame with its language and a copy button. */
function rehypeCodeFrame() {
  return (tree: HastRoot) => {
    visit(tree, 'element', (node: Element, index, parent) => {
      if (node.tagName !== 'pre' || !parent || index === undefined) return;
      const code = node.children.find(
        (c): c is Element => c.type === 'element' && c.tagName === 'code',
      );
      const classes = (code?.properties.className as string[] | undefined) ?? [];
      const language = classes.find((c) => c.startsWith('language-'))?.slice(9) ?? 'text';

      const head: ElementContent = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['code-head'] },
        children: [
          {
            type: 'element',
            tagName: 'span',
            properties: {},
            children: [{ type: 'text', value: language }],
          },
          {
            type: 'element',
            tagName: 'button',
            // Shown by the page script; without JS there is nothing to copy with.
            properties: { type: 'button', dataCopy: true, hidden: true },
            children: [{ type: 'text', value: 'Copy' }],
          },
        ],
      };
      parent.children[index] = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['code-block'] },
        children: [head, node],
      };
      return 'skip';
    });
  };
}

/**
 * Markdown from a docs repo → HTML for the site. Headings start at h2, or at
 * `topLevel` when the markdown sits under a heading of the page (release notes).
 */
export async function renderMarkdown(
  markdown: string,
  ctx: RenderContext,
  { topLevel = 2 }: { topLevel?: number } = {},
): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkAlerts)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeRepoUrls, ctx)
    .use(rehypeSlug)
    .use(rehypeHeadingLevels, topLevel)
    .use(rehypeFocusableTables)
    .use(rehypeCodeFrame)
    .use(rehypeShiki, {
      theme: 'github-light',
      lazy: true,
      defaultLanguage: 'text',
      fallbackLanguage: 'text',
    })
    .use(rehypeStringify)
    .process(markdown);
  return String(file);
}

/** A non-markdown file (e.g. from examples/) as a highlighted code block. */
export async function renderCodeFile(
  content: string,
  filePath: string,
  ctx: RenderContext,
): Promise<string> {
  const ext = /\.([a-z\d]+)$/i.exec(filePath)?.[1]?.toLowerCase() ?? 'text';
  // A fence longer than any backtick run in the file keeps the file verbatim.
  const longest = Math.max(2, ...[...content.matchAll(/`+/g)].map((m) => m[0].length));
  const fence = '`'.repeat(longest + 1);
  return renderMarkdown(`${fence}${ext}\n${content.replace(/\n$/, '')}\n${fence}`, ctx);
}
