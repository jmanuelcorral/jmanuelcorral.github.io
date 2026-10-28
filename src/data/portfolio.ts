// Portfolio data for the home "Open source" section. Each repo is declared
// once here — URL, language, tags, stars, badge and the localized card copy
// travel together — so the component maps over the list instead of pasting
// the same repository URL two or three times per card.
import type { Locale } from '../lib/i18n';

/** A string authored in every locale the site ships. */
export type Localized = Record<Locale, string>;

export interface FeaturedRepo {
  /** Card styling: 'flag' is the highlighted primary card. */
  variant: 'flag' | 'maint';
  name: string;
  url: string;
  /** Omitted when the repo has no separate docs anchor. */
  docsUrl?: string;
  language: Localized;
  languageClass: 'st-exp' | 'st-maint';
  badge: Localized;
  badgeClass: string;
  /** The flagship card shows the GitHub mark beside the repo name. */
  showIcon: boolean;
  tags: string[];
  /** Shown in the card footer instead of a docs link when present. */
  stars?: string;
  desc: Localized;
}

export const FEATURED_REPOS: FeaturedRepo[] = [
  {
    variant: 'flag',
    name: 'bond',
    url: 'https://github.com/jmanuelcorral/bond',
    docsUrl: 'https://josecorral.dev/bond/',
    language: { es: 'TypeScript', en: 'TypeScript' },
    languageClass: 'st-exp',
    badge: { es: 'Proyecto principal · maintainer', en: 'Flagship project · maintainer' },
    badgeClass: 'badge',
    showIcon: true,
    tags: ['agents', 'cli', 'herdr', 'worktrees'],
    desc: {
      es: 'Tus agentes de código, trabajando juntos: configura una vez por repo a pi, Claude Code, Codex, Copilot, opencode, Crush o Gemini, ábrelos en Herdr y reparte el trabajo entre varios agentes, cada uno en su rama y su worktree.',
      en: 'Your coding agents, working together: configure pi, Claude Code, Codex, Copilot, opencode, Crush or Gemini once per repo, open them in Herdr and split the work across several agents, each on its own branch and worktree.',
    },
  },
  {
    variant: 'flag',
    name: 'fluzo',
    url: 'https://github.com/fluzo-labs/fluzo',
    docsUrl: 'https://fluzo-labs.github.io/fluzo-docs/',
    language: { es: 'Rust', en: 'Rust' },
    languageClass: 'st-exp',
    badge: { es: 'Proyecto principal · maintainer', en: 'Flagship project · maintainer' },
    badgeClass: 'badge',
    showIcon: true,
    tags: ['agents', 'rust', 'local-first', 'tui'],
    desc: {
      es: 'Mi entorno de programación agéntica: un runtime local-first escrito en Rust. El MVP, en desarrollo, incluirá CLI/TUI y un agente de código con permisos, presupuestos y cancelación explícitos.',
      en: 'My agentic programming environment: a local-first runtime written in Rust. The MVP, in progress, will include a CLI/TUI and a coding agent with explicit permissions, budgets and cancellation.',
    },
  },
  {
    variant: 'maint',
    name: 'veta-agents',
    url: 'https://github.com/Veta-agentic/veta-agents',
    docsUrl: 'https://github.com/Veta-agentic/veta-agents#readme',
    language: { es: 'Python', en: 'Python' },
    languageClass: 'st-exp',
    badge: { es: 'Maintainer', en: 'Maintainer' },
    badgeClass: 'badge-mini bm-maint',
    showIcon: false,
    tags: ['agents', 'python', 'framework'],
    desc: {
      es: 'Framework agéntico bajo la organización Veta: construcción y coordinación de agentes de IA en Python. Proyecto en desarrollo activo.',
      en: 'Agentic framework under the Veta organization: building and coordinating AI agents in Python. Under active development.',
    },
  },
  {
    variant: 'maint',
    name: 'CCOInsights',
    url: 'https://github.com/Azure/CCOInsights',
    language: { es: 'Power BI', en: 'Power BI' },
    languageClass: 'st-maint',
    badge: { es: 'Maintainer · Azure', en: 'Maintainer · Azure' },
    badgeClass: 'badge-mini bm-maint',
    showIcon: false,
    tags: ['azure', 'finops', 'governance'],
    stars: '757',
    desc: {
      es: 'Continuous Cloud Optimization: dashboard de Power BI y guías para optimización continua, gobernanza y FinOps en Azure. Mantengo el proyecto bajo la organización Azure.',
      en: 'Continuous Cloud Optimization: a Power BI dashboard and guidance for continuous optimization, governance and FinOps on Azure. I maintain the project under the Azure organization.',
    },
  },
];

/**
 * Repos shown in the "starred" strip. Descriptions stay as plain strings
 * because they are each repo's own blurb rather than site copy that gets
 * translated.
 */
export interface StarredRepo {
  name: string;
  url: string;
  desc: string;
  stars: string;
}

export const STARRED_REPOS: StarredRepo[] = [
  {
    name: 'bradygaster/squad',
    url: 'https://github.com/bradygaster/squad',
    desc: 'AI agent teams for any project',
    stars: '3.2k',
  },
  {
    name: 'microsoft/apm',
    url: 'https://github.com/microsoft/apm',
    desc: 'Agent Package Manager',
    stars: '3.8k',
  },
  {
    name: 'OpenBMB/ChatDev',
    url: 'https://github.com/OpenBMB/ChatDev',
    desc: 'LLM-powered multi-agent collaboration',
    stars: '34k',
  },
  {
    name: 'Stevenic/vectra',
    url: 'https://github.com/Stevenic/vectra',
    desc: 'Base de datos vectorial local para Node.js',
    stars: '633',
  },
  {
    name: 'awesome-cheap-llms',
    url: 'https://github.com/magdalenakuhn17/awesome-cheap-llms',
    desc: 'Reducción de coste en sistemas LLM',
    stars: '88',
  },
  {
    name: 'agent-openai-java-banking',
    url: 'https://github.com/Azure-Samples/agent-openai-java-banking-assistant',
    desc: 'Asistente bancario multi-agente en Java',
    stars: '163',
  },
  {
    name: 'Azure/aoai-apim',
    url: 'https://github.com/Azure/aoai-apim',
    desc: 'Escalar Azure OpenAI con APIM, PTUs y TPMs',
    stars: '116',
  },
  {
    name: 'desktop-assistant',
    url: 'https://github.com/jrubiosainz/desktop-assistant',
    desc: 'Control de Windows con IA (Copilot SDK)',
    stars: '23',
  },
  {
    name: 'jmanuelcorral/squadcenter',
    url: 'https://github.com/jmanuelcorral/squadcenter',
    desc: 'Uso y monitorización de múltiples proyectos squad',
    stars: '21',
  },
];

/** Header links out to the full GitHub views. */
export const GITHUB_LINKS = {
  allRepos: 'https://github.com/jmanuelcorral?tab=repositories',
  allStars: 'https://github.com/jmanuelcorral?tab=stars',
};
