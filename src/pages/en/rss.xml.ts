// Per-locale RSS feed (Rusty-owned platform route). The feed itself is
// built by `src/lib/feed.ts`, which is where the "published only" rule
// lives; this route only pins the locale.
import type { APIContext } from 'astro';
import { buildFeed } from '../../lib/feed';

export async function GET(context: APIContext) {
  return buildFeed('en', context);
}
