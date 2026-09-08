# jmanuelcorral.github.io

Personal site and bilingual (Spanish/English) software engineering notebook,
built with [Astro](https://astro.build) and deployed to GitHub Pages.

Spanish (`/es/`) is the canonical language; English (`/en/`) entries are
translations and may lag behind. The root URL (`/`) redirects to `/es/`.

## Content

- 10 bilingual blog posts (5 Spanish + 5 English translations) under
  `src/content/blog/{es,en}/`.
- 5 legacy Jekyll post URLs are preserved as static redirect stubs
  (see `src/pages/[legacy].astro` and `src/data/legacyRedirects.ts`) that
  forward to their corresponding Spanish post.
- `robots.txt`, `sitemap.xml` (via `@astrojs/sitemap`), and per-locale
  `rss.xml` feeds (via `@astrojs/rss`).
- `/llms.txt` and `/llms-full.txt` — machine-readable summaries of the site
  content for LLM tooling, generated at build time from the content
  collection.
- A custom 404 page.
- Design assets and CV files served from `public/`.

## Local development

Requires Node.js (see `withastro/action` in the deploy workflow for the
version used in CI) and npm.

```bash
npm ci             # install dependencies from the lockfile
npm run dev        # start the local dev server
npm run check      # type-check the project (astro check)
npm run build      # build the static site to dist/
npm run preview    # preview the production build locally
```

## Deployment

The site is a static Astro build deployed to **GitHub Pages** via
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), using the
official `withastro/action` and `actions/deploy-pages` GitHub Actions. The
workflow builds on every push to `master` that touches Astro source,
config, content, or public files, and can also be run manually via
`workflow_dispatch`. Enabling the live deployment requires GitHub Pages
**Settings → Pages → Source** to be set to "GitHub Actions" — that switch
is a separate, deliberate step taken by the repository owner.

## License

MIT — see [LICENSE](LICENSE).
