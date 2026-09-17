#!/usr/bin/env node
// Build-time content validator for the bilingual `blog` collection.
//
// Astro's schema (src/content.config.ts) already rejects malformed
// frontmatter; this script covers the rules a per-file schema cannot
// express, because they span two files, two locales, or the redirect map:
//
//   ERRORS (exit 1)
//     - a post's `lang` disagrees with the locale folder it lives in
//     - a required frontmatter field is missing or unparseable
//     - two posts in one locale share a slug (they would collide on one URL)
//     - two posts in one locale share a translationKey (ambiguous pairing)
//     - a slug is not URL-safe
//     - a legacy redirect resolves to no Spanish post
//     - a Spanish post declares a legacyPath that no redirect serves
//     - a legacyPath is malformed (must be "/Old-Thing", no trailing slash)
//
//   WARNINGS (informational; `--strict` promotes them to errors)
//     - a Spanish post has no English translation yet (expected: es is
//       canonical and en may lag)
//     - an English post has no Spanish counterpart (unusual: es is canonical)
//
// Frontmatter is read with targeted per-key patterns rather than a YAML
// parser, so the site keeps zero extra dependencies. Anything the patterns
// cannot read is reported as an error rather than silently skipped, so an
// unexpected format surfaces loudly instead of passing unnoticed.
//
// Usage: node scripts/validate-content.mjs [--strict]

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const CONTENT_DIR = join(ROOT, 'src/content/blog');
const REDIRECTS_FILE = join(ROOT, 'src/data/legacyRedirects.ts');
const LOCALE_FOLDERS = ['es', 'en'];
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const LEGACY_PATTERN = /^\/[A-Za-z0-9][A-Za-z0-9._-]*$/;

const strict = process.argv.includes('--strict');
const errors = [];
const warnings = [];

const error = (message) => errors.push(message);
const warn = (message) => warnings.push(message);

/** Pull a single quoted scalar out of a frontmatter block. */
function scalar(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^${key}:[ \\t]*'([^']*)'[ \\t]*$`, 'm'));
  return match ? match[1] : null;
}

function readFrontmatter(filePath) {
  const text = readFileSync(filePath, 'utf8');
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  const frontmatter = match[1];
  const draftMatch = frontmatter.match(/^draft:[ \t]*(true|false)[ \t]*$/m);
  return {
    lang: scalar(frontmatter, 'lang'),
    translationKey: scalar(frontmatter, 'translationKey'),
    slug: scalar(frontmatter, 'slug'),
    legacyPath: scalar(frontmatter, 'legacyPath'),
    title: scalar(frontmatter, 'title'),
    description: scalar(frontmatter, 'description'),
    draft: draftMatch ? draftMatch[1] === 'true' : null,
    hasPubDate: /^pubDate:[ \t]*\S/m.test(frontmatter),
  };
}

function listPostFiles(locale) {
  const dir = join(CONTENT_DIR, locale);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith('.md'))
    .sort()
    .map((name) => join(dir, name));
}

/** @type {Map<string, Array<{ file: string, entry: ReturnType<typeof readFrontmatter> }>>} */
const byLocale = new Map();

for (const folder of LOCALE_FOLDERS) {
  const posts = [];
  for (const file of listPostFiles(folder)) {
    const label = relative(ROOT, file);
    const entry = readFrontmatter(file);
    if (!entry) {
      error(`${label}: no frontmatter block found.`);
      continue;
    }
    posts.push({ file: label, entry });

    if (entry.lang !== folder) {
      error(
        `${label}: lang is '${entry.lang ?? 'missing'}' but the file lives in src/content/blog/${folder}/. ` +
          `The frontmatter lang must match its folder or the post renders in the wrong locale.`,
      );
    }
    for (const field of ['title', 'description', 'translationKey', 'slug']) {
      if (!entry[field]) error(`${label}: required field '${field}' is missing or not a single-quoted string.`);
    }
    if (!entry.hasPubDate) error(`${label}: 'pubDate' is missing.`);
    if (entry.draft === null) error(`${label}: 'draft' is missing or is not true/false.`);
    if (entry.slug && !SLUG_PATTERN.test(entry.slug)) {
      error(`${label}: slug '${entry.slug}' is not URL-safe (expected lowercase kebab-case).`);
    }
    if (entry.legacyPath && folder !== 'es') {
      error(`${label}: legacyPath is only valid on Spanish posts.`);
    }
    if (folder === 'es' && entry.legacyPath && !LEGACY_PATTERN.test(entry.legacyPath)) {
      error(
        `${label}: legacyPath '${entry.legacyPath}' must start with '/' and have no trailing slash ` +
          `(e.g. '/Hello-World').`,
      );
    }
  }
  byLocale.set(folder, posts);
}

