// Taxonomy vocabulary for the blog. The per-post values — which category a
// post belongs to, what its card label reads — now live in each post's
// frontmatter (see `src/content.config.ts`). This module keeps only what is
// genuinely shared: the allowed values, how each one is labeled per locale,
// and how to derive the filter buttons for a set of posts. A new post
// becomes filterable the moment it declares its category, instead of
// needing a side table updated in step.
import type { Locale } from './i18n';

export type PostCategory = 'cloud' | 'devops' | 'ai';
export type ExperimentCategory = 'inference' | 'training' | 'rag';

/** A filter button: the value it filters on and the text it shows. */
export interface FilterOption<T extends string> {
  value: T;
  label: string;
}

// Fixed display order, so derived buttons never reshuffle with content order.
const POST_CATEGORY_ORDER: readonly PostCategory[] = ['cloud', 'devops', 'ai'];
const EXPERIMENT_CATEGORY_ORDER: readonly ExperimentCategory[] = ['inference', 'training', 'rag'];

const POST_CATEGORY_LABELS: Record<Locale, Record<PostCategory, string>> = {
  es: { cloud: 'Cloud', devops: 'DevOps', ai: 'IA' },
  en: { cloud: 'Cloud', devops: 'DevOps', ai: 'AI' },
};

const EXPERIMENT_CATEGORY_LABELS: Record<Locale, Record<ExperimentCategory, string>> = {
  es: { inference: 'Inferencia', training: 'Entrenamiento', rag: 'RAG' },
  en: { inference: 'Inference', training: 'Training', rag: 'RAG' },
};

function deriveFilterOptions<T extends string>(
  values: Array<T | undefined>,
  labels: Record<Locale, Record<T, string>>,
  order: readonly T[],
  locale: Locale,
): FilterOption<T>[] {
  const present = new Set(values.filter((value): value is T => value !== undefined));
  return order
    .filter((value) => present.has(value))
    .map((value) => ({ value, label: labels[locale][value] }));
}

/** Filter buttons for the post categories actually present in `categories`. */
export function postCategoryFilters(
  categories: Array<PostCategory | undefined>,
  locale: Locale,
): FilterOption<PostCategory>[] {
  return deriveFilterOptions(categories, POST_CATEGORY_LABELS, POST_CATEGORY_ORDER, locale);
}

/** Filter buttons for the experiment sub-categories present in `categories`. */
export function experimentCategoryFilters(
  categories: Array<ExperimentCategory | undefined>,
  locale: Locale,
): FilterOption<ExperimentCategory>[] {
  return deriveFilterOptions(categories, EXPERIMENT_CATEGORY_LABELS, EXPERIMENT_CATEGORY_ORDER, locale);
}
