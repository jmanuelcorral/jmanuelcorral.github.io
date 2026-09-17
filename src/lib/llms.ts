// Shared data-fetching for the llms.txt / llms-full.txt platform routes
// (Rusty-owned). Kept separate from `src/lib/content.ts` (Basher-facing
// query helpers already consumed by components) to avoid touching a file
// other agents' components depend on.
import { getCollection, type CollectionEntry } from 'astro:content';
import { isPublished } from './content';
import type { Locale } from './i18n';

export type BlogPost = CollectionEntry<'blog'>;

/**
 * Published (non-draft) posts for one locale, in a fully deterministic
 * order: newest first, ties broken by translationKey so re-running the
 * build never reshuffles output. Gated on the shared `isPublished`
 * predicate — llms.txt is a published surface, so drafts never appear
 * here regardless of environment.
 */
export async function getPublishedPostsByLocale(locale: Locale): Promise<BlogPost[]> {
  const posts = await getCollection(
    'blog',
    (entry) => entry.data.lang === locale && isPublished(entry),
  );

  return posts.sort((a, b) => {
    const byDate = b.data.pubDate.valueOf() - a.data.pubDate.valueOf();
    if (byDate !== 0) return byDate;
    return a.data.translationKey.localeCompare(b.data.translationKey);
  });
}
