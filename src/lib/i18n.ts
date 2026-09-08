// Shared i18n configuration. Centralizing this here keeps locale-aware
// components (nav, locale switcher, layouts, SEO head) from duplicating
// locale lists/labels/strings.

export const LOCALES = ['es', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'es';

export const LOCALE_LABELS: Record<Locale, string> = {
  es: 'Español',
  en: 'English',
};

// BCP 47 tags used for hreflang / <html lang>.
export const LOCALE_HREFLANG: Record<Locale, string> = {
  es: 'es',
  en: 'en',
};

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export function otherLocales(locale: Locale): Locale[] {
  return LOCALES.filter((candidate) => candidate !== locale);
}

/** Small dictionary of UI copy that isn't post content. */
export const UI_STRINGS: Record<Locale, Record<string, string>> = {
  es: {
    skipToContent: 'Saltar al contenido principal',
    siteTitle: 'jmanuelcorral',
    siteTagline: 'Notas de ingeniería de software',
    navHome: 'Inicio',
    navBlog: 'Blog',
    switchLanguage: 'Cambiar idioma',
    readMore: 'Leer más',
    publishedOn: 'Publicado el',
    updatedOn: 'Actualizado el',
    tags: 'Etiquetas',
    backToBlog: 'Volver al blog',
    noPosts: 'Todavía no hay artículos publicados en español.',
    translationUnavailable:
      'Este artículo no está disponible en español todavía.',
    viewInLanguage: 'Ver en',
    notFoundTitle: 'Página no encontrada',
    notFoundBody: 'No pudimos encontrar la página que buscas.',
    notFoundLink: 'Volver al inicio',
    footerRights: 'Todos los derechos reservados.',
  },
  en: {
    skipToContent: 'Skip to main content',
    siteTitle: 'jmanuelcorral',
    siteTagline: 'Software engineering notes',
    navHome: 'Home',
    navBlog: 'Blog',
    switchLanguage: 'Switch language',
    readMore: 'Read more',
    publishedOn: 'Published on',
    updatedOn: 'Updated on',
    tags: 'Tags',
    backToBlog: 'Back to blog',
    noPosts: 'No posts published in English yet.',
    translationUnavailable: 'This post is not available in English yet.',
    viewInLanguage: 'View in',
    notFoundTitle: 'Page not found',
    notFoundBody: "We couldn't find the page you're looking for.",
    notFoundLink: 'Back home',
    footerRights: 'All rights reserved.',
  },
};

export function t(locale: Locale, key: string): string {
  return UI_STRINGS[locale]?.[key] ?? UI_STRINGS[DEFAULT_LOCALE][key] ?? key;
}

export function localePath(locale: Locale, path = ''): string {
  const cleaned = path.replace(/^\/+/, '');
  return `/${locale}/${cleaned}`.replace(/\/+$/, '/').replace(/\/{2,}/g, '/');
}

export function blogPostPath(locale: Locale, slug: string): string {
  return `/${locale}/blog/${slug}/`;
}