// Uniqueness within a locale: a repeated slug means two posts would build to
// the same URL; a repeated translationKey makes the locale switch ambiguous.
for (const folder of LOCALE_FOLDERS) {
  const posts = byLocale.get(folder);
  for (const field of ['slug', 'translationKey']) {
    const seen = new Map();
    for (const { file, entry } of posts) {
      const value = entry[field];
      if (!value) continue;
      if (seen.has(value)) {
        error(
          `Duplicate ${field} '${value}' in ${folder}: ${seen.get(value)} and ${file}. ` +
            `Two ${folder} posts cannot share a ${field}.`,
        );
      } else {
        seen.set(value, file);
      }
    }
  }
}

// Cross-locale pairing. es is canonical and en may lag, so a missing
// translation is a warning; the reverse is unusual enough to call out too.
const keysByLocale = new Map(
  LOCALE_FOLDERS.map((folder) => [
    folder,
    new Set(byLocale.get(folder).map(({ entry }) => entry.translationKey).filter(Boolean)),
  ]),
);

for (const { file, entry } of byLocale.get('es')) {
  if (entry.translationKey && !keysByLocale.get('en').has(entry.translationKey)) {
    warn(`${file}: '${entry.translationKey}' has no English translation yet.`);
  }
}
for (const { file, entry } of byLocale.get('en')) {
  if (entry.translationKey && !keysByLocale.get('es').has(entry.translationKey)) {
    warn(`${file}: '${entry.translationKey}' has no Spanish counterpart, though Spanish is the canonical locale.`);
  }
}

// Legacy redirects must resolve both ways: every declared redirect must find
// a Spanish post, and every Spanish post that records a legacyPath must have
// a redirect serving it (otherwise the old URL 404s).
const redirectSource = existsSync(REDIRECTS_FILE) ? readFileSync(REDIRECTS_FILE, 'utf8') : null;
if (!redirectSource) {
  error('src/data/legacyRedirects.ts is missing; legacy URL redirects cannot be verified.');
} else {
  // Scope to the array literal so the `export interface LegacyRedirect { … }`
  // block above it is never mistaken for an entry, and match keys inline
  // because entries are written both one-per-line and wrapped across lines.
  const arrayBody = (redirectSource.match(/legacyRedirects[^=]*=\s*\[([\s\S]*?)\n\];/) ?? [])[1] ?? '';
  const entries = [...arrayBody.matchAll(/\{[^{}]*\}/g)].map((match) => ({
    legacyPath: match[0].match(/legacyPath:\s*'([^']*)'/)?.[1] ?? null,
    expectedTranslationKey: match[0].match(/expectedTranslationKey:\s*'([^']*)'/)?.[1] ?? null,
  }));

  const esPosts = byLocale.get('es');
  const servedLegacyPaths = new Set();

  for (const item of entries) {
    if (!item.legacyPath || !item.expectedTranslationKey) {
      error(`legacyRedirects.ts: an entry is missing legacyPath or expectedTranslationKey: {${item.legacyPath}}`);
      continue;
    }
    if (!LEGACY_PATTERN.test(item.legacyPath)) {
      error(`legacyRedirects.ts: legacyPath '${item.legacyPath}' must start with '/' and have no trailing slash.`);
    }
    const resolved = esPosts.find(
      ({ entry }) =>
        entry.legacyPath === item.legacyPath || entry.translationKey === item.expectedTranslationKey,
    );
    if (!resolved) {
      error(
        `legacyRedirects.ts: '${item.legacyPath}' resolves to no Spanish post ` +
          `(expected translationKey '${item.expectedTranslationKey}'). The build would silently ` +
          `fall back to /es/.`,
      );
    } else {
      servedLegacyPaths.add(item.legacyPath);
    }
  }

  for (const { file, entry } of esPosts) {
    if (entry.legacyPath && !servedLegacyPaths.has(entry.legacyPath)) {
      error(
        `${file}: declares legacyPath '${entry.legacyPath}' but no redirect serves it. ` +
          `Add it to src/data/legacyRedirects.ts or the old URL will 404.`,
      );
    }
  }
}

if (warnings.length > 0) {
  console.log(`\nContent warnings (${warnings.length}):`);
  for (const message of warnings) console.log(`  ~ ${message}`);
}

if (errors.length > 0) {
  console.error(`\nContent errors (${errors.length}):`);
  for (const message of errors) console.error(`  x ${message}`);
  console.error('\nContent validation failed.');
  process.exit(1);
}

if (strict && warnings.length > 0) {
  console.error('\n--strict: warnings are treated as errors. Validation failed.');
  process.exit(1);
}

const total = LOCALE_FOLDERS.reduce((sum, folder) => sum + byLocale.get(folder).length, 0);
console.log(`Content validation passed (${total} posts across ${LOCALE_FOLDERS.join(', ')}).`);
