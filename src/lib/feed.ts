// Shared RSS feed builder for the per-locale feeds. The two routes used to
// be byte-identical apart from a locale literal, so the whole feed lives here
// once now. Drafts never enter a feed regardless of environment: an RSS feed
// is published content, not a preview surface, so this gates on the shared
// `isPublished` predicate rather than re-deriving the rule per route.
import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { isPublished } from './content';
import { blogPostPath, type Locale } from './i18n';
import { siteUrl } from './seo';

interface FeedMeta {
  title: string;
  description: string;
  /** RSS's own `<language>` dialect, not a BCP 47 tag. */
  language: string;
}

const FEED_META: Record<Locale, FeedMeta> = {
  es: {
    title: 'jmanuelcorral — notas de ingeniería de software',
    description: 'Compendio de vivencias, experiencias y recursos de desarrollo',
    language: 'es',
  },
  en: {
    title: 'jmanuelcorral — software engineering notes',
    description: 'A collection of experiences, lessons and development resources',
    language: 'en-us',
  },
};

/** Build the RSS response for one locale, newest post first. */
export async function buildFeed(locale: Locale, context: APIContext) {
  const posts = await getCollection(
    'blog',
    (entry) => entry.data.lang === locale && isPublished(entry),
  );
  posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  const meta = FEED_META[locale];
  return rss({
    title: meta.title,
    description: meta.description,
    site: siteUrl(context.site),
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: blogPostPath(locale, post.data.slug),
      categories: post.data.tags,
    })),
    customData:
      `<language>${meta.language}</language>` +
      `<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
  });
}
