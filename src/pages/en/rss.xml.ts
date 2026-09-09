// Per-locale RSS feed (Rusty-owned platform route). Draft posts are always
// excluded regardless of environment — an RSS feed is published content,
// not a preview surface.
import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { blogPostPath } from '../../lib/i18n';

export async function GET(context: APIContext) {
  const posts = await getCollection(
    'blog',
    (entry) => entry.data.lang === 'en' && !entry.data.draft,
  );

  posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  return rss({
    title: 'jmanuelcorral — software engineering notes',
    description: 'A collection of experiences, lessons and development resources',
    site: context.site ?? new URL('https://josecorral.dev'),
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: blogPostPath('en', post.data.slug),
      categories: post.data.tags,
    })),
    customData: '<language>en-us</language>',
  });
}
