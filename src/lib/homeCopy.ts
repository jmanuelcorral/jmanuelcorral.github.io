// Composition layer for home-surface copy. The strings themselves live by
// domain under `src/copy/` (nav, hero, sections, cli, site) so editing one
// area no longer moves a ~300-line file; this module only assembles them
// into the shape components already read, so no consumer import changed.
//
// The placeholder lab card keys (`lab1Kind`…`lab3Title`, `pending`, `seed`)
// are gone: nothing rendered them, and their orphan CSS (`.post.stub`,
// `.seed-note`) went with them.
import type { Locale } from './i18n';
import { FOOT_COPY, SEO_COPY, type FootCopy, type SeoCopy } from '../copy/site';
import { LANG_COPY, NAV_COPY, type LangCopy, type NavCopy } from '../copy/nav';
import { HERO_COPY, type HeroCopy } from '../copy/hero';
import {
  LABS_COPY,
  PORT_COPY,
  POSTS_COPY,
  STAR_COPY,
  type LabsCopy,
  type PortCopy,
  type PostsCopy,
  type StarCopy,
} from '../copy/sections';
import { CLI_COPY, type CliCopy } from '../copy/cli';

export interface HomeCopy {
  seo: SeoCopy;
  nav: NavCopy;
  lang: LangCopy;
  hero: HeroCopy;
  port: PortCopy;
  foot: FootCopy;
  star: StarCopy;
  posts: PostsCopy;
  labs: LabsCopy;
  cli: CliCopy;
}

function compose(locale: Locale): HomeCopy {
  return {
    seo: SEO_COPY[locale],
    nav: NAV_COPY[locale],
    lang: LANG_COPY[locale],
    hero: HERO_COPY[locale],
    port: PORT_COPY[locale],
    foot: FOOT_COPY[locale],
    star: STAR_COPY[locale],
    posts: POSTS_COPY[locale],
    labs: LABS_COPY[locale],
    cli: CLI_COPY[locale],
  };
}

export const HOME_COPY: Record<Locale, HomeCopy> = {
  es: compose('es'),
  en: compose('en'),
};
