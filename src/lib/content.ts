// Query helpers over the `blog` content collection. Kept separate from
// components so layout/markup changes never need to touch query logic, and
// vice versa — this is the "query logic" side of the seam described in
// tokens.css for visuals.
import { getCollection, type CollectionEntry } from 'astro:content';
import type { Locale } from './i18n';

export type BlogPost = CollectionEntry<'blog'>;

/**
 * The single definition of "published": a post that is not a draft. Every
 * published surface (RSS, llms.txt, and anything that feeds the sitemap)
 * must gate on this so a draft can never leak through one route while a
 * different route hides it.
 */
export function isPublished(entry: BlogPost): boolean {
  return !entry.data.draft;
}

/**
 * Whether the current build should render a post at all. Production builds
 * render published posts only; `astro dev` also renders drafts so an
 * unfinished post can be reviewed locally before it is published.
 */
export function isRenderable(entry: BlogPost): boolean {
  return import.meta.env.PROD ? isPublished(entry) : true;
}

/** All published posts for a locale, newest first. */
export async function getPostsByLocale(locale: Locale): Promise<BlogPost[]> {
  const posts = await getCollection(
    'blog',
    (entry) => entry.data.lang === locale && isRenderable(entry),
  );
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

/** Every published post across all locales. */
export async function getAllPosts(): Promise<BlogPost[]> {
  const posts = await getCollection('blog', (entry) => isRenderable(entry));
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

/**
 * Find the equivalent post in another locale by translationKey. Returns
 * undefined when no translation exists yet — callers must handle that
 * missing-translation case explicitly (see SiteNav.astro's lang link).
 */
export function findTranslation(
  allPosts: BlogPost[],
  translationKey: string,
  locale: Locale,
): BlogPost | undefined {
  return allPosts.find(
    (post) => post.data.translationKey === translationKey && post.data.lang === locale,
  );
}

export function formatDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/**
 * Compact "Mmm YYYY" date, matching the format used by the post cards in
 * `newdesign/index.html` (e.g. "Jun 2020", "Abr 2019"). Capitalized to
 * match the design's own examples.
 */
export function formatShortDate(date: Date, locale: Locale): string {
  const formatted = new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-US', {
    month: 'short',
    year: 'numeric',
  }).format(date);
  return formatted.replace(/^\p{L}/u, (c) => c.toUpperCase()).replace('.', '');
}

/** Rough reading time estimate, language-agnostic word count heuristic. */
export function estimateReadingMinutes(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
