// Canonical/hreflang-alternate helpers (Rusty-owned platform utility) for
// Basher's pages/components to consume — e.g. to build the `alternates`
// prop that SeoHead.astro already expects. Deliberately additive: it only
// reads from the existing `i18n.ts` / `content.ts` helpers and never edits
// them, since components already depend on those as-is.
import { LOCALES, blogPostPath, type Locale } from './i18n';
import type { BlogPost } from './content';

const FALLBACK_SITE = 'https://josecorral.dev';

/**
 * Canonical site origin. `site` in `astro.config.mjs` is the source of truth;
 * the fallback only covers a build where it is somehow unset, so callers stop
 * repeating the domain literal.
 */
export function siteUrl(site?: URL | string): URL {
  if (site !== undefined) return typeof site === 'string' ? new URL(site) : site;
  return new URL(import.meta.env.SITE || FALLBACK_SITE);
}

export interface AlternateLink {
  locale: Locale;
  path: string;
}

/**
 * Build the hreflang-alternate list for a translated blog post: one entry
 * per locale that has a published translation sharing `translationKey`.
 * Pass the result straight into <SeoHead alternates={...} />.
 */
export function getPostAlternates(
  allPosts: BlogPost[],
  translationKey: string,
): AlternateLink[] {
  const alternates: AlternateLink[] = [];
  for (const locale of LOCALES) {
    const match = allPosts.find(
      (post) => post.data.translationKey === translationKey && post.data.lang === locale,
    );
    if (match) alternates.push({ locale, path: blogPostPath(locale, match.data.slug) });
  }
  return alternates;
}

/**
 * Build the hreflang-alternate list for a static (non-post) page that has
 * one fixed path per locale, e.g. the home page or a future /about page.
 */
export function getStaticPageAlternates(pathsByLocale: Record<Locale, string>): AlternateLink[] {
  return LOCALES.map((locale) => ({ locale, path: pathsByLocale[locale] }));
}

/** Resolve an absolute, canonical URL for an absolute site path. */
export function canonicalUrl(site: URL | string, path: string): string {
  return new URL(path, site).toString();
}
