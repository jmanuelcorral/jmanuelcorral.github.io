// Central mapping of legacy Jekyll URLs to the migrated Spanish posts that
// replace them. Rusty-owned (platform data) so redirect resolution logic in
// `src/pages/[legacy].astro` has a single source of truth instead of guessed
// translationKeys scattered across pages.
//
// GitHub Pages serves no server-side redirects, so every one of these paths
// must resolve to a real prerendered stub page at build time (see the
// dynamic route that consumes this file).
//
// Resolution order (see [legacy].astro):
//   1. A Spanish `blog` entry whose frontmatter `legacyPath` matches exactly
//      (authoritative — this is how Tess records the binding once a post is
//      migrated).
//   2. Fallback to the `expectedTranslationKey` below, in case a post has
//      been migrated under that key but `legacyPath` hasn't been set yet.
//   3. If neither resolves, the stub redirects to `/es/` (site home) and the
//      build logs a warning so the gap is visible in CI output.
//
// Legacy paths are case-sensitive and reproduced exactly as they existed on
// the Jekyll site (leading slash, original casing, no trailing slash, no
// extension).
export interface LegacyRedirect {
  /** Exact, case-sensitive legacy path, e.g. "/Hello-World". */
  legacyPath: string;
  /**
   * Expected `translationKey` of the Spanish post that replaces this URL.
   * Verified against the current content collection (2026-09-08); update
   * here if a post's translationKey is ever renamed.
   */
  expectedTranslationKey: string;
}

export const legacyRedirects: LegacyRedirect[] = [
  { legacyPath: '/Hello-World', expectedTranslationKey: 'hello-world' },
  {
    legacyPath: '/Setup-Kubernetes-en-win10',
    expectedTranslationKey: 'kubernetes-windows-10',
  },
  {
    legacyPath: '/Add-Elk-to-aspnetcore',
    expectedTranslationKey: 'aspnet-core-elk',
  },
  {
    legacyPath: '/Get-Coberture-working',
    expectedTranslationKey: 'dotnet-code-coverage',
  },
  {
    legacyPath: '/Validation-on-Entities',
    expectedTranslationKey: 'ddd-entity-validation',
  },
];
