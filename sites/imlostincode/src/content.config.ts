import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { docsLoader, fixesLoader } from './docs/loader';

const version = z.object({ id: z.string(), ref: z.string(), unreleased: z.boolean() });

/** Docs repos from GitHub (topic imlostincode-docs, public only). */
const fixes = defineCollection({
  loader: fixesLoader(),
  schema: z.object({
    name: z.string(),
    url: z.url(),
    kind: z.string(),
    color: z.enum(['yellow', 'white', 'blue', 'green']),
    status: z.enum(['available', 'in-testing']),
    oneLiner: z.object({ en: z.string(), nl: z.string() }),
    versions: z.array(version),
    defaultVersion: z.string(),
  }),
});

/** Rendered README, docs/*.md and examples/ files, per repo and version. */
const docs = defineCollection({
  loader: docsLoader(),
  schema: z.object({
    repo: z.string(),
    version: z.string(),
    section: z.enum(['overview', 'doc', 'example']),
    slug: z.string(),
    title: z.string(),
    order: z.number(),
    path: z.string(),
    ref: z.string(),
    html: z.string(),
  }),
});

export const collections = { fixes, docs };
