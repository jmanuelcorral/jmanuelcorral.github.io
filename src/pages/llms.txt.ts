// Generates /llms.txt from the content collection at build time, following
// the emerging llms.txt convention (https://llmstxt.org/): an H1 title, a
// short blockquote summary, brief notes, then link-list sections. No
// drafts, no redirect stubs, no images (the schema has none to begin with).
import type { APIContext } from 'astro';
import { blogPostPath } from '../lib/i18n';
import { getPublishedPostsByLocale } from '../lib/llms';

function toAbsolute(site: URL, path: string): string {
  return new URL(path, site).toString();
}

function postLine(site: URL, locale: 'es' | 'en', post: Awaited<ReturnType<typeof getPublishedPostsByLocale>>[number]): string {
  const url = toAbsolute(site, blogPostPath(locale, post.data.slug));
  return `- [${post.data.title}](${url}): ${post.data.description}`;
}

export async function GET(context: APIContext) {
  const site = context.site ?? new URL('https://jmanuelcorral.github.io');
  const [esPosts, enPosts] = await Promise.all([
    getPublishedPostsByLocale('es'),
    getPublishedPostsByLocale('en'),
  ]);

  const lines: string[] = [];
  lines.push('# jmanuelcorral');
  lines.push('');
  lines.push(
    '> Compendio de vivencias, experiencias y recursos de desarrollo — a bilingual ' +
      '(Spanish/English) software engineering notebook covering .NET, Kubernetes, ' +
      'Docker and web development.',
  );
  lines.push('');
  lines.push(
    'Notes: Spanish is the canonical language; English entries are translations ' +
      'and may lag behind. Only published posts are listed — drafts and legacy ' +
      'URL redirect stubs are intentionally omitted. See /llms-full.txt for the ' +
      'complete text of every post in one file.',
  );
  lines.push('');

  lines.push('## Spanish posts');
  lines.push('');
  if (esPosts.length === 0) {
    lines.push('- (none published yet)');
  } else {
    for (const post of esPosts) lines.push(postLine(site, 'es', post));
  }
  lines.push('');

  lines.push('## English posts');
  lines.push('');
  if (enPosts.length === 0) {
    lines.push('- (none published yet)');
  } else {
    for (const post of enPosts) lines.push(postLine(site, 'en', post));
  }
  lines.push('');

  lines.push('## Key pages');
  lines.push('');
  lines.push(`- [Home (Español)](${toAbsolute(site, '/es/')})`);
  lines.push(`- [Home (English)](${toAbsolute(site, '/en/')})`);
  lines.push(`- [RSS (Español)](${toAbsolute(site, '/es/rss.xml')})`);
  lines.push(`- [RSS (English)](${toAbsolute(site, '/en/rss.xml')})`);
  lines.push('');

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
