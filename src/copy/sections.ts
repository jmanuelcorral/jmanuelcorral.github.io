// Home section headings: portfolio, starred repos, posts and labs. The
// cards themselves are data (`src/data/portfolio.ts`, the blog collection);
// this is only the section header text around them.
import type { Locale } from '../lib/i18n';

export interface PortCopy {
  eyebrow: string;
  title: string;
  sub: string;
  allRepos: string;
}

export interface StarCopy {
  eyebrow: string;
  title: string;
  sub: string;
  all: string;
}

export interface PostsCopy {
  eyebrow: string;
  title: string;
  sub: string;
  fAll: string;
  all: string;
}

export type LabsCopy = PostsCopy;

export const PORT_COPY: Record<Locale, PortCopy> = {
  es: {
    eyebrow: 'Portfolio',
    title: 'Proyectos open source',
    sub: 'Repositorios que mantengo o en los que contribuyo. Cada uno enlaza al código y a su documentación.',
    allRepos: 'Todos los repos →',
  },
  en: {
    eyebrow: 'Portfolio',
    title: 'Open source projects',
    sub: 'Repositories I maintain or contribute to. Each one links to the code and its documentation.',
    allRepos: 'All repos →',
  },
};

export const STAR_COPY: Record<Locale, StarCopy> = {
  es: {
    eyebrow: 'Starred',
    title: 'Proyectos que sigo',
    sub: 'Repos con estrella en mi GitHub — sobre todo sistemas multi-agente, herramientas de IA e infraestructura que uso o me inspiran.',
    all: 'Ver todos →',
  },
  en: {
    eyebrow: 'Starred',
    title: 'Projects I follow',
    sub: "Repos I've starred on GitHub — mostly multi-agent systems, AI tooling and infrastructure I use or that inspire me.",
    all: 'View all →',
  },
};

export const POSTS_COPY: Record<Locale, PostsCopy> = {
  es: {
    eyebrow: 'Aprendizajes',
    title: 'Cosas que voy aprendiendo',
    sub: 'Notas cortas sobre lo que estoy explorando: cloud, IA, arquitectura y herramientas.',
    fAll: 'Todos',
    all: 'Ver todos →',
  },
  en: {
    eyebrow: 'Learnings',
    title: "Things I'm learning",
    sub: "Short notes on what I'm exploring: cloud, AI, architecture and tooling.",
    fAll: 'All',
    all: 'View all →',
  },
};

export const LABS_COPY: Record<Locale, LabsCopy> = {
  es: {
    eyebrow: 'Experimentos',
    title: 'Laboratorio de IA local',
    sub: 'Pruebas y prototipos, sobre todo con modelos que corren en local: inferencia en edge, agentes, RAG offline.',
    fAll: 'Todos',
    all: 'Ver todos →',
  },
  en: {
    eyebrow: 'Experiments',
    title: 'Local AI lab',
    sub: 'Tests and prototypes, mostly with models running locally: edge inference, agents, offline RAG.',
    fAll: 'All',
    all: 'View all →',
  },
};
