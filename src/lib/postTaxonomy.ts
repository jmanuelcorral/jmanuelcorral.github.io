// Deterministic mapping from real content-collection posts to the exact
// card "kind" label and filter category defined in `newdesign/index.html`
// (its hardcoded p1..p5 posts). Keyed by `translationKey` because the five
// real posts under `src/content/blog/**` are — by `legacyPath` — the very
// same five posts the design illustrates:
//   p1 /Validation-on-Entities      -> ddd-entity-validation   (Arquitectura/Architecture, cat=devops)
//   p2 /Get-Coberture-working       -> dotnet-code-coverage    (DevOps,                    cat=devops)
//   p3 /Add-Elk-to-aspnetcore       -> aspnet-core-elk         (Observabilidad/Observability, cat=cloud)
//   p4 /Setup-Kubernetes-en-win10   -> kubernetes-windows-10   (Kubernetes,                cat=cloud)
//   p5 /Hello-World                 -> hello-world             (Blog,                      cat=devops)
// This lets every card reproduce the design's exact literal kind copy
// instead of deriving a label from raw tags. Any future post not yet in
// this table (no design equivalent exists) falls back to the design's own
// generic bucket — the same "Post · Blog" / cat "devops" used for its
// least-specific example (`hello-world`) — rather than inventing new copy.
export type PostCategory = 'cloud' | 'devops' | 'ai';

export interface PostTaxonomyEntry {
  cat: PostCategory;
  kind: { es: string; en: string };
}

export const POST_TAXONOMY: Record<string, PostTaxonomyEntry> = {
  'ddd-entity-validation': { cat: 'devops', kind: { es: 'Post · Arquitectura', en: 'Post · Architecture' } },
  'dotnet-code-coverage': { cat: 'devops', kind: { es: 'Post · DevOps', en: 'Post · DevOps' } },
  'aspnet-core-elk': { cat: 'cloud', kind: { es: 'Post · Observabilidad', en: 'Post · Observability' } },
  'kubernetes-windows-10': { cat: 'cloud', kind: { es: 'Post · Kubernetes', en: 'Post · Kubernetes' } },
  'hello-world': { cat: 'devops', kind: { es: 'Post · Blog', en: 'Post · Blog' } },
  'halostrix-vulkan-vs-rocm': {
    cat: 'ai',
    kind: { es: 'Experimento · Inferencia', en: 'Experiment · Inference' },
  },
  'halostrix-rocm-training-lab': {
    cat: 'ai',
    kind: { es: 'Experimento · Entrenamiento', en: 'Experiment · Training' },
  },
};

export const DEFAULT_POST_TAXONOMY: PostTaxonomyEntry = {
  cat: 'devops',
  kind: { es: 'Post · Blog', en: 'Post · Blog' },
};

export function taxonomyFor(translationKey: string): PostTaxonomyEntry {
  return POST_TAXONOMY[translationKey] ?? DEFAULT_POST_TAXONOMY;
}
