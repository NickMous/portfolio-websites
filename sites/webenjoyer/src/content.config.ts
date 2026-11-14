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
      screenshots: z.array(image()).default([]),
    }),
});

export const collections = { projects };
