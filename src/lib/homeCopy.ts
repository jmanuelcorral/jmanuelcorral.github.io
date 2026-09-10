// Static (non-post) copy for the home surface, transcribed verbatim from
// the `I18N` dictionary embedded in `newdesign/index.html`. Both locales
// were already authored by the approved design — this preserves that real
// copy instead of re-translating or paraphrasing it.
import type { Locale } from './i18n';

export interface HomeCopy {
  seo: { title: string; description: string };
  nav: { portfolio: string; cv: string; posts: string; labs: string; themeAria: string };
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
  flag: { badge: string; lang: string; desc: string };
  veta: { desc: string };
  cco: { desc: string };
  foot: { code: string; docs: string; role: string };
  star: { eyebrow: string; title: string; sub: string; all: string };
  cv: {
    eyebrow: string;
    title: string;
    sub: string;
    onlineTitle: string;
    onlineText: string;
    short: string;
    extended: string;
    dlShortT: string;
    dlShortS: string;
    dlExtT: string;
    dlExtS: string;
    idxT: string;
    idxS: string;
  };
  posts: { eyebrow: string; title: string; sub: string; fAll: string; all: string };
  labs: {
    eyebrow: string;
    title: string;
    sub: string;
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
      cv: 'CV',
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
      ctaCv: 'Descargar CV',
    },
    port: {
      eyebrow: 'Portfolio',
      title: 'Proyectos open source',
      sub: 'Repositorios que mantengo o en los que contribuyo. Cada uno enlaza al código y a su documentación.',
      allRepos: 'Todos los repos →',
    },
    flag: {
      badge: 'Proyecto principal · maintainer',
      lang: 'multi-agente',
      desc: 'Orquestación de equipos de agentes de IA: un árbol de agentes en tiempo real con routing, telemetría y harness configurable (prompt, skills, herramientas). El proyecto en el que más estoy trabajando ahora mismo.',
    },
    veta: {
      desc: 'Framework agéntico bajo la organización Veta: construcción y coordinación de agentes de IA en Python. Proyecto en desarrollo activo.',
    },
    cco: {
      desc: 'Continuous Cloud Optimization: dashboard de Power BI y guías para optimización continua, gobernanza y FinOps en Azure. Mantengo el proyecto bajo la organización Azure.',
    },
    foot: { code: 'Código →', docs: 'Documentación →', role: 'Cloud Solution Architect' },
    star: {
      eyebrow: 'Starred',
      title: 'Proyectos que sigo',
      sub: 'Repos con estrella en mi GitHub — sobre todo sistemas multi-agente, herramientas de IA e infraestructura que uso o me inspiran.',
      all: 'Todas mis estrellas →',
    },
    cv: {
      eyebrow: 'Currículum',
      title: 'CV online',
      sub: 'Versión online navegable en dos formatos: uno corto de una página y uno extendido con los proyectos desglosados.',
      onlineTitle: 'Versión online',
      onlineText:
        'El mismo CV en formato web, minimalista y navegable. Ideal para compartir por enlace sin descargar nada.',
      short: 'CV corto →',
      extended: 'CV extendido →',
      dlShortT: 'CV — versión corta',
      dlShortS: 'Versión web · 1 página',
      dlExtT: 'CV — versión extendida',
      dlExtS: 'Versión web · 3 páginas',
      idxT: 'Índice de versiones',
      idxS: 'Comparar corto vs. extendido',
    },
    posts: {
      eyebrow: 'Aprendizajes',
      title: 'Cosas que voy aprendiendo',
      sub: 'Notas cortas sobre lo que estoy explorando: cloud, IA, arquitectura y herramientas.',
      fAll: 'Todos',
      all: 'Todos mis posts →',
    },
    labs: {
      eyebrow: 'Experimentos',
      title: 'Laboratorio de IA local',
      sub: 'Pruebas y prototipos, sobre todo con modelos que corren en local: inferencia en edge, agentes, RAG offline.',
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
      cv: 'Résumé',
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
      ctaCv: 'Download résumé',
    },
    port: {
      eyebrow: 'Portfolio',
      title: 'Open source projects',
      sub: 'Repositories I maintain or contribute to. Each one links to the code and its documentation.',
      allRepos: 'All repos →',
    },
    flag: {
      badge: 'Flagship project · maintainer',
      lang: 'multi-agent',
      desc: "Orchestration of AI agent teams: a real-time agent tree with routing, telemetry and a configurable harness (prompt, skills, tools). The project I'm working on the most right now.",
    },
    veta: {
      desc: 'Agentic framework under the Veta organization: building and coordinating AI agents in Python. Under active development.',
    },
    cco: {
      desc: 'Continuous Cloud Optimization: a Power BI dashboard and guidance for continuous optimization, governance and FinOps on Azure. I maintain the project under the Azure organization.',
    },
    foot: { code: 'Code →', docs: 'Documentation →', role: 'Cloud Solution Architect' },
    star: {
      eyebrow: 'Starred',
      title: 'Projects I follow',
      sub: "Repos I've starred on GitHub — mostly multi-agent systems, AI tooling and infrastructure I use or that inspire me.",
      all: 'All my stars →',
    },
    cv: {
      eyebrow: 'Résumé',
      title: 'Online résumé',
      sub: 'A browsable online version in two formats: a one-page short version and an extended one with projects broken down.',
      onlineTitle: 'Online version',
      onlineText:
        'The same résumé in a minimal, browsable web format. Ideal to share by link without downloading anything.',
      short: 'Short résumé →',
      extended: 'Extended résumé →',
      dlShortT: 'Résumé — short version',
      dlShortS: 'Web version · 1 page',
      dlExtT: 'Résumé — extended version',
      dlExtS: 'Web version · 3 pages',
      idxT: 'Version index',
      idxS: 'Compare short vs. extended',
    },
    posts: {
      eyebrow: 'Learnings',
      title: "Things I'm learning",
      sub: "Short notes on what I'm exploring: cloud, AI, architecture and tooling.",
      fAll: 'All',
      all: 'All my posts →',
    },
    labs: {
      eyebrow: 'Experiments',
      title: 'Local AI lab',
      sub: 'Tests and prototypes, mostly with models running locally: edge inference, agents, offline RAG.',
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
      o2: 'Résumé',
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
