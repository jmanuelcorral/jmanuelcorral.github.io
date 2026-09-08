// Content collection schema — bootstrapped against the Design Review Contract
// because no schema file existed yet. Rusty owns content schema long-term;
// this codifies exactly the agreed frontmatter fields so Basher's
// layouts/components/pages have something concrete to query. Please review
// and adjust as the real migration data lands.
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'zod';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z
    .object({
      title: z.string(),
      description: z.string(),
      lang: z.enum(['es', 'en']),
      // Shared key pairing a post with its translation(s) across locales.
      translationKey: z.string(),
      // Localized slug — may differ from the filename and from the slug used
      // in the other language's version of the same post.
      slug: z.string(),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      tags: z.array(z.string()).default([]),
      draft: z.boolean().default(false),
      // Optional pointer back to the legacy Jekyll URL for redirects/reference.
      // Only the Spanish source post carries this — the original Jekyll site
      // had no English posts, so an English entry can never be the legacy
      // canonical target.
      legacyPath: z.string().optional(),
    })
    .refine((entry) => entry.lang === 'es' || entry.legacyPath === undefined, {
      message: 'legacyPath is only valid on Spanish ("es") entries',
      path: ['legacyPath'],
    }),
});

export const collections = { blog };
