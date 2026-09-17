// Generates the social share image (og:image / twitter:image) committed at
// public/og-image.png. The site had no share image at all, so links to it
// rendered as bare text cards. This keeps the asset on-brand by reusing the
// site's own tokens (tokens.css) and the favicon mark, rather than a generic
// placeholder. Re-run after a redesign: `node scripts/build-og-image.mjs`.
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

// Values copied from src/styles/tokens.css (dark theme = the default theme).
const BG = '#0c0f14';
const FG = '#e9edf2';
const MUTED = '#96a0ad';
const ACCENT = '#2dd4bf';
const COPPER = '#e8935f';
const LINE = '#20262f';

const WIDTH = 1200;
const HEIGHT = 630;

/** The favicon mark, drawn on its own 48x48 grid and scaled by the caller. */
function mark(x, y, size) {
  const scale = size / 48;
  return `<g transform="translate(${x} ${y}) scale(${scale}) translate(-6 -1)">
    <rect x="6" y="1" width="48" height="48" rx="9" fill="${BG}" stroke="${LINE}" stroke-width="1.5" />
    <path d="M22 10c-5 0-6 3-6 8 0 4-1 6-4 7 3 1 4 3 4 7 0 5 1 8 6 8" stroke="${ACCENT}" stroke-width="3.4" stroke-linecap="round" fill="none" />
    <path d="M38 10c5 0 6 3 6 8 0 4 1 6 4 7-3 1-4 3-4 7 0 5-1 8-6 8" stroke="${COPPER}" stroke-width="3.4" stroke-linecap="round" fill="none" />
    <g stroke="${ACCENT}" stroke-width="1.6" stroke-linecap="round">
      <path d="M30 14l-6 12" />
      <path d="M30 14l6 12" />
      <path d="M24 26h12" />
    </g>
    <circle cx="30" cy="14" r="3.2" fill="${ACCENT}" />
    <circle cx="30" cy="38" r="3.2" fill="${COPPER}" />
    <circle cx="24" cy="26" r="2.6" fill="${FG}" />
    <circle cx="36" cy="26" r="2.6" fill="${FG}" />
  </g>`;
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="glow" cx="0.22" cy="0.15" r="0.9">
      <stop offset="0" stop-color="${ACCENT}" stop-opacity="0.16" />
      <stop offset="0.55" stop-color="${ACCENT}" stop-opacity="0.03" />
      <stop offset="1" stop-color="${ACCENT}" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="glowWarm" cx="0.9" cy="0.95" r="0.7">
      <stop offset="0" stop-color="${COPPER}" stop-opacity="0.14" />
      <stop offset="1" stop-color="${COPPER}" stop-opacity="0" />
    </radialGradient>
  </defs>

  <rect width="${WIDTH}" height="${HEIGHT}" fill="${BG}" />
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glow)" />
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glowWarm)" />

  ${mark(96, 96, 132)}

  <text x="96" y="352" fill="${FG}" font-family="Helvetica, Arial, sans-serif" font-size="72" font-weight="700" letter-spacing="-1.5">José Manuel Corral</text>
  <text x="96" y="412" fill="${MUTED}" font-family="Helvetica, Arial, sans-serif" font-size="34" font-weight="400">Cloud Solution Architect · IA · Open source</text>

  <g font-family="monospace" font-size="22" letter-spacing="1.5">
    <text x="96" y="512" fill="${ACCENT}">josecorral.dev</text>
    <text x="96" y="548" fill="${MUTED}">notas de ingeniería de software</text>
  </g>

  <rect x="96" y="576" width="1008" height="2" fill="${LINE}" />
</svg>`;

const outPath = fileURLToPath(new URL('../public/og-image.png', import.meta.url));
await mkdir(path.dirname(outPath), { recursive: true });
await sharp(Buffer.from(svg), { density: 144 })
  .resize(WIDTH, HEIGHT, { fit: 'cover' })
  .png({ optimizationLevel: 7 })
  .toFile(outPath);

console.log(`Wrote ${outPath} (${WIDTH}x${HEIGHT})`);
