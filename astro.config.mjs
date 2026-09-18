// Platform build config (Rusty-owned). User Pages site at repo root, so no
// `base` is needed. Static output only — no adapter, no server rendering.
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://josecorral.dev',
  output: 'static',
  trailingSlash: 'always',
  redirects: {
    '/es/blog/de-12-t-s-a-128k-fontaneria-halo-strix/': '/es/blog/menos-espera-mas-agentes-stack-ia-local/',
    '/en/blog/from-12-tps-to-128k-halo-strix-plumbing/': '/en/blog/less-waiting-more-agents-local-ai-stack/',
  },
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
      // real content pages — keep them out of the sitemap. The bare root is
      // too: it is a noindex redirect stub, so listing it would ask crawlers
      // to index exactly what its robots meta tells them to skip.
      filter: (page) =>
        new URL(page).pathname !== '/' &&
        !/\/llms(-full)?\.txt$/.test(page) &&
        ![
          '/Hello-World/',
          '/Setup-Kubernetes-en-win10/',
          '/Add-Elk-to-aspnetcore/',
          '/Get-Coberture-working/',
          '/Validation-on-Entities/',
          '/es/blog/de-12-t-s-a-128k-fontaneria-halo-strix/',
          '/en/blog/from-12-tps-to-128k-halo-strix-plumbing/',
        ].some((legacy) => page.endsWith(legacy)),
    }),
  ],
});
