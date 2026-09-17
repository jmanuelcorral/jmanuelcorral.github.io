// The arcade games reachable from the terminal share the site's origin but are
// deployed outside this repo, so their URLs are derived from the canonical
// site origin instead of being pasted into the component.
import { siteUrl } from '../lib/seo';

/** Absolute URL for a game served under the site origin. */
export function gameUrl(slug: string): string {
  return new URL(`${slug}/`, siteUrl()).toString();
}
