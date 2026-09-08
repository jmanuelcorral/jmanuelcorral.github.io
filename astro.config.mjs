// Platform build config (Rusty-owned). User Pages site at repo root, so no
// `base` is needed. Static output only — no adapter, no server rendering.
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://jmanuelcorral.github.io',
  output: 'static',
  trailingSlash: 'always',
  // No UI framework integrations: components are plain Astro/HTML/CSS with
  // no client-side hydration, per the provisional-skeleton contract.
  integrations: [
    sitemap({
      // Both locales are explicitly prefixed (/es/, /en/); es is the
      // default so unprefixed alternates fall back to it.
      i18n: {
        defaultLocale: 'es',
        locales: { es: 'es', en: 'en' },
      },
      // Static legacy-redirect stubs and llms.txt/llms-full.txt are not
      // real content pages — keep them out of the sitemap.
      filter: (page) =>
        !/\/llms(-full)?\.txt$/.test(page) &&
        ![
          '/Hello-World/',
          '/Setup-Kubernetes-en-win10/',
          '/Add-Elk-to-aspnetcore/',
          '/Get-Coberture-working/',
          '/Validation-on-Entities/',
        ].some((legacy) => page.endsWith(legacy)),
    }),
  ],
});
