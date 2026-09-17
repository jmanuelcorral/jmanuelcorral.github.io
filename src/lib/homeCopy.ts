// Static (non-post) copy for the home surface. The original values come
// from `newdesign/index.html`; approved content updates live here so both
// localized routes keep a single authoritative copy source.
import type { Locale } from './i18n';

export interface HomeCopy {
  seo: { title: string; description: string };
  nav: {
    portfolio: string;
    cvMenuAria: string;
    cvStandard: string;
    cvExtended: string;
    posts: string;
    labs: string;
    themeAria: string;
  };
  lang: { next: string; aria: string };
  hero: {
    eyebrow: string;
    titleHtml: string;
    lead: string;
    meta1Html: string;
    ctaPortfolio: string;
    ctaCv: string;
  };
  port: { eyebrow: string; title: string; sub: string; allRepos: string };
  foot: { code: string; docs: string; role: string; cvStandard: string };
  star: { eyebrow: string; title: string; sub: string; all: string };
  posts: { eyebrow: string; title: string; sub: string; fAll: string; all: string };
  labs: {
    eyebrow: string;
    title: string;
    sub: string;
    fAll: string;
    all: string;
    lab1Kind: string;
    lab1Title: string;
    lab2Kind: string;
    lab2Title: string;
    lab3Kind: string;
    lab3Title: string;
    pending: string;
    seed: string;
  };
  cli: {
    boot: string;
    hi: string;
    o1: string;
    o2: string;
    o3: string;
    o4: string;
    hint: string;
    go: string;
    games: string;
    g1: string;
    g2: string;
    gback: string;
    playing: string;
    back: string;
    unknown: string;
    tryHelp: string;
    helpTitle: string;
    cleared: string;
  };
}

