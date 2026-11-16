import { beforeAll, describe, expect, it } from 'vitest';
import { docFile, docTitle, renderCodeFile, renderMarkdown, type RenderContext } from './content';

const ctx = (filePath: string): RenderContext => ({
  repo: 'netstation',
  ref: 'v0.2.1',
  filePath,
  urls: {
    overview: () => '/netstation/0.2/',
    doc: (slug) => `/netstation/docs/0.2/${slug}`,
    example: (path) => `/netstation/examples/0.2/${path}`,
  },
});

// The first render starts Shiki, which takes seconds on a cold CI runner.
beforeAll(() => renderMarkdown('```js\n1\n```', ctx('README.md')), 30_000);

const hrefs = (html: string) => [...html.matchAll(/href="([^"]*)"/g)].map((m) => m[1]);
const srcs = (html: string) => [...html.matchAll(/src="([^"]*)"/g)].map((m) => m[1]);

describe('docFile', () => {
  it('takes order and slug from a numbered filename', () => {
    expect(docFile('02-getting-started.md')).toEqual({ order: 2, slug: 'getting-started' });
  });

  it('puts unnumbered files after the numbered ones', () => {
    expect(docFile('faq.md')).toEqual({ order: Number.MAX_SAFE_INTEGER, slug: 'faq' });
  });
});

describe('docTitle', () => {
  it('uses the first level-1 heading', () => {
    expect(
      docTitle('Intro text\n\n## Not this\n\n# Installing netstation\n', '02-installation.md'),
    ).toBe('Installing netstation');
  });

  it('falls back to the filename', () => {
    expect(docTitle('No heading here.', '03-first-boot.md')).toBe('First boot');
  });
});

describe('renderMarkdown links', () => {
  it('points repo-relative links at site pages or GitHub at the same ref', async () => {
    const html = await renderMarkdown(
      [
        '[install](./02-installation.md#requirements)',
        '[readme](../README.md)',
        '[example](../examples/inventory/hosts.yml)',
        '[source](../roles/boot/tasks/main.yml)',
        '[external](https://example.com/x.md)',
        '[anchor](#top)',
      ].join('\n\n'),
      ctx('docs/01-introduction.md'),
    );

    expect(hrefs(html)).toEqual([
      '/netstation/docs/0.2/installation#requirements',
      '/netstation/0.2/',
      '/netstation/examples/0.2/inventory/hosts.yml',
      'https://github.com/NickMous/netstation/blob/v0.2.1/roles/boot/tasks/main.yml',
      'https://example.com/x.md',
      '#top',
    ]);
  });

  it('loads relative images, markdown or HTML, from raw GitHub at the same ref', async () => {
    const html = await renderMarkdown(
      '![diagram](docs/img/boot.png)\n\n<img src="./logo.svg" alt="logo">\n\n![remote](https://example.com/a.png)',
      ctx('README.md'),
    );

    expect(srcs(html)).toEqual([
      'https://raw.githubusercontent.com/NickMous/netstation/v0.2.1/docs/img/boot.png',
      'https://raw.githubusercontent.com/NickMous/netstation/v0.2.1/logo.svg',
      'https://example.com/a.png',
    ]);
  });
});

describe('renderMarkdown alerts', () => {
  it('turns GitHub alert syntax into a labelled callout', async () => {
    const html = await renderMarkdown('> [!WARNING]\n> PXE needs its own VLAN.', ctx('README.md'));

    expect(html).toContain('class="callout"');
    expect(html).toContain('Gotcha');
    expect(html).toContain('PXE needs its own VLAN.');
    expect(html).not.toContain('[!WARNING]');
    expect(html).not.toContain('<blockquote');
  });

  it('leaves ordinary quotes alone', async () => {
    const html = await renderMarkdown('> Just a quote.', ctx('README.md'));

    expect(html).toContain('<blockquote>');
    expect(html).not.toContain('callout');
  });
});

describe('renderMarkdown code', () => {
  it('highlights fenced code in a frame with its language and a copy button', async () => {
    const html = await renderMarkdown('```bash\nansible-playbook site.yml\n```', ctx('README.md'));

    expect(html).toMatch(/class="code-block"[\s\S]*>bash<[\s\S]*data-copy[\s\S]*class="shiki/);
  });
});

describe('renderCodeFile', () => {
  it('shows a file verbatim, even when it contains a code fence itself', async () => {
    const html = await renderCodeFile(
      '# Notes\n```\nnot markdown\n```\n',
      'examples/notes.txt',
      ctx('examples/notes.txt'),
    );

    expect(html).toContain('class="code-block"');
    expect(html).toContain('```');
    expect(html).not.toContain('<h1');
  });

  it('labels the code with a language from the file extension', async () => {
    const html = await renderCodeFile(
      'all:\n  hosts: {}\n',
      'examples/inventory/hosts.yml',
      ctx('examples/inventory/hosts.yml'),
    );

    expect(html).toContain('<span>yml</span>');
  });
});

describe('renderMarkdown headings', () => {
  it('moves headings down a level under the page title, with GitHub-style ids', async () => {
    const html = await renderMarkdown('# Getting started\n\n## Step 1: install', ctx('README.md'));

    expect(html).toContain('<h2 id="getting-started">Getting started</h2>');
    expect(html).toContain('<h3 id="step-1-install">Step 1: install</h3>');
    expect(html).not.toContain('<h1');
  });

  it('starts at h2 and never skips a level, whatever the README uses', async () => {
    const html = await renderMarkdown('### Intro\n\n##### Detail\n\n### Next', ctx('README.md'));

    expect(html).toContain('<h2 id="intro">Intro</h2>');
    expect(html).toContain('<h3 id="detail">Detail</h3>');
    expect(html).toContain('<h2 id="next">Next</h2>');
  });
});

describe('renderMarkdown heading start', () => {
  it('can start lower, for notes under a heading of their own', async () => {
    const html = await renderMarkdown("## What's Changed\n\n### Fixes", ctx('README.md'), {
      topLevel: 3,
    });

    expect(html).toContain('<h3 id="whats-changed">');
    expect(html).toContain('<h4 id="fixes">');
  });
});

describe('renderMarkdown tables', () => {
  it('makes tables focusable, so keyboard users can scroll wide ones', async () => {
    const html = await renderMarkdown('| a | b |\n| - | - |\n| 1 | 2 |', ctx('README.md'));

    expect(html).toContain('<table tabindex="0">');
  });
});
