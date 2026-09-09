// Generates /llms-full.txt: the same metadata as /llms.txt plus the full
// Markdown body of every published post, concatenated in one deterministic,
// dependency-free file (uses each entry's raw Markdown `body` — no HTML
// rendering or extra packages required).
import type { APIContext } from 'astro';
import { blogPostPath } from '../lib/i18n';
import { getPublishedPostsByLocale, type BlogPost } from '../lib/llms';

function toAbsolute(site: URL, path: string): string {
  return new URL(path, site).toString();
}

function renderPost(site: URL, locale: 'es' | 'en', post: BlogPost): string {
  const url = toAbsolute(site, blogPostPath(locale, post.data.slug));
  const tags = post.data.tags.length > 0 ? post.data.tags.join(', ') : 'none';
  const updated = post.data.updatedDate
    ? post.data.updatedDate.toISOString().slice(0, 10)
    : null;

  const meta = [
    `## ${post.data.title} (${locale})`,
    '',
    `- URL: ${url}`,
    `- Published: ${post.data.pubDate.toISOString().slice(0, 10)}`,
    ...(updated ? [`- Updated: ${updated}`] : []),
    `- Tags: ${tags}`,
    '',
    post.data.description,
    '',
    '---',
    '',
    post.body ?? '',
  ];

  return meta.join('\n');
}

export async function GET(context: APIContext) {
  const site = context.site ?? new URL('https://josecorral.dev');
  const [esPosts, enPosts] = await Promise.all([
    getPublishedPostsByLocale('es'),
    getPublishedPostsByLocale('en'),
  ]);

  const sections: string[] = [];
  sections.push('# jmanuelcorral — full content export');
  sections.push('');
  sections.push(
    '> Concise metadata plus the complete Markdown body of every published ' +
      'post, Spanish then English, newest first. Drafts and legacy redirect ' +
      'stubs are excluded. See /llms.txt for a shorter link-only index.',
  );
  sections.push('');

  sections.push('# Spanish posts');
  sections.push('');
  for (const post of esPosts) sections.push(renderPost(site, 'es', post));

  sections.push('# English posts');
  sections.push('');
  for (const post of enPosts) sections.push(renderPost(site, 'en', post));

  return new Response(sections.join('\n\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
