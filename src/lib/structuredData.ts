// Structured data (JSON-LD) builders for the SEO head. Kept separate from
// SeoHead.astro's markup so the two concerns (what tags render vs. what
// data they contain) stay independently testable/readable. Purely additive
// metadata — never affects rendered visuals.
import type { Locale } from './i18n';

const IN_LANGUAGE: Record<Locale, string> = { es: 'es-ES', en: 'en-US' };

// Single-author site — the same identity already used verbatim in the
// design's own footer ("José Manuel Corral Céspedes") and CV/portfolio
// links (github.com/jmanuelcorral).
const AUTHOR = {
  '@type': 'Person',
  name: 'José Manuel Corral Céspedes',
  url: 'https://github.com/jmanuelcorral',
} as const;

export interface WebSiteSchemaInput {
  kind: 'website';
  name: string;
  description: string;
}

export interface BlogPostingSchemaInput {
  kind: 'article';
  headline: string;
  description: string;
  datePublished: Date;
  /** Optional — omitted from the emitted schema entirely when absent,
   * rather than defaulting to datePublished. */
  dateModified?: Date;
}

export type StructuredDataInput = WebSiteSchemaInput | BlogPostingSchemaInput;

/**
 * Builds the JSON-LD object for a page. `canonicalUrl` is the same
 * absolute, locale-specific URL already computed for `<link rel="canonical">`
 * so the schema's `url`/`mainEntityOfPage` stay translation-aware (each
 * locale route gets its own canonical, hence its own schema instance).
 */
export function buildStructuredData(
  input: StructuredDataInput,
  locale: Locale,
  canonicalUrl: string,
): Record<string, unknown> {
  const inLanguage = IN_LANGUAGE[locale];

  if (input.kind === 'website') {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: input.name,
      description: input.description,
      url: canonicalUrl,
      inLanguage,
    };
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: input.headline,
    description: input.description,
    datePublished: input.datePublished.toISOString(),
    ...(input.dateModified ? { dateModified: input.dateModified.toISOString() } : {}),
    author: AUTHOR,
    inLanguage,
    url: canonicalUrl,
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
  };
}

/**
 * Serializes JSON-LD for safe embedding inside a `<script>` element.
 * `JSON.stringify` already produces valid, properly quote-escaped JSON;
 * the extra `<` -> `\u003c` replacement only guards against a literal
 * `</script>` sequence breaking out of the tag (e.g. inside a headline or
 * description string) and is itself valid JSON (a standard unicode escape
 * inside a string), so it never corrupts the parsed data.
 */
export function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
