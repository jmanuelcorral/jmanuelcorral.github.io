---
title: 'Un hub para coordinar agentes en varios repositorios con bond'
description: 'Cómo funciona el modo hub de bond: un proyecto repartido entre repos, una rama vertical y un agente por repositorio, coordinados desde un solo sitio.'
lang: 'es'
translationKey: 'bond-modo-hub'
slug: 'bond-modo-hub-varios-repositorios'
pubDate: '2026-11-04T10:00:00+01:00'
tags: ['ai', 'agents', 'herdr', 'cli', 'developer-experience', 'open-source']
category: 'ai'
kind: 'Post · Agentes de desarrollo'
draft: false
---

En el [artículo anterior sobre bond](/es/blog/bond-mis-agentes-de-codigo-trabajando-juntos/) te enseñé a repartir trabajo entre agentes dentro de un repositorio. Para mí, eso sería el nivel 1 de cualquier proyecto al que me enfrento en mi día a día; lo normal en mi caso es trabajar con soluciones multi-repo. El frontend está en un repo, la API en otro y la librería compartida en un tercero. Entonces llega una tarea aparentemente inocente: «añade este campo al perfil». Y resulta que el campo tiene que aparecer en tres sitios, hablar con dos servicios y, por alguna razón, sobrevivir a una migración.

Podría abrir un equipo por repo, crear ramas a mano y copiar la tarea en cada terminal. También podría confiar en que cada agente adivine qué está haciendo el otro. Lo primero me convierte en centralita; lo segundo, en espiritista. Ninguno era el flujo que quería.

