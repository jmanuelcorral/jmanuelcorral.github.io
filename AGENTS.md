# AGENTS.md — jmanuelcorral.github.io

Instructions for any coding agent (Copilot CLI, cloud agent, or other) working in
this repository. Read this before making changes. `README.md` is user-facing
project documentation (owned separately) — this file is agent operating guidance
and the two may overlap slightly by design.

## 1. What this repo is

A static, bilingual personal site and software-engineering notebook built with
[Astro](https://astro.build) (`output: 'static'`, no adapter, no client-side
hydration) and deployed to **GitHub Pages**. There is no backend, no database,
and no server-rendered routes.

## 2. Architecture and key paths

- `astro.config.mjs` — platform build config: site URL, `trailingSlash: 'always'`,
  `@astrojs/sitemap` with i18n locale map and a filter excluding `llms*.txt` and
  legacy redirect stubs from the sitemap.
- `src/content.config.ts` — the single content collection (`blog`) schema. Do not
  add new collections or fields without checking every existing post's
  frontmatter for compatibility.
- `src/content/blog/{es,en}/*.md` — blog posts. Currently 10 Spanish + 10 paired
  English translations, same filenames in both locale folders.
- `src/data/legacyRedirects.ts` + `src/pages/[legacy].astro` — static redirect
  stubs for 5 legacy Jekyll URLs, each forwarding to the corresponding Spanish
  post via `<meta http-equiv="refresh">` + `<link rel="canonical">` (GitHub
  Pages has no server-side redirects).
- `src/lib/` — platform utilities: `i18n.ts` (locale list, path builders),
  `content.ts`, `llms.ts`, `seo.ts` (canonical/hreflang helpers), `structuredData.ts`
  (JSON-LD), `homeCopy.ts` (composer over `src/copy/`), `postTaxonomy.ts`,
  `feed.ts` (the shared RSS builder), `filterSection.ts` (shared filter-chip
  behavior for the posts and labs sections).
- `src/copy/` — localized static copy split by domain: `site.ts`, `nav.ts`,
  `hero.ts`, `sections.ts`, `cli.ts`. Re-exported as `HOME_COPY` through
  `src/lib/homeCopy.ts`, so consumers import from `lib`, not from `copy`.
- `src/pages/` — routes: `index.astro` (instant meta-refresh `/` → `/es/`,
  `noindex` + canonical — see §4), `[locale]/[listing].astro` (the `blog` and
  `experiments` index pages, for both locales), `es/` and `en/` (each with
  `index.astro`, `blog/[slug].astro`, `rss.xml.ts`), `404.astro`,
  `llms.txt.ts`, `llms-full.txt.ts`, `[legacy].astro`.
- `src/layouts/`, `src/components/`, `src/styles/` — presentation layer.
- `public/` — static passthrough assets: design/reference HTML (`cv.html`,
  `resume-short.html`, `resume-extended.html`, `logo-animated.html`,
  `palette-proposal.html`), the social share image `og-image.png` (committed, but
  regenerate it with `node scripts/build-og-image.mjs` if the brand tokens change),
  the epoaura post video, and `robots.txt`. **CV PDFs are permanently
  disallowed here** — see §11. Post media rule: see §6.
- `newdesign/` — **immutable** visual source of truth. See §4.
- `.github/workflows/ci.yml` — quality gate (`check` + content validator + `build`)
  on every PR. `.github/workflows/deploy.yml` — GitHub Pages deploy workflow. See §7.
- `dist/`, `.astro/` — build output/types, gitignored, never committed.

## 3. Local commands and required validation

```bash
npm ci             # install from lockfile — use this, not `npm install`
npm run dev        # local dev server
npm run check      # astro check — run before finishing any src/ change
npm run validate:content  # bilingual content validator (also a CI gate)
npm run build      # static build to dist/ — must succeed before considering a
                    # change done if it touches src/, content, astro.config.mjs,
                    # content.config.ts, or public/
npm run preview    # preview the production build locally
node scripts/build-og-image.mjs  # regenerate public/og-image.png (1200x630)
```

There is no test framework (`node:test`, Jest, etc.) and no lint script configured
in `package.json` — do not invent one. `npm run check` (type-check),
`npm run validate:content` and `npm run build` are the validation gates for this
repo.

## 4. Bilingual content — schema and parity rules

