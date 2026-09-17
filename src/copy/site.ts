// Site-level copy: the document `<head>` description and the footer's
// repeated link labels. Split out of the old monolithic `homeCopy.ts` so a
// copy edit only touches the domain it belongs to.
import type { Locale } from '../lib/i18n';

export interface SeoCopy {
  title: string;
  description: string;
}

export interface FootCopy {
  code: string;
  docs: string;
  role: string;
  cvStandard: string;
}

export const SEO_COPY: Record<Locale, SeoCopy> = {
  es: {
    title: 'José Manuel Corral — Cloud & AI · Open Source',
    description:
      'Cloud Solution Architect especializado en Azure, IA, arquitecturas multi-agente y RAG. Portfolio open source, CV y experimentos de IA local.',
  },
  en: {
    title: 'José Manuel Corral — Cloud & AI · Open Source',
    description:
      'Cloud Solution Architect specialized in Azure, AI, multi-agent architectures and RAG. Open source portfolio, résumé and local-AI experiments.',
  },
};

export const FOOT_COPY: Record<Locale, FootCopy> = {
  es: {
    code: 'Código →',
    docs: 'Documentación →',
    role: 'Cloud Solution Architect',
    cvStandard: 'CV standard',
  },
  en: {
    code: 'Code →',
    docs: 'Documentation →',
    role: 'Cloud Solution Architect',
    cvStandard: 'CV standard',
  },
};