Así nació el **modo hub de bond**: un repositorio de operaciones que reúne varios repos y permite coordinar un agente por repo desde una sesión de [Herdr](https://herdr.dev). No convierte el proyecto en un monorepo ni hace falta mudar el código. Ya hay suficientes mudanzas en cualquier proyecto como para organizar otra porque sí. El hub añade una descripción común y una manera de trabajar con esos repos como un conjunto.

## Qué es un hub

Un **hub es un repositorio git compartido que describe una sesión de varios repositorios**. En su raíz vive `hub.toml`, donde declaro los repos del proyecto, sus ramas base y el agente que usa cada uno. Los repos se montan como submódulos si quiero compartir el conjunto con el equipo, o como enlaces simbólicos a clones que ya tengo en mi máquina.

Cada repo conserva su historia, su remoto y su vida independiente. No los pego en un monorepo con cinta aislante. El hub es el plano: dice qué piezas forman el proyecto y cómo se relacionan, mientras cada repo sigue en su casa.

<figure style="margin: 28px 0;">
  <svg viewBox="0 0 700 325" role="img" aria-labelledby="hub-tree-title-es hub-tree-desc-es" style="display: block; width: 100%; height: auto;">
    <title id="hub-tree-title-es">Estructura de carpetas de un hub de bond</title>
    <desc id="hub-tree-desc-es">El hub contiene hub.toml, AGENTS.md, la carpeta repos con frontend y backend, y la carpeta docs con planes.</desc>
    <g fill="none" stroke="var(--muted)" stroke-width="2">
      <path d="M350 74v34M90 108h510M90 108v24M260 108v24M430 108v24M600 108v24" />
      <path d="M430 188v28M370 216h120M370 216v30M490 216v30M600 188v28h25v30" />
    </g>
    <g font-family="var(--font-mono, monospace)" text-anchor="middle">
      <g>
        <rect x="240" y="16" width="220" height="58" rx="13" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="2" />
        <text x="350" y="40" fill="var(--muted)" font-size="11" letter-spacing="1.5">HUB</text>
        <text x="350" y="60" fill="var(--fg)" font-size="17" font-weight="700">mi-hub/</text>
      </g>
      <g>
        <rect x="18" y="132" width="144" height="56" rx="11" fill="var(--surface)" stroke="var(--indigo)" stroke-width="2" />
        <text x="90" y="154" fill="var(--muted)" font-size="10" letter-spacing="1">CONFIG</text>
        <text x="90" y="176" fill="var(--fg)" font-size="15" font-weight="700">hub.toml</text>
      </g>
      <g>
        <rect x="188" y="132" width="144" height="56" rx="11" fill="var(--surface)" stroke="var(--indigo)" stroke-width="2" />
        <text x="260" y="154" fill="var(--muted)" font-size="10" letter-spacing="1">INSTRUCCIONES</text>
        <text x="260" y="176" fill="var(--fg)" font-size="14" font-weight="700">AGENTS.md</text>
      </g>
      <g>
        <rect x="358" y="132" width="144" height="56" rx="11" fill="var(--surface)" stroke="var(--accent)" stroke-width="2" />
        <text x="430" y="154" fill="var(--muted)" font-size="10" letter-spacing="1">REPOSITORIOS</text>
        <text x="430" y="176" fill="var(--fg)" font-size="15" font-weight="700">repos/</text>
      </g>
      <g>
        <rect x="528" y="132" width="144" height="56" rx="11" fill="var(--surface)" stroke="var(--accent)" stroke-width="2" />
        <text x="600" y="154" fill="var(--muted)" font-size="10" letter-spacing="1">DOCUMENTACIÓN</text>
        <text x="600" y="176" fill="var(--fg)" font-size="15" font-weight="700">docs/</text>
      </g>
      <g>
        <rect x="310" y="246" width="120" height="58" rx="11" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="2" />
        <text x="370" y="268" fill="var(--muted)" font-size="10" letter-spacing="1">FRONTEND</text>
        <text x="370" y="290" fill="var(--fg)" font-size="14" font-weight="700">frontend/</text>
      </g>
      <g>
        <rect x="430" y="246" width="120" height="58" rx="11" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="2" />
        <text x="490" y="268" fill="var(--muted)" font-size="10" letter-spacing="1">BACKEND</text>
        <text x="490" y="290" fill="var(--fg)" font-size="14" font-weight="700">backend/</text>
      </g>
      <g>
        <rect x="555" y="246" width="140" height="58" rx="11" fill="var(--indigo-soft)" stroke="var(--indigo)" stroke-width="2" />
        <text x="625" y="268" fill="var(--muted)" font-size="10" letter-spacing="1">PLANES</text>
        <text x="625" y="290" fill="var(--fg)" font-size="14" font-weight="700">plans/</text>
      </g>
    </g>
  </svg>
  <figcaption style="margin-top: 12px; color: var(--muted); text-align: center; font-size: 12px;">El hub reúne la configuración, las instrucciones, los repositorios y la documentación que comparten.</figcaption>
</figure>

Bond escribe en el `AGENTS.md` del hub un bloque con la lista de repos y las reglas para el orquestador. El agente tiene el mapa antes de salir a preguntar dónde está la API. El resto del archivo sigue siendo mío: bond respeta lo que escribo fuera de su bloque, una cortesía que procuro devolverle.

## La rama vertical: mismo cambio, varios repos

En el modo normal, `bond team` crea una rama y un worktree por agente: cada minion se ocupa de una tarea independiente. En un hub, la unidad de trabajo cambia: **una rama vertical representa una tarea que cruza varios repositorios**. El mismo cambio, la misma rama, distintas partes del sistema. La geometría de «vertical» se entiende mejor con un ejemplo; explicar ramas con otra metáfora suele acabar en servilletas.

Una vez preparado el hub, puedo darle al agente orquestador **una sola instrucción** para que abra el equipo, reparta una tarea de principio a fin y revise el resultado: una petición, un agente por repo y yo siguiendo cómo se coordinan.

En mi forma de trabajar con un hub, **siempre hay un agente activo en el propio repo del hub**: es quien lleva la orquestación. En cada repo, un agente de implementación se ocupa del desarrollo y las pruebas; en mi configuración, otro revisa el resultado. Un agente por repo es lo mínimo que permite el hub, no el tamaño obligatorio del equipo.

En un proyecto que estoy desarrollando ahora en el trabajo, Claude Opus se queda al mando de la orquestación. En cada repo trabaja Claude Sonnet o un agente de Antigravity, que implementa y prueba los cambios; además, un agente de pi con modelos locales revisa el resultado. La estructura se repite en cada repo:

Bond aporta el mapa y el equipo mínimo para trabajar entre repos; después puedo repartir papeles y modelos según la tarea. No hace falta que todos lleven el mismo uniforme. Bastante tienen con compartir el `git status`.

<figure class="sketch-flow" aria-label="Capas de agentes en un hub: Claude Opus orquesta desde el hub; en cada repo, Sonnet o Antigravity desarrolla y prueba, y pi con modelos locales revisa">
  <ol role="list">
    <li><strong>Hub · Claude Opus</strong><span>Un agente activo orquesta la tarea completa</span></li>
    <li><strong>La misma rama en cada repo</strong><span>Bond prepara un worktree en cada repositorio implicado</span></li>
    <li><strong>Sonnet o Antigravity</strong><span>En cada repo: desarrollo y pruebas</span></li>
    <li><strong>pi · modelo local</strong><span>En cada repo: revisión del resultado</span></li>
  </ol>
  <figcaption>La primera tarjeta vive en el repo del hub. Las dos últimas se repiten en cada repo de la tarea: Opus coordina, los agentes de implementación construyen y prueban, y pi revisa.</figcaption>
</figure>

La petición llega a los agentes de la rama con contexto sobre su repo y sus compañeros. Así, el agente del frontend sabe que el backend también está trabajando en la tarea, y ambos pueden acordar el endpoint y el formato de respuesta. No es telepatía: un poco de contexto sale más barato que depurar dos interpretaciones muy creativas de «el mismo contrato».

Herdr abre un panel de estado para toda la sesión. No tengo que peregrinar por cada terminal para averiguar quién ha terminado y quién lleva cinco minutos esperando a que le confirme que sí, puede leer el archivo. Al final, `bond team collect` recoge informes y commits de cada repo; `bond team clean` retira los worktrees. Los commits no desaparecen. Los minions vuelven a su cajón; el trabajo se queda.

Hay una regla deliberada: solo puede haber **una rama vertical activa a la vez** en un hub. Los cambios entre repos suelen depender unos de otros; abrir varias verticales a la vez puede convertir el tablero en una reunión de coordinación a la que nadie pidió asistir. Dentro de una vertical sí puedo elegir qué repos participan.

## Dejarlo preparado sin aprender otra herramienta

No hace falta crear todo a mano. `bond hub init` guía el proceso de forma interactiva: crea el hub, añade repos por URL o desde clones locales y prepara los que aún no usan bond. También puedes pasarle todos los datos de una vez y usar `--yes`, como en un script. Después `bond hub check` revisa enlaces, ramas base y configuración de agentes. Con `--fix` puede arreglar las cosas seguras. Las demás te las cuenta; también hay que dejarle alguna decisión a una persona.

`bond hub pull` actualiza las ramas base con *fast-forward*: trae lo remoto y avanza cuando se puede, pero no resuelve divergencias. Si un repo tiene cambios locales o su rama se ha separado, lo deja en paz y me avisa. Para integrar las ramas de trabajo, actualizar punteros de submódulos y hacer `push`, sigo al mando. La herramienta coordina; no firma por mí.

Una vez creado, puedo versionar y compartir el hub. Las rutas de los clones locales enlazados se guardan en `.bond/hub.local.toml`, que no se sube al remoto. Compartimos el plano; cada cual pone la dirección de su propia casa. La informática, cuando se lo propone, hasta puede ser razonable.

## El primer problema que me encontré en el trabajo

Los hubs fueron de las primeras cosas con las que me choqué al empezar a usar agentes en mi día a día de trabajo. No era un problema de «cómo lanzo otro agente», sino de cómo organizar una tarea cuando el producto vive repartido en varios repos. El modo hub de bond salió de esa necesidad concreta; no de una pizarra llena de flechas que pidiera a gritos convertirse en producto.

Y hoy desde esos hubs coordino más que cambios de código. También los uso para ordenar despliegues. Por ejemplo, si hay varios componentes que tienen que llegar a desarrollo en una secuencia determinada, puedo pedirle al agente que siga ese orden desde el hub. Una skill mía ejecuta las pipelines de despliegue de GitHub y automatiza los pasos necesarios entre una y otra. Así el orden queda descrito en el procedimiento y no depende de que yo recuerde qué botón tocaba primero después del café.

La skill sabe cómo ejecutar esas pipelines; el hub aporta el contexto del proyecto y el punto desde el que coordino la tarea. No hay un sistema de despliegue secreto dentro de `bond team`: son las piezas habituales —repos, instrucciones y una skill— puestas a trabajar juntas.

## ¿Y GitHub Copilot Projects, Codex o Claude?

La idea de coordinar agentes ya no es exclusiva de una herramienta. GitHub Copilot en su aplicación permite crear un proyecto y que Copilot coordine el trabajo; Codex ofrece chats paralelos y worktrees, y Claude Code tiene subagentes y equipos de agentes. Google Jules también permite lanzar tareas paralelas, aunque Google ha anunciado que el servicio se apagará el 31 de diciembre de 2026. Cada producto sigue evolucionando y sus opciones concretas dependen de la versión y el entorno. ([GitHub Copilot](https://docs.github.com/en/copilot/how-tos/github-copilot-app/working-with-projects), [Codex](https://learn.chatgpt.com/docs/environments/git-worktrees), [Claude Code](https://code.claude.com/docs/en/agent-teams), [Google Jules](https://jules.google/docs/changelog/2026-10-29))

La diferencia que me interesa de bond es más concreta: **un hub describe repos independientes y puede repartir una misma tarea entre agentes de distintos proveedores**. GitHub Projects organiza el trabajo desde GitHub; Codex y Claude ofrecen coordinación en sus propios entornos. Bond parte de una sesión local en Herdr y usa el agente configurado para cada repo. No digo que las otras herramientas no puedan trabajar con varios repos, ni que bond haya descubierto la colaboración en equipo. La gracia es conectar agentes y repos distintos en un mismo flujo sin montar una centralita casera de terminales.

Por ejemplo, el frontend puede usar pi y el backend Claude Code, o ambos pi si quiero mantener el flujo uniforme. Elijo agente por repo en la configuración o lo cambio al lanzar el equipo. Son procesos y worktrees normales; git sigue debajo, con su casco puesto.

## Cuándo tiene sentido

Usaría un hub si una tarea suele tocar piezas que viven en repos separados: frontend y API, servicios con un contrato común, aplicación y librería. También si el equipo quiere mantener los repos independientes y compartir un mapa y planes globales. Es justo mi caso: no quería cambiar la arquitectura de los proyectos para poder coordinar el trabajo.

Si tienes un solo repo, no necesitas un hub. `bond init`, `bond` y `bond team` siguen haciendo su trabajo. Y si la tarea cruza repos pero no se puede dividir con claridad, poner un agente en cada uno no la vuelve paralela por arte de magia. A veces toca definir primero el contrato y luego seguir. En git aún no hay botón de «hazlo simultáneo y que salga bien»; me temo que ese sigue siendo parte del oficio.

## Los agentes trabajan; tú integras

El modo hub facilita empezar y supervisar un cambio que cruza repositorios, pero las decisiones importantes siguen siendo mías. Bond no hace merge, rebase ni push. Los worktrees aíslan los cambios y el panel los hace visibles; comprobar que las piezas encajan sigue siendo trabajo de ingeniería. Los minions ayudan mucho. El criterio técnico, de momento, no cabe en un panel de Herdr.

El código está en [github.com/jmanuelcorral/bond](https://github.com/jmanuelcorral/bond), con licencia MIT. La guía de [modo hub](https://josecorral.dev/bond/puesto#una-rama-vertical-en-un-hub) cuenta los comandos y sus opciones. Y si quieres ver los detalles sin el comentario, también tienes la [referencia](https://josecorral.dev/bond/reference#bond-hub).