- Spanish (`es`) is canonical; English (`en`) is a translation and may lag.
- Every post has: `title`, `description`, `lang` (`'es'|'en'`), `translationKey`
  (shared across a post's translations), `slug` (locale-specific, may differ from
  the other locale's slug and from the filename), `pubDate`, optional
  `updatedDate`, `tags[]`, `draft` (default `false`), and `legacyPath` — **valid
  only on `lang: 'es'` entries** (schema-enforced via `.refine`).
- Routes: `/es/blog/<slug>/`, `/en/blog/<slug>/`, `/es/`, `/en/`,
  `/es/blog/`, `/en/blog/`, `/es/experiments/`, `/en/experiments/`, and `/` →
  `/es/`. The root is **not** a 302: static output cannot issue one, so
  `src/pages/index.astro` emits `<meta http-equiv="refresh" content="0;url=/es/">`
  with `robots: noindex` and a canonical pointing at `/es/`, and the sitemap filter
  drops it (a `noindex` URL must not be advertised). `trailingSlash: 'always'` —
  always include the trailing slash.
- When adding or editing a post, keep the `es`/`en` pair in sync: same
  `translationKey`, consistent `draft`/`pubDate` intent, and matching tags where
  the content overlaps. If only one locale is ready, add it with `draft: true`
  or omit the translation — do not invent placeholder translations.
- Never add a new blog post file without also checking `src/lib/seo.ts`
  (`getPostAlternates`) and RSS/`llms.txt` generation still resolve correctly for
  the new entry (run `npm run build` and check for warnings, e.g. the
  `[legacy-redirect]` console warning in `[legacy].astro`).

## 5. `newdesign/` fidelity invariant

`newdesign/` is the **immutable visual source of truth**, documented in
`newdesign/DESIGN-HANDOFF.md` and `newdesign/DESIGN-MANIFEST.json`. Rules:

- Never edit files under `newdesign/`. Treat it as a read-only reference archive.
- When implementing or changing UI (`src/components/`, `src/layouts/`,
  `src/styles/`), match the exported pixels, tokens (color, spacing, type scale,
  radius, shadow, motion), responsive behavior, and interaction states from
  `newdesign/` — do not reinterpret, simplify, or restyle from scratch.
- If a UI detail is ambiguous, prefer the exported `newdesign/` HTML/CSS behavior
  over inventing a new pattern.
- **Privacy/security directives override visual fidelity.** If matching
  `newdesign/` exactly would reproduce disallowed content (CV PDFs, an email
  address, a `mailto:` link — see §11), redact or remove that content in
  *both* the production copy (`public/`, `src/`) and the design-source copy
  (`newdesign/`) rather than reproducing it faithfully. Fidelity is mandatory
  for everything else.
- `public/cv.html`, `public/resume-short.html`, `public/resume-extended.html`,
  `public/logo-animated.html`, and `public/palette-proposal.html` are
  **design/CV HTML assets**, distinct from blog content — they are allowed in
  `public/` and are not subject to the "no legacy post images" rule below.
  **CV PDFs are not allowed** in `public/`, `newdesign/`, source, or generated
  output — see §11.

## 6. No legacy post images

The blog carries no legacy Jekyll images — they were intentionally dropped during
the Astro migration, and "restoring" those references is off-limits. The single
media asset a post embeds is `public/epoaura-pantalla.mp4` (~380K), used by the
epoaura post in both locales through a `<video>` tag; that embedding is a
deliberate choice, not leftover. Adding new post imagery is a decision to raise
with the owner rather than something to default to. This is separate from the
design/CV assets in `public/`, which are expected and allowed.

## 7. SEO / RSS / sitemap / llms / redirect invariants

These are all **generated at build time** — never hand-author their output:

- **Sitemap**: `@astrojs/sitemap` (configured in `astro.config.mjs`) generates it
  from routes; the `filter` there excludes `llms*.txt` and the 5 legacy redirect
  stubs. Update the filter list, not a static sitemap file, if new non-content
  routes need excluding.
- **RSS**: `src/pages/{es,en}/rss.xml.ts`, built with `@astrojs/rss`, always
  excludes `draft: true` posts regardless of environment.
- **llms.txt / llms-full.txt**: generated by `src/pages/llms.txt.ts` /
  `llms-full.txt.ts` from the content collection, following the llms.txt
  convention. Excludes drafts and redirect stubs by construction.
- **JSON-LD / canonical / hreflang**: produced via `src/lib/seo.ts` and
  `structuredData.ts`. Any new page type needs an explicit alternates/canonical
  wiring — don't ship a page that silently has no canonical tag.
- **Legacy redirects**: the 5 mappings live in `src/data/legacyRedirects.ts`; the
  render logic lives in `src/pages/[legacy].astro`. Adding a legacy URL means
  adding an entry there, not a new one-off page.

## 8. Ownership / edit boundaries and smallest-change expectations

- Do not edit `README.md` (separately owned).
- Make the smallest change that fully satisfies the request. Do not restructure
  `src/lib/`, rename routes, or change the content schema as a side effect of an
  unrelated task.
- Comments in this codebase frequently note informal ownership (e.g. "Rusty-owned
  platform route", "Basher's pages/components") from the project's multi-agent
  history — treat these as context on intent/history, not as hard access control;
  the acting rule is still "smallest correct change."
- Prefer additive changes to `src/lib/` (new exported helpers) over editing
  existing exported function signatures that other files already depend on.

## 9. GitHub Pages workflow and `master`

- `.github/workflows/deploy.yml` triggers on push to `master` (paths: `src/**`,
  `public/**`, `astro.config.mjs`, `tsconfig.json`, `package.json`,
  `package-lock.json`, or the workflow file itself), plus manual
  `workflow_dispatch`. It builds with `withastro/action` and deploys with
  `actions/deploy-pages`.
- `master` is the **production branch** — the branch the deploy workflow
  triggers on and the one that reflects the live site. There is no
  `dev`/`insiders`/long-lived integration branch model in active use.
- **Do not assume `master` is the only ref.** The legacy remote branch
  `remotes/origin/post/DDDValidation` currently exists (pre-Astro-migration
  Jekyll-era history). It is not an active integration branch — do not merge
  from it, base work on it, or treat it as a deploy target. An authorized
  history purge is planned that will delete or force-update this legacy ref;
  until that happens, agents must still account for its existence (e.g. when
  reasoning about repo history, refs, or branch listings) instead of assuming
  a single-branch repository.
- **Never change the live GitHub Pages source setting** (Settings → Pages →
  Source) unless the user explicitly asks for it. Flipping that switch is a
  deliberate, separate action reserved for the repo owner.

## 10. Generated files are never committed

`dist/` and `.astro/` are gitignored build output — never commit them, never
hand-edit a file inside them, and never "fix" a generated artifact by editing
its output instead of its generator (`astro.config.mjs`, the `src/pages/*.ts`
route generators, or `src/content.config.ts`).

## 11. Security / privacy (public repository)

- This repository is public. Never commit secrets, tokens, or credentials.
  `.env`, `.env.production` are gitignored — never read or reproduce their
  contents; use `.env.example` or ask the user if config shape is needed (there
  is currently no `.env.example` — this project has no runtime secrets today).
- Do not add analytics, tracking scripts, or third-party embeds that transmit
  visitor data without the user's explicit request.
- **CV PDFs are permanently disallowed** from `public/`, `newdesign/`, source,
  and any generated output (including `dist/`), unless the user explicitly
  reverses this policy. Do not add, restore, reference, or regenerate a CV
  PDF file. (CV *HTML* files such as `public/cv.html`,
  `public/resume-short.html`, `public/resume-extended.html` remain allowed —
  see §5.)
- **The owner's email address and any `mailto:` link must never appear** in
  public HTML, `<meta>` tags, JSON-LD structured data
  (`src/lib/structuredData.ts`), design-source exports (`newdesign/`), or any
  generated output (`dist/`, `llms.txt`/`llms-full.txt`, RSS, sitemap). Public
  contact is via the existing GitHub and LinkedIn links already used on the
  site — do not invent new contact URLs or add a new contact channel.

## 12. Recommended skills (summary — see decision record for full research)

Ranked highlights from a repo skill audit; do not create/promote skill files
based on this section alone:

- **Keep/use as-is:** `.copilot/skills/secret-handling` (public repo, still the
  right default even with no live secrets today) and
  `.copilot/skills/session-recovery` (generic, low-risk, real utility).
- **Needs correction before trusting it:** `.copilot/skills/git-workflow`
  describes a `dev`/`insiders`/`squad/{issue}-slug` branching model that does not
  match this repo (`master` is the production branch that drives Pages
  deploys; a legacy remote branch `post/DDDValidation` also exists but is not
  an active integration branch — see §9) — don't follow its branching
  instructions here without adapting them.
  `.copilot/skills/squad-conventions` describes an unrelated npm CLI tool's own
  codebase conventions (zero-dependency Node package, `node:test`), not this
  Astro site — treat as not applicable here.
- **No longer applicable:** the `.squad/templates/skills/` copies (including
  `pr-screenshots`) were removed along with the rest of `.squad/` in the P3
  cleanup, so there is nothing left to promote from there. If screenshot-based
  verification of UI changes against `newdesign/` is wanted, author it fresh under
  one of the official skill locations rather than resurrecting the Squad copy.
- **Worth authoring later (repo-specific, do not exist yet):**
  1. *Bilingual parity check* — validate `es`/`en` `translationKey` pairing,
     slug uniqueness, and `legacyPath`/draft consistency before merging content.
  2. *`newdesign` fidelity review* — checklist-driven diff against
     `DESIGN-HANDOFF.md`/`DESIGN-MANIFEST.json` tokens for any UI change.
  3. *Generated-artifacts guard* — flag any hand-edited/committed `dist/`,
     sitemap, RSS, or `llms*.txt` output.

Official project-skill locations per GitHub Docs are `.github/skills`,
`.claude/skills`, `.agents/skills` (repo-scoped) and `~/.copilot/skills`,
`~/.agents/skills` (personal, home-directory). This repo's remaining skills live
in a project-root `.copilot/skills/` — a leftover from Squad's own playbook
convention, **not one of the officially documented locations above.** Do not
treat project-root `.copilot/skills/` as equivalent to the official repo-scoped
paths (`.github/skills`, `.claude/skills`, `.agents/skills`) for
discovery/precedence purposes; verify against current docs before depending on it
being picked up the same way.

## 13. Reference

- Astro docs: https://docs.astro.build
- `@astrojs/sitemap`: https://docs.astro.build/en/guides/integrations-guide/sitemap/
- `@astrojs/rss`: https://docs.astro.build/en/guides/rss/
- llms.txt convention: https://llmstxt.org/
- GitHub Pages + Actions deploy: https://docs.github.com/en/pages
- Agent skills (official): https://docs.github.com/en/copilot/concepts/agents/about-agent-skills
