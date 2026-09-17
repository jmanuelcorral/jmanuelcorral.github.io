// Hero copy: the above-the-fold headline block on the home surface.
import type { Locale } from '../lib/i18n';

export interface HeroCopy {
  eyebrow: string;
  titleHtml: string;
  lead: string;
  meta1Html: string;
  ctaPortfolio: string;
  ctaCv: string;
}

export const HERO_COPY: Record<Locale, HeroCopy> = {
  es: {
    eyebrow: 'Development · Cloud · IA · Open source',
    titleHtml: 'Diseño arquitecturas <span class="hl">cloud e IA</span>.',
    lead: 'Aquí encontrarás código, experiencias y aprendizajes.',
    meta1Html: '<b>Barcelona</b> · España',
    ctaPortfolio: 'Ver portfolio →',
    ctaCv: 'Ver CV →',
  },
  en: {
    eyebrow: 'Development · Cloud · AI · Open source',
    titleHtml: 'I design <span class="hl">cloud & AI</span> architectures.',
    lead: "Here you'll find code, experiences and lessons learned.",
    meta1Html: '<b>Barcelona</b> · Spain',
    ctaPortfolio: 'View portfolio →',
    ctaCv: 'View CV →',
  },
};
