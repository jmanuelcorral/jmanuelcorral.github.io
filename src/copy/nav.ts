// Navigation copy: the nav bar items and the locale switcher.
import type { Locale } from '../lib/i18n';

export interface NavCopy {
  portfolio: string;
  cvMenuAria: string;
  cvStandard: string;
  cvExtended: string;
  posts: string;
  labs: string;
  themeAria: string;
}

export interface LangCopy {
  next: string;
  aria: string;
}

export const NAV_COPY: Record<Locale, NavCopy> = {
  es: {
    portfolio: 'Open source',
    cvMenuAria: 'Versiones del CV',
    cvStandard: 'CV standard',
    cvExtended: 'CV extended',
    posts: 'Aprendizajes',
    labs: 'Experimentos',
    themeAria: 'Cambiar tema',
  },
  en: {
    portfolio: 'Open source',
    cvMenuAria: 'CV versions',
    cvStandard: 'CV standard',
    cvExtended: 'CV extended',
    posts: 'Learnings',
    labs: 'Experiments',
    themeAria: 'Toggle theme',
  },
};

export const LANG_COPY: Record<Locale, LangCopy> = {
  es: { next: 'EN', aria: 'Cambiar a inglés' },
  en: { next: 'ES', aria: 'Switch to Spanish' },
};
