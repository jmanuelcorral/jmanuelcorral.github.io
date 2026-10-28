---
title: 'bond: así he puesto a mis agentes de código a trabajar juntos'
description: 'Cómo nació bond, mi CLI para configurar una vez por repo a pi, Claude Code, Codex, Copilot, opencode, Crush o Gemini y ponerlos a trabajar en equipo con Herdr y worktrees de git. De mi configuración personal a una herramienta instalable en doce días.'
lang: 'es'
translationKey: 'bond'
slug: 'bond-mis-agentes-de-codigo-trabajando-juntos'
pubDate: '2026-10-27T10:00:00+01:00'
tags: ['ai', 'agents', 'herdr', 'cli', 'developer-experience', 'open-source']
category: 'ai'
kind: 'Post · Agentes de desarrollo'
draft: false
---

Si usas más de un agente de código, seguramente conoces esta escena: cinco terminales abiertas, tres ramas a medias y ninguna idea de cuál de ellas lleva diez minutos esperando a que le contestes una pregunta.

A eso súmale que cada agente tiene sus manías. Claude Code quiere un `CLAUDE.md`. pi lee `AGENTS.md`. Copilot busca los servidores MCP en un sitio, opencode en otro y Codex en un tercero, porque la variedad es la sal de la vida. Cambiar de agente significa volver a escribir la misma configuración con otro acento.