export const HOME_COPY: Record<Locale, HomeCopy> = {
  es: {
    seo: {
      title: 'José Manuel Corral — Cloud & AI · Open Source',
      description:
        'Cloud Solution Architect especializado en Azure, IA, arquitecturas multi-agente y RAG. Portfolio open source, CV y experimentos de IA local.',
    },
    nav: {
      portfolio: 'Open source',
      cvMenuAria: 'Versiones del CV',
      cvStandard: 'CV standard',
      cvExtended: 'CV extended',
      posts: 'Aprendizajes',
      labs: 'Experimentos',
      themeAria: 'Cambiar tema',
    },
    lang: { next: 'EN', aria: 'Cambiar a inglés' },
    hero: {
      eyebrow: 'Development · Cloud · IA · Open source',
      titleHtml: 'Diseño arquitecturas <span class="hl">cloud e IA</span>.',
      lead: 'Aquí encontrarás código, experiencias y aprendizajes.',
      meta1Html: '<b>Barcelona</b> · España',
      ctaPortfolio: 'Ver portfolio →',
      ctaCv: 'Ver CV →',
    },
    port: {
      eyebrow: 'Portfolio',
      title: 'Proyectos open source',
      sub: 'Repositorios que mantengo o en los que contribuyo. Cada uno enlaza al código y a su documentación.',
      allRepos: 'Todos los repos →',
    },
    foot: {
      code: 'Código →',
      docs: 'Documentación →',
      role: 'Cloud Solution Architect',
      cvStandard: 'CV standard',
    },
    star: {
      eyebrow: 'Starred',
      title: 'Proyectos que sigo',
      sub: 'Repos con estrella en mi GitHub — sobre todo sistemas multi-agente, herramientas de IA e infraestructura que uso o me inspiran.',
      all: 'Ver todos →',
    },
    posts: {
      eyebrow: 'Aprendizajes',
      title: 'Cosas que voy aprendiendo',
      sub: 'Notas cortas sobre lo que estoy explorando: cloud, IA, arquitectura y herramientas.',
      fAll: 'Todos',
      all: 'Ver todos →',
    },
    labs: {
      eyebrow: 'Experimentos',
      title: 'Laboratorio de IA local',
      sub: 'Pruebas y prototipos, sobre todo con modelos que corren en local: inferencia en edge, agentes, RAG offline.',
      fAll: 'Todos',
      all: 'Ver todos →',
      lab1Kind: 'Experimento · IA local',
      lab1Title: 'Inferencia local',
      lab2Kind: 'Experimento · Agentes',
      lab2Title: 'Agentes offline',
      lab3Kind: 'Experimento · RAG',
      lab3Title: 'RAG sin nube',
      pending: '— pendiente de sembrar',
      seed: 'Cuéntame qué experimentos quieres destacar y los convierto en tarjetas reales con enlace.',
    },
    cli: {
      boot: 'jmanuelcorralOS v1.0 — sesión iniciada',
      hi: 'Hola, soy Jose. Escribe un número y pulsa Enter para navegar:',
      o1: 'Open source',
      o2: 'CV',
      o3: 'Aprendizajes',
      o4: 'Experimentos',
      hint: 'help = ayuda · clear = limpiar',
      go: '→ abriendo',
      games: '🥚 SECRET GAMES MENU — arcade de Jose',
      g1: 'Barrelshift',
      g2: 'Pinball',
      gback: 'volver al menú principal',
      playing: '→ lanzando',
      back: '↩ de vuelta al menú principal',
      unknown: 'comando no reconocido:',
      tryHelp: 'escribe help o un número del 1 al 5.',
      helpTitle: 'comandos disponibles:',
      cleared: 'pantalla limpia. escribe un número para navegar.',
    },
  },
  en: {
    seo: {
      title: 'José Manuel Corral — Cloud & AI · Open Source',
      description:
        'Cloud Solution Architect specialized in Azure, AI, multi-agent architectures and RAG. Open source portfolio, résumé and local-AI experiments.',
    },
    nav: {
      portfolio: 'Open source',
      cvMenuAria: 'CV versions',
      cvStandard: 'CV standard',
      cvExtended: 'CV extended',
      posts: 'Learnings',
      labs: 'Experiments',
      themeAria: 'Toggle theme',
    },
    lang: { next: 'ES', aria: 'Switch to Spanish' },
    hero: {
      eyebrow: 'Development · Cloud · AI · Open source',
      titleHtml: 'I design <span class="hl">cloud & AI</span> architectures.',
      lead: "Here you'll find code, experiences and lessons learned.",
      meta1Html: '<b>Barcelona</b> · Spain',
      ctaPortfolio: 'View portfolio →',
      ctaCv: 'View CV →',
    },
    port: {
      eyebrow: 'Portfolio',
      title: 'Open source projects',
      sub: 'Repositories I maintain or contribute to. Each one links to the code and its documentation.',
      allRepos: 'All repos →',
    },
    foot: {
      code: 'Code →',
      docs: 'Documentation →',
      role: 'Cloud Solution Architect',
      cvStandard: 'CV standard',
    },
    star: {
      eyebrow: 'Starred',
      title: 'Projects I follow',
      sub: "Repos I've starred on GitHub — mostly multi-agent systems, AI tooling and infrastructure I use or that inspire me.",
      all: 'View all →',
    },
    posts: {
      eyebrow: 'Learnings',
      title: "Things I'm learning",
      sub: "Short notes on what I'm exploring: cloud, AI, architecture and tooling.",
      fAll: 'All',
      all: 'View all →',
    },
    labs: {
      eyebrow: 'Experiments',
      title: 'Local AI lab',
      sub: 'Tests and prototypes, mostly with models running locally: edge inference, agents, offline RAG.',
      fAll: 'All',
      all: 'View all →',
      lab1Kind: 'Experiment · Local AI',
      lab1Title: 'Local inference',
      lab2Kind: 'Experiment · Agents',
      lab2Title: 'Offline agents',
      lab3Kind: 'Experiment · RAG',
      lab3Title: 'Cloudless RAG',
      pending: '— to be seeded',
      seed: "Tell me which experiments you want to feature and I'll turn them into real cards with links.",
    },
    cli: {
      boot: 'jmanuelcorralOS v1.0 — session started',
      hi: "Hi, I'm Jose. Type a number and press Enter to navigate:",
      o1: 'Open source',
      o2: 'CV',
      o3: 'Learnings',
      o4: 'Experiments',
      hint: 'help = help · clear = clear',
      go: '→ opening',
      games: "🥚 SECRET GAMES MENU — Jose's arcade",
      g1: 'Barrelshift',
      g2: 'Pinball',
      gback: 'back to main menu',
      playing: '→ launching',
      back: '↩ back to main menu',
      unknown: 'unknown command:',
      tryHelp: 'type help or a number from 1 to 5.',
      helpTitle: 'available commands:',
      cleared: 'screen cleared. type a number to navigate.',
    },
  },
};
