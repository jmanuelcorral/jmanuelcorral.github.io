// Copy for the interactive terminal simulator. Every string the CLI can
// print lives here; the component holds none of its own text.
import type { Locale } from '../lib/i18n';

export interface CliCopy {
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
}

export const CLI_COPY: Record<Locale, CliCopy> = {
  es: {
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
  en: {
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
};