Para dejar de hacer de traductor y de recepcionista a la vez he construido **[bond](https://josecorral.dev/bond/)**: una herramienta de línea de comandos que te deja declarar una vez lo que quieres en tu repo y abre a tus agentes en un puesto de trabajo donde puedes ver quién está trabajando, quién ha terminado y quién te necesita.

Su lema es *licence to code*. Sí, hay un 007 escondido en el logo. No, no me arrepiento.

En este artículo te cuento qué hace, cómo funciona por dentro y, sobre todo, cómo lo he construido: en doce días, con agentes y siguiendo el mismo método RPI del que te hablé en el [artículo sobre mis skills de desarrollo](/es/blog/mis-skills-desarrollo-diario-con-agentes/).

## Vale, pero ¿qué es bond?

La versión corta: **un archivo de configuración por repo, traducido al formato de cada agente, y un puesto de trabajo para usarlos juntos**.

La versión un poco más larga se resume en tres comandos:

- **`bond setup`**, una vez por máquina. Comprueba que tienes Herdr, detecta tus modelos (Ollama, LM Studio, OpenAI o cualquier pasarela compatible con su API) y deja listos los agentes que uses.
- **`bond init`**, una vez por repo. Eliges agentes, servidores MCP, skills y comandos, y bond escribe la configuración de cada agente a partir de un único `.bond/bond.toml`.
- **`bond`**, el de todos los días. Abre tu repo en Herdr con tu agente favorito. Y si hay mucho trabajo, `bond team` lo reparte entre varios agentes, cada uno en su rama.

Encima hay una cuarta pieza para equipos: los **catálogos**, un repo con las skills, comandos y servidores MCP del equipo, con la versión fijada. Así todo el mundo trabaja con lo mismo, use el agente que use.

### ¿Y qué es Herdr?

[Herdr](https://herdr.dev) es un multiplexor de terminal pensado para agentes. Si has usado `tmux`, la idea te sonará: varios paneles en una ventana que siguen vivos aunque cierres la terminal. La diferencia es que Herdr sabe que dentro de esos paneles hay agentes y te muestra en una barra lateral su estado. Es la diferencia entre tener cinco pestañas abiertas y tener un tablero donde el que te necesita levanta la mano.

bond no sustituye a Herdr ni a ningún agente. **Es el pegamento**: se encarga de que todos lleguen configurados a la reunión y se sienten donde toca.

## Míralo en acción

Antes de seguir con palabras, el vídeo. Abro bond con Claude en su panel y le pido, en una sola frase, una web muy sencilla: que haga un plan, lo reparta entre dos agentes pi con `bond team` y haga de orquestador.

Lo demás pasa solo: cada agente escribe su página, la tabla en vivo enseña cómo van, Claude revisa, les devuelve dos correcciones, integra en `main` y recoge el equipo. Sin cortes; dura lo que dura.

<video controls muted playsinline preload="metadata" width="1600" height="940" style="display: block; max-width: 100%; height: auto; margin: 0 auto 18px;" aria-describedby="bond-orquestador-caption">
  <source src="/bond-orquestador.mp4" type="video/mp4" />
  Tu navegador no permite reproducir este vídeo. <a href="/bond-orquestador.mp4">Descargar el vídeo de bond en acción</a>.
</video>
<p id="bond-orquestador-caption">Claude orquesta a dos agentes pi: plan, reparto, cuatro paneles a la vez, revisión con correcciones, integración y limpieza. Grabación real de 2 minutos y 42 segundos, sin audio.</p>

En la [web de bond](https://josecorral.dev/bond/) hay cuatro vídeos más, cortos, grabados sobre un proyecto real en Rust.

## Empezó siendo mi configuración de pi

bond no nació como producto. Nació como una carpeta llamada `piSetup` donde guardaba mi configuración de [pi](https://pi.dev), un par de scripts en bash para abrir sesiones en Herdr y una línea de estado para saber en qué panel estaba cada agente. Lo típico que uno se monta para sí mismo y jura que algún día ordenará.

El primer commit es del 15 de octubre. El 26 salió la versión 1.6.3. Por el medio pasó bastante:

<figure class="sketch-flow" aria-label="Evolución de bond: de configuración personal a CLI, a producto instalable y a herramienta de equipo">
  <ol role="list">
    <li><strong>15 oct · piSetup</strong><span>Mi config de pi, scripts de Herdr y una línea de estado</span></li>
    <li><strong>16 oct · CLI</strong><span>setup, init, sync y traducción a siete agentes</span></li>
    <li><strong>16 oct · 1.0</strong><span>Binario único, instaladores, Homebrew y licencia MIT</span></li>
    <li><strong>20–26 oct · 1.6</strong><span>Windows, bond team, autoactualización y catálogos de equipo</span></li>
  </ol>
  <figcaption>Doce días, catorce versiones publicadas y una conclusión: lo que funciona para ti suele ser una herramienta con ganas de salir de casa.</figcaption>
</figure>

El momento clave fue el 16 de octubre a mediodía. Hasta entonces pi era obligatorio y la instalación enlazaba *mi* configuración personal. Funcionaba, pero solo para mí. Ese día renombré el proyecto a bond, limpié de la documentación todo lo que apuntaba a mi infraestructura y redacté un plan con un objetivo muy concreto: **en la 1.0 ningún agente es obligatorio y nada personal vive en el repo**.

Esa misma tarde salió la 1.0 con instaladores, binario autocontenido y fórmula de Homebrew. Lo sé, suena a que no dormí. Dormí. Los agentes no.

## Un archivo, siete dialectos

El corazón de bond es la traducción. Este es el `.bond/bond.toml` del propio repo de bond:

```toml
agents = ["pi", "claude"]
default_agent = "pi"
mcp = ["context7", "duckduckgo"]
skills = ["code-context", "git-conventional-commit", "plan-create", "plan-execute",
          "issue-refine-github", "delivery-review-github", "release-prepare-github",
          "convention-document", "plan-team"]
commands = ["commit", "handoff", "review"]
```

Con eso, `bond sync` genera lo que espera cada agente. Las instrucciones viven en un único `AGENTS.md`, que pi, Copilot, Codex, opencode, Crush y Gemini ya saben leer. A Claude Code le escribe un `CLAUDE.md` con un bloque que importa `@AGENTS.md`. Las skills viven en `.agents/skills/` y Claude recibe un enlace a cada una en `.claude/skills/`.

Donde la cosa se pone creativa es con los servidores MCP y los comandos:

| Agente | Servidores MCP | Comandos |
|---|---|---|
| pi | `.pi/mcp.json` | Vía Bond Extensions y `.pi/prompts/` |
| Claude Code | `.mcp.json` | `.claude/commands/` |
| Copilot CLI | El mismo `.mcp.json` | Lee los de Claude como skills |
| opencode | `opencode.json` | `.opencode/commands/` |
| Crush | `.crush.json` | No tiene comandos de proyecto |
| Codex | Bloque en `.codex/config.toml` | No tiene comandos de proyecto |
| Gemini | `.gemini/settings.json` | `.gemini/commands/*.toml` |

Y los comandos, por cierto, reciben argumentos en cuatro sintaxis distintas: `$ARGUMENTS`, `$1`, `$NAME` y `{{args}}`. Si alguna vez te has preguntado por qué los estándares abiertos importan, aquí tienes una tabla entera de motivos.

### Generar archivos sin pisar los tuyos

Un generador de configuración que te borra tus cambios dura instalado lo que tardas en descubrirlo. Por eso bond guarda en `.bond/manifest.json` una huella de cada archivo que genera:

- **Si has editado a mano un archivo generado, no lo toca.** Lo marca con `!` y te avisa. Con `--force` lo sobrescribe, pero deja una copia `.bak`.
- **En los JSON compartidos solo reescribe sus propias claves.** Lo que hayas añadido tú se queda.
- **Todo se commitea.** Si alguien clona el repo sin tener bond, sus agentes siguen encontrando su configuración.

Los secretos se escriben siempre como `${VARIABLE}`. Ni bond ni el repo tienen por qué conocer tu token.

## bond team: worktrees, minions y una tabla que levanta la mano

La parte que más disfruto usar es `bond team`:

```bash
bond team feat/cabecera feat/pie:claude --base main
```

Para cada rama crea un **worktree de git**: una carpeta aparte con su propia copia de trabajo, enlazada al mismo repositorio. Así cada agente trabaja en su rama sin pisar los archivos de los demás. Es la diferencia entre darle a cada albañil su habitación o meterlos a todos en el mismo baño.

Cada agente se abre en un panel debajo del tuyo. Tú eres `gru`, y los demás se llaman kevin, stuart, bob… Ya que iba a tener minions, que por lo menos se llamaran como tales. Por defecto usan el agente del repo, pero puedes elegir uno por rama con el sufijo `:claude`, `:codex` o el que quieras.

A la derecha aparece una tabla que se refresca cada dos segundos y agrupa las ramas por estado:

- ⛔ **Te necesita**, con la pregunta que tiene pendiente.
- 🔄 **Trabajando**.
- ✏️ **Sin commitear**.
- 📦 **Para revisar**.
- ✅ **Integrada**.

Detectar «integrada» tiene más miga de la que parece. Una rama puede llegar a `main` por fast-forward, por merge, por rebase o por squash, y cada caso deja un rastro distinto en git. La versión 1.6.3 salió precisamente para arreglar uno de esos casos. Cuando ya no queda trabajo pendiente, la tabla se cierra sola y `bond team clean` recoge los worktrees integrados.

Hay una decisión que considero importante: **bond nunca hace merge, rebase ni push**. Integrar lo haces tú, o el agente orquestador si se lo pides, como en el vídeo. La herramienta organiza el equipo; no decide por ti qué entra en `main`.

Si no quieres un equipo sino una consulta puntual, la skill `bond-delegate` abre un agente hermano en otro panel, le pasa una tarea concreta y trae el resultado. «Pídele a Claude que revise esto» sin cambiar de ventana. Eso sí, nunca contesta en tu nombre las preguntas del otro agente.

## Construido con agentes, pero con plano

Aquí viene la parte que más me apetecía contar. bond lo he construido **trabajando con agentes**: ha sido la suma de Claude, Copilot y Qwen3.8-Flash, este último corriendo en local en mi [stack de IA local](/es/blog/menos-espera-mas-agentes-stack-ia-local/), todos coordinados con el propio bond. En las últimas fases, buena parte del trabajo lo hacían minions en worktrees… gestionados por la misma herramienta que estaban construyendo.

Pero no fue un «hazme una CLI chula» y a esperar. Seguí el mismo ciclo RPI que te conté en el [artículo anterior](/es/blog/mis-skills-desarrollo-diario-con-agentes/): **investigar, planificar, implementar**, con revisiones mías entre medias.

Cada cambio grande tiene su plan en `docs/plans/`, con:

- **Contexto verificado.** Por ejemplo, qué archivos lee de verdad cada agente, comprobado contra los binarios instalados. No lo que creía recordar.
- **Decisiones con fecha.** En el plan de catálogos hay diez decisiones numeradas, aprobadas antes de escribir código.
- **Fases con criterios de aceptación.** Qué se entrega, cómo se comprueba y qué queda fuera.
- **Una tabla de progreso** donde cada fase pasa por implementada, verificada y aceptada. Y «aceptada» solo la marco yo, con el commit y las pruebas como evidencia.

Las skills que lo hacen posible (`plan-create`, `plan-execute`, la de commits convencionales…) son las de [common-skills](https://github.com/fluzo-labs/common-skills), importadas y adaptadas para que vengan con bond. Y aquí la historia se muerde la cola de forma bastante satisfactoria: cuando bond tuvo `bond team`, añadí `plan-team`, una skill que coge las fases independientes de un plan y las reparte entre minions. A partir de ahí, varias fases del propio bond se implementaron en paralelo con bond.

Que una herramienta se use a sí misma para construirse tiene un nombre muy poco glamuroso en inglés: *dogfooding*, comerte tu propia comida de perro. Pero es la mejor prueba que conozco. Si algo es incómodo, lo sufres tú primero. Varias mejoras de la tabla de equipo salieron literalmente de mirarla mientras trabajaba en otro proyecto y pensar «esto no me dice lo que necesito saber».

## Lo que aprendí por el camino

Algunos tropiezos merecen quedar por escrito, aunque solo sea para no repetirlos:

- **Windows tiene opiniones.** Los enlaces simbólicos no siempre se pueden crear, los ejecutables se llaman `claude.cmd` o `codex.exe`, y una misma carpeta puede aparecer con su nombre corto 8.3 (`RUNNER~1`) o el largo. Acabé copiando en vez de enlazar, guardando las rutas del manifiesto con barras normales para que un repo sincronizado en Windows funcione en Linux, y con una CI que compila y prueba el binario en Linux, macOS y Windows.
- **Los modelos pequeños prefieren herramientas a instrucciones.** Probando con un modelo local, ignoraba la skill que explicaba cómo mapear el repo y se ponía a contar archivos con `git log`, mal. Convertirla en una herramienta, `repo_map`, lo arregló. A un modelo pequeño le cuesta decidir que debe abrir un manual; un botón con nombre claro lo pulsa sin problema.
- **Un diálogo de confianza puede comerse tu primera tarea.** Al abrir un agente en un worktree nuevo, pi preguntaba si confiaba en la carpeta. Herdr lo veía libre, le mandaba la tarea, y la tarea acababa respondiendo a ese diálogo. Ahora el worktree hereda la confianza que ya hubieras dado al repo principal.
- **Los nombres importan.** El servidor de búsqueda web se llamaba `web` hasta que descubrí que OpenAI reserva ese espacio de nombres. Ahora se llama `duckduckgo`, que además dice mejor lo que es.

## Qué está probado y qué no quiero prometer

Prefiero dejar los límites claros:

- **Codex y Gemini:** su configuración se genera a partir de su documentación y se valida, pero todavía no la he probado a fondo con esos agentes. pi, Claude Code y Copilot son los que más uso.
- **Modelos locales:** bond puede llevar tus modelos a pi, opencode, Crush, Codex y Copilot. Claude Code y Gemini solo hablan la API de su proveedor, así que con ellos no hay magia que valga.
- **Idioma:** los mensajes de la CLI están en español. La documentación tiene versión en inglés y lo avisa.
- **Distribución:** hay instaladores para Linux, macOS y Windows y fórmula de Homebrew. Los paquetes de npm y AUR están preparados, pero no publicados.
- **Integración:** como te decía, bond no integra ramas por ti. Es una decisión, no una carencia.

## Instálalo

```bash
brew install jmanuelcorral/tap/bond                                                    # macOS y Linux
curl -fsSL https://raw.githubusercontent.com/jmanuelcorral/bond/main/install.sh | sh   # sin Homebrew
```

En Windows:

```powershell
powershell -ExecutionPolicy Bypass -c "irm https://raw.githubusercontent.com/jmanuelcorral/bond/main/install.ps1 | iex"
```

Después, `bond setup` y a correr. Los instaladores comprueban la suma SHA-256 del binario que descargan, pero el consejo de siempre sigue en pie: **antes de mandar un script de internet a tu shell, échale un vistazo**. Son unas sesenta líneas; se leen en un café.

La [guía de primeros pasos](https://josecorral.dev/bond/getting-started) te lo cuenta paso a paso, y el código está en [github.com/jmanuelcorral/bond](https://github.com/jmanuelcorral/bond) con licencia MIT. Si algo falla o se te ocurre una mejora, abre una issue: se agradece de verdad.

## Licencia para programar

Cuando escribí sobre mi [stack de IA local](/es/blog/menos-espera-mas-agentes-stack-ia-local/), el objetivo era esperar menos para poner agentes a trabajar. Con las skills buscaba que trabajaran con un método. bond es la tercera pata: que puedan **trabajar juntos** sin que yo tenga que hacer de centralita.

No es un piloto automático. Sigo planificando, revisando y decidiendo qué entra en `main`. Lo que ha cambiado es todo lo de alrededor: ya no reescribo la misma configuración en siete formatos, ni busco entre cinco terminales a quién le toca hablar.

Ellos programan. Yo sigo siendo quien firma la licencia.
