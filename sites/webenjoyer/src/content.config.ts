import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/** Short text in both languages. Use "[PLACEHOLDER]" until the real copy exists. */
const localized = z.object({ en: z.string(), nl: z.string() });

const projects = defineCollection({
  // One YAML file per project; the filename is the slug.
  loader: glob({ pattern: '*.yaml', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      /** Poster title with deliberate "\n" line breaks; defaults to the title. */
      posterTitle: z.string().optional(),
      kind: z.enum(['client', 'school', 'personal']),
      status: z.enum(['live', 'in-progress', 'in-testing', 'archived']),
      /** Featured client work becomes a big poster in "Now showing". */
      featured: z.boolean().default(false),
      /** Position within its homepage section, lowest first. */
      order: z.number().default(0),
      /** School project made with a group (stub label "Group" instead of "School"). */
      group: z.boolean().default(false),
      year: z.number().optional(),
      url: z.url().optional(),
      repo: z.url().optional(),
      stack: z.array(z.string()).default([]),
      /** Short fact on the poster's ticket strip, e.g. "Event site · Astro". */
      tagline: localized.optional(),
      oneLiner: localized,
      posterColor: z.enum(['yellow', 'white', 'red', 'blue', 'green']),
      /** Desktop screenshots: the first is the big one on the project page, the second a detail. */
      screenshots: z.array(image()).default([]),
      /** Shown in the rounded phone frame on the project page. */
      phoneScreenshot: image().optional(),

      // Project page (client work). Placeholders stay visible until the real copy exists.
      /** Ticket strip "Type", e.g. "Event site". */
      type: localized.optional(),
      /** One sentence under the title: what the site is for. */
      intro: localized.optional(),
      whatItIs: localized.optional(),
      whatIBuilt: z.array(localized).default([]),
      /** Optional red block; left out of the page when empty. */
      behindTheScenes: localized.optional(),
    }),
});

export const collections = { projects };
