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
    (entry) => entry.data.lang === 'es' && !entry.data.draft,
  );

  posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  return rss({
    title: 'jmanuelcorral — notas de ingeniería de software',
    description: 'Compendio de vivencias, experiencias y recursos de desarrollo',
    site: context.site ?? new URL('https://jmanuelcorral.github.io'),
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: blogPostPath('es', post.data.slug),
      categories: post.data.tags,
    })),
    customData: '<language>es</language>',
  });
}
