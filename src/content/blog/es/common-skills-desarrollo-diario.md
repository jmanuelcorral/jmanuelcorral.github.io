---
title: 'Aplicando estrategias RPI a mis agentes de desarrollo'
description: 'Cómo he construido common-skills para dejar de repetir instrucciones a mis agentes: de una idea poco clara a un cambio revisado, con ejemplos de uso diario y sin piloto automático mágico.'
lang: 'es'
translationKey: 'common-skills-desarrollo-diario'
slug: 'mis-skills-desarrollo-diario-con-agentes'
pubDate: '2026-09-30T10:00:00+02:00'
tags: ['ai', 'agents', 'skills', 'developer-experience', 'github']
category: 'ai'
kind: 'Post · Agentes de desarrollo'
draft: false
---

Hay una parte de trabajar con agentes de programación que se parece sospechosamente a dar la misma charla de bienvenida todos los días.

«Primero lee el proyecto. No cambies cosas que no te he pedido. Mira si hay pruebas. No hagas un commit todavía. Y no, arreglar un botón no incluye rediseñar la aplicación».

Poner a una IA a escribir código es relativamente fácil. Conseguir que trabaje siguiendo un criterio reconocible ya tiene más entretenimiento. Tú pides cambiar el color de un botón y ella ve una oportunidad para migrar el sistema de diseño. Iniciativa no le falta; lo que le falta es que alguien le quite la maza.

Para no tener que reconstruir esa conversación cada vez, he reunido mi forma de trabajar en [common-skills, la colección de skills de Fluzo](https://github.com/fluzo-labs/common-skills). **Fluzo es mi propio entorno de programación agéntica, un proyecto en el que estoy trabajando.** Más adelante te enseñaré de qué va y cómo lo estoy montando; hoy me centro en una de sus piezas: las skills que utilizo para organizar el proceso de ingeniería del software, desde entender una necesidad hasta planificar, implementar, revisar y preparar una entrega.

Esta colección recoge esa parte del proyecto en instrucciones que también puedo reutilizar fuera de Fluzo. No son siete agentes nuevos ni un framework que haya que desplegar. Son **instrucciones reutilizables para las tareas que se repiten al desarrollar**.

La idea no es dejar de pensar. Es dejar de repetir el mismo prólogo antes de empezar a pensar en lo importante.

## Vale, pero ¿qué es una skill?

Una *skill* es, en este contexto, una pequeña guía que un agente puede cargar cuando necesita hacer una tarea concreta. Le dice cuándo utilizarla, qué información necesita, cómo proceder y cómo comprobar que ha terminado.

Piensa en una receta. «Haz algo rico» deja mucho margen para la creatividad. «Vamos a hacer una tortilla, estos son los ingredientes y esto no se mete en la sartén» reduce algunas sorpresas.

En el repositorio cada skill vive en su propia carpeta, con un archivo principal llamado `SKILL.md`. Puede llevar referencias, plantillas o scripts si los necesita. No hay que llenar todas las carpetas posibles por afición a las carpetas.

**No estoy entrenando el modelo ni instalándole conocimientos permanentes.** Le estoy dando un procedimiento que puede consultar. Que lo descubra y lo utilice depende de la herramienta con la que ejecuto el agente y de su configuración.

Yo lo separo así:

- **Las instrucciones del proyecto**, por ejemplo `AGENTS.md`, explican las reglas de esa casa: estructura, comandos, estilo y cosas que no se deben tocar.
- **La skill** explica cómo abordar una tarea: refinar una issue, ejecutar una fase o preparar una entrega.
- **Mi petición** concreta qué quiero hacer ahora y hasta dónde autorizo llegar.

La receta no tiene permiso para reformar la cocina. Ni para instalar Kubernetes porque la tortilla «necesita escalar».

### Agentes especializados y skills: quién trabaja y cómo trabaja

**Estas skills son transversales al uso de agentes especializados; no los sustituyen.** Puedo tener un agente centrado en arquitectura, otro en frontend y otro en pruebas. Esa especialización define su foco, pero no garantiza por sí sola que investigue antes de cambiar código, respete el alcance o compruebe el resultado.

El agente aporta su especialidad; la skill le da **el procedimiento que debe seguir para la tarea que está realizando**. Por ejemplo, uno de frontend puede usar `plan-execute` para implementar una fase de interfaz, y uno de backend puede seguir la misma skill para una fase de API. Cambian el código y las comprobaciones del proyecto, no la necesidad de leer el contexto, ceñirse a lo aprobado y presentar evidencias.

No significa que todos tengan que ejecutar todas las skills ni que la colección coordine por sí sola un equipo de agentes. Cada uno utiliza las que correspondan a su tarea y sus permisos. Lo que comparto es la forma de trabajar, no una invitación a que tres agentes editen el mismo archivo a la vez y lo llamen colaboración.

Dicho de otra manera: **la especialización responde a «quién se ocupa de esto»; la skill, a «qué pasos debe seguir»**. Poner «arquitecto sénior» en el nombre del agente no hace que lea el repositorio. Ojalá los títulos vinieran con esa funcionalidad de serie.

## La filosofía de fondo: RPI, pensar antes de darle al teclado

Estas skills siguen la filosofía **RPI: Research, Plan, Implement**. En castellano: **investigar, planificar e implementar**. No lo he inventado yo ni hace falta comprar una certificación para entenderlo. Consiste en no empezar por el tercer paso, una tradición informática con muchos seguidores, entre los que tampoco puedo declararme inocente.

El ciclo RPI, de un vistazo. La revisión es el punto de control, no una cuarta letra que se me haya olvidado:

<figure class="sketch-flow" aria-label="Ciclo RPI: investigar, planificar, implementar y revisar para decidir si avanzar o volver atrás">
  <ol role="list">
    <li><strong>R · Research</strong><span>Investigar el proyecto y aclarar dudas</span></li>
    <li><strong>P · Plan</strong><span>Acordar alcance, fases y comprobaciones</span></li>
    <li><strong>I · Implement</strong><span>Ejecutar una fase autorizada y comprobarla</span></li>
    <li><strong>Revisión</strong><span>Contrastar el resultado con lo acordado</span></li>
  </ol>
  <figcaption>Si cambia lo que sabemos, volvemos a Research o Plan. Si la fase se acepta, elegimos la siguiente fase autorizada o cerramos el trabajo. Las flechas marcan el orden, no conceden permisos.</figcaption>
</figure>

Así lo llevo a mi flujo:

| Momento | Qué quiero resolver | Cómo encaja en las skills |
|---|---|---|
| **Research: investigar** | Entender el código existente, las reglas del proyecto, el problema y lo que todavía no sabemos | La lectura del proyecto y el refinamiento con `issue-refine-github`; también el análisis previo de `plan-create` |
| **Plan: planificar** | Decidir qué cambiar, qué dejar fuera y cómo comprobar el resultado | `plan-create`, o el plan aprobado en las issues de GitHub, con fases y criterios claros |
| **Implement: implementar** | Ejecutar el trabajo acordado y verificarlo sin ampliar el alcance por entusiasmo | `plan-execute`, una fase cada vez, con comprobaciones y revisión |

Investigar aquí no significa pasarse media mañana buscando artículos: muchas veces significa abrir el archivo que ya resuelve algo parecido. Una técnica poco futurista, pero sorprendentemente compatible con la inteligencia artificial.

**No son tres casillas que marco una vez y olvido.** Si al implementar aparece algo que desmonta el plan, toca volver a investigar y ajustar lo acordado. No seguir excavando porque ya hemos alquilado la excavadora.

Tampoco todas las skills representan una letra de RPI. Las de commits, entrega, convenciones y releases acompañan ese núcleo: guardan el trabajo, facilitan su revisión y conservan las decisiones. RPI pone el orden; las otras piezas ayudan a que el resultado no se quede viviendo eternamente en una rama llamada `ahora-si-final`.

## Por qué prefiero mi plan al «agente Plan» de la herramienta

Copilot u OpenCode ya ofrecen formas de planificar antes de tocar código. Entonces, ¿por qué hacerme la mía? ¿Síndrome de «eso me lo hago yo en un fin de semana»? Algo de sospecha es razonable, pero aquí no estoy construyendo otro agente: estoy definiendo **qué espero de un plan**, independientemente de quién lo redacte.

Los modos o agentes de planificación que trae cada herramienta son un buen punto de partida. Sus capacidades y restricciones varían según la versión y la configuración; no parto de que sean incapaces de hacer esto. Mi preferencia es no depender de sus instrucciones por defecto ni tener que explicar otra vez mi método cuando cambio de herramienta.

Con `plan-create` dejo explícito que quiero:

- **Contexto antes que una lista bonita:** revisar el proyecto, lo que ya existe y las dudas pendientes antes de proponer cambios.
- **Fases revisables:** alcance, dependencias y criterios de aceptación, no un «implementar la solución» con una casilla al lado. Eso también lo escribo yo, y sin gastar tokens.
- **Un resultado que pueda conservar:** si el plan es local, reviso su contenido y destino antes de guardarlo. Si el trabajo vive en GitHub, sus issues siguen mandando sobre el progreso.
- **Continuidad con la ejecución:** que `plan-execute` reciba una fase concreta, sus límites y sus comprobaciones, en lugar de interpretar libremente la conversación anterior.
- **Separar plan y permiso:** aprobar cómo vamos a hacerlo no significa autorizar un commit, un push o una publicación.

**No es «mi plan es más inteligente», sino «mi procedimiento es explícito, revisable y me lo puedo llevar».** La skill está en archivos que puedo versionar y ajustar. Eso no garantiza respuestas idénticas entre modelos, pero sí me permite mantener las mismas expectativas sin depender del nombre que tenga el botón de planificar.

Además, no son opciones incompatibles: puedo usar un modo de planificación de la herramienta y pedirle que siga mi skill, siempre que pueda cargarla y sus restricciones lo permitan. La herramienta pone el entorno; yo pongo el guion. No necesito dos jefes de obra discutiendo: necesito que alguien lea el plano antes de tirar el tabique.

## Cómo las he construido: pequeñas, concretas y con freno

He organizado la colección alrededor del trabajo, no de personajes. No necesito bautizar a un «arquitecto visionario» y a un «ninja de las releases». Necesito que alguien aclare una tarea, prepare un plan y me enseñe qué ha comprobado.

La plantilla de partida tiene una estructura bastante terrenal:

1. **Nombre y descripción.** Sobre todo, cuándo debe activarse. «Ayuda con GitHub» es demasiado amplio; «revisa si esta issue necesita aclararse o dividirse» ya dice algo.
2. **Requisitos.** Qué herramientas, acceso e información hacen falta. Tener escrito `gh` en una instrucción no instala GitHub CLI ni inicia sesión.
3. **Procedimiento.** Qué debe leer, qué decisiones tomar y qué resultado entregar.
4. **Validación.** Qué comprobar y qué hacer si falta información, falla una prueba o el estado del proyecto ha cambiado.
5. **Límites y continuación.** Dónde debe parar y cuál sería el siguiente paso razonable, sin ejecutarlo por su cuenta.

Los detalles largos van en `references/`, dentro de la propia skill, y el archivo principal indica cuándo consultarlos. Así no convierto cada instrucción en una enciclopedia que el agente tenga que cargar siempre.

También he buscado que **cada carpeta pueda llevarse a otro proyecto**. No debe depender de rutas de mi ordenador ni de archivos escondidos en la carpeta de la skill vecina. Cuando un paso necesita otra skill, la busca por su nombre entre las instaladas; si falta, lo dice. No sale a descargarla por sorpresa.

La colección ha ido incorporando, además del trabajo por fases, el registro de convenciones, recomendaciones concretas para continuar y un modo autónomo acotado. El hilo común es el mismo: **pasar contexto al siguiente paso no equivale a pasarle un cheque en blanco**.

## Las siete piezas, sin aprenderse siete manuales

Los nombres están en inglés porque son los identificadores de las skills. No hace falta hablarles en inglés: las respuestas siguen el idioma y las reglas del proyecto o, si no los hay, los de la petición.

| Skill | Para qué me sirve |
|---|---|
| `issue-refine-github` | Aclarar una tarea de GitHub y decidir si está lista, necesita detalle o conviene dividirla |
| `plan-create` | Convertir un objetivo en un plan local con fases y criterios para saber si está resuelto |
| `plan-execute` | Implementar una sola fase aprobada, comprobarla y mostrar el resultado |
| `git-conventional-commit` | Registrar los cambios revisados con un mensaje de commit coherente, cuando lo pido |
| `delivery-review-github` | Preparar la entrega y su pull request; después de la integración, revisar qué toca |
| `convention-document` | Dejar por escrito una decisión acordada para no volver a discutirla desde cero |
| `release-prepare-github` | Preparar notas de cambios, propuesta de versión y comprobaciones de una release |

Una **issue** es la ficha de una tarea. Una **pull request**, o PR, es la propuesta para revisar e integrar unos cambios. Un **commit** guarda una versión de esos cambios en Git. Son momentos distintos, aunque a veces nos entren ganas de resumirlos todos con un «venga, súbelo».

No paso por las siete skills para cambiar una errata. La idea es quitar trabajo repetitivo, no montar una gestoría para editar una línea.

### El ciclo de vida completo de las skills

Este es el recorrido guiado cuando la tarea pasa por GitHub. Se lee de izquierda a derecha y después continúa en la segunda fila; en móvil, de arriba abajo. No es una cinta transportadora: en las revisiones sigo teniendo que aparecer yo, qué inconveniente.

<figure class="sketch-flow" aria-label="Ciclo de desarrollo con skills: refinar, planificar, ejecutar, revisar, guardar, entregar, verificar el merge y decidir cómo continuar">
  <ol role="list">
    <li><strong>1 · Aclarar</strong><span>issue-<wbr>refine-<wbr>github</span><span>Investigar la issue y proponer alcance</span></li>
    <li><strong>2 · Planificar</strong><span>plan-<wbr>create</span><span>Borrador local opcional; aprobar el plan local o en GitHub</span></li>
    <li><strong>3 · Implementar</strong><span>plan-<wbr>execute</span><span>Una fase autorizada, pruebas y progreso</span></li>
    <li><strong>4 · Revisar</strong><span>Revisión humana</span><span>Examinar diff y evidencias; corregir si hace falta</span></li>
  </ol>
  <p>Después de revisar, la entrega continúa solo con las autorizaciones correspondientes:</p>
  <ol role="list" start="5">
    <li><strong>5 · Guardar</strong><span>git-<wbr>conventional-<wbr>commit</span><span>Commit local solicitado; todavía sin push</span></li>
    <li><strong>6 · Entregar</strong><span>delivery-<wbr>review-<wbr>github</span><span>Proponer push y PR; publicar solo lo autorizado</span></li>
    <li><strong>7 · Integrar</strong><span>Revisión y merge por separado</span><span>delivery-<wbr>review-<wbr>github verifica después el merge y el estado real</span></li>
    <li><strong>8 · Continuar o cerrar</strong><span>Siguiente fase, fin o release-<wbr>prepare-<wbr>github si toca preparar versión</span><span>Publicar la release requiere otra autorización</span></li>
  </ol>
  <figcaption>El ciclo vuelve a la siguiente fase elegible del plan; si necesita aclaraciones, vuelve al refinamiento. Recomendar el siguiente paso no lo ejecuta. En cualquier etapa, convention-document puede registrar un acuerdo confirmado y devolvernos al punto pendiente. Si el trabajo es solo local, omitimos push, PR y merge.</figcaption>
</figure>

## Mi día a día, contado con una tarea pequeña

Para aterrizar cómo las utilizo, voy a seguir un ejemplo ficticio: **añadir un filtro de etiquetas al listado de artículos**. No es una entrega real ni una medición de productividad; es una forma de recorrer el flujo sin enseñar un backlog privado.

Las frases siguientes son mensajes para el agente, no comandos de terminal. Las envío por separado, después de revisar el resultado anterior.

### 1. Antes de picar código, aclarar qué estamos pidiendo

Una issue que diga «añadir filtros» puede esconder cinco interpretaciones distintas. ¿Una etiqueta o varias? ¿Qué pasa si no hay resultados? ¿También en móvil? Dos palabras de requisito y ya tenemos material para una trilogía.

> Usa issue-refine-github para revisar esta issue. Propón alcance y criterios de aceptación. No modifiques GitHub todavía.

Lo útil no es que produzca más texto. Es que saque a la luz las decisiones que, de otro modo, acabarían apareciendo a mitad del código.

Si la tarea ya está clara y es pequeña, no necesito convertirla en una saga de doce issues. Si es grande, sí puede proponer dividirla. **Proponer no es crear esas tareas automáticamente.**

### 2. Hacer un plan que se pueda revisar

Cuando necesito un borrador local, recurro a `plan-create`:

> Usa plan-create para planificar este filtro. Incluye comportamiento esperado, archivos afectados y comprobaciones. Enséñame el plan antes de guardarlo.

Aquí busco trozos de trabajo que tengan sentido por sí mismos. «Hacer el frontend» no me ayuda mucho. «Filtrar por una etiqueta, permitir quitar el filtro y mostrar el estado vacío» ya es algo que puedo revisar.

Si el trabajo está gestionado en GitHub, las issues siguen siendo la referencia del progreso. El documento local puede ayudar a pensar, pero no quiero dos listas de tareas contando historias distintas. Para universos paralelos ya tengo las estimaciones y el calendario.

### 3. Ejecutar una parte, no aprovechar para arreglar el mundo

Con el plan revisado y guardado en la ubicación acordada:

> Usa plan-execute para implementar solo P1 del plan aprobado. Ejecuta las comprobaciones del proyecto y muestra qué has cambiado. No hagas commit ni publiques nada.

La skill lee el contexto, comprueba dependencias, trabaja en esa fase y presenta evidencias. En un plan local autorizado también actualiza el progreso de esa fase.

Para mí hay tres estados que conviene no mezclar: **implementado, comprobado y aceptado por una persona**. Que el agente marque una tarea hecha no significa que yo haya revisado el comportamiento. Y «no he podido ejecutar las pruebas» no es una versión creativa de «todo está en verde».

Además, comprobar no siempre significa lanzar el mismo comando. En este blog los controles son `npm run check`, `npm run validate:content` y `npm run build`. En otro proyecto serán los que ese proyecto tenga definidos. La skill debe adaptarse, no imponer su stack favorito.

### 4. Revisar, guardar y preparar la entrega

Después de una fase con cambios, el flujo ofrece tres propuestas de mensaje de commit usando la skill correspondiente. Leo el diff, reviso las comprobaciones y elijo cuando estoy conforme:

> Haz commit con la opción 2 usando git-conventional-commit, solo con los cambios revisados. No hagas push.

El commit es local. Publicar la rama es otra decisión. Para preparar ese siguiente paso:

> Usa delivery-review-github para proponer el push, la PR y la actualización de la issue. Enséñame destino, contenido y evidencias antes de publicar.

Así reviso tanto el código como la historia que estamos contando sobre él. «Pruebas pasadas» tiene que corresponder a pruebas ejecutadas, y una PR intermedia no debería dar por terminado todo el proyecto.

Publicar requiere autorizar las operaciones concretas. Integrar la PR sigue siendo otra decisión. Cuando ya está integrada, puedo pedir que se verifique el merge y se recomiende la siguiente issue pendiente, priorizando las fases del plan actual. **Recomendarla no significa empezar a implementarla.**

## Las otras dos cosas que no quiero improvisar

### Los acuerdos que se evaporan al cerrar el chat

En medio de una tarea puede aparecer una decisión útil: por ejemplo, que los mensajes de error expliquen cómo recuperarse y no solo que algo ha fallado.

Si la hemos acordado, puedo pedir:

> Usa convention-document para documentar este acuerdo, con ejemplos y excepciones, y actualizar el índice. No hagas commit.

La palabra importante es **acuerdo**. La skill no debería convertir una ocurrencia suya en una ley del equipo. Me sirve para que la próxima sesión no empiece otra vez con la misma discusión. Si vamos a debatir tres veces dónde va una carpeta, por lo menos que la tercera haya acta.

### Las releases, cuando toca, no todos los martes por obligación

No preparo una release por cada cambio. Cuando toca, `release-prepare-github` separa tres trabajos: redactar el changelog, preparar la versión y las evidencias, y publicar lo autorizado.

> Usa release-prepare-github para preparar la próxima versión desde el tag base y el SHA candidato que hemos acordado. Incluye cambios y comprobaciones; no crees tags ni publiques.

Un **tag** pone nombre a una revisión de Git; el **SHA** identifica el commit concreto. Fijar esos puntos evita que «la próxima versión» termine incluyendo algo distinto de lo que hemos revisado.

La skill puede apoyarse en Git y, opcionalmente, en una instalación existente de git-cliff para las notas. No necesita instalar herramientas por su cuenta. Y aprobar la PR de la versión no autoriza automáticamente a publicar la release.

## ¿Y si quiero que avance sin preguntarme a cada rato?

El modo habitual es guiado, pero también he incorporado un **modo autónomo secuencial y acotado**. La idea es autorizar por adelantado un trabajo concreto, no escribir «haz lo que quieras» y cruzar los dedos. Eso no es delegar: es convertir el repositorio en una escape room para tu yo de mañana.

Hay que definir tareas o fases, repositorio, archivos que puede tocar, comprobaciones, límites y operaciones permitidas. Dar permiso para implementar no incluye hacer commit, push o abrir una PR.

El agente de la sesión encadena los pasos permitidos. No hay una nueva cuadrilla de agentes, un servicio vigilando GitHub ni una maquinaria funcionando detrás del telón. Se detiene ante los bloqueos o las revisiones obligatorias; publicar una PR también es un punto de parada. En esta primera versión autónoma quedan fuera el merge, los tags, la publicación de releases y el despliegue.

Y un matiz importante: **son instrucciones, no una barrera de seguridad del sistema**. No garantizan que el agente nunca se equivoque. Los permisos reales y los límites duros de tiempo o coste tienen que aplicarse desde la herramienta que lo ejecuta.

## Cómo probarlas sin adoptar todo mi ritual

El [repositorio common-skills](https://github.com/fluzo-labs/common-skills) incluye catálogo, guía de uso y plantilla para construir otras skills. Puedes empezar con una sola.

La documentación propone estos comandos desde la raíz del proyecto, con Node.js/npm, Git y acceso a la red:

```bash
npx skills add fluzo-labs/common-skills --list
npx skills add fluzo-labs/common-skills --skill '*' --agent universal --copy
```

El primero lista las disponibles; el segundo copia la colección a `.agents/skills/`. Para instalar solo una, se sustituye `'*'` por su nombre. Después hay que comprobar que el agente utilizado descubre esa carpeta. Los pasos con GitHub también necesitan `gh` autenticado y los permisos adecuados.

**Ojo con el copia y pega:** `npx` puede descargar y ejecutar un instalador externo, y estos comandos no fijan una revisión. Conviene revisar el instalador y las instrucciones antes de ejecutarlos. `--copy` no es un certificado de seguridad. La documentación del repositorio indica, además, que todavía no se ha probado una instalación aislada de la colección.

La alternativa es copiar manualmente una carpeta completa desde una revisión revisada, incluidos sus recursos. Esa copia no recibe actualizaciones automáticas: hay que revisar las diferencias al actualizarla. A veces ese pequeño inconveniente es precisamente lo que quieres.

## Lo que busco de verdad

No tengo una cifra seria de «horas ahorradas» ni una prueba de que todo agente vaya a seguir siempre el procedimiento. La colección contiene criterios y escenarios de validación, pero no una suite automatizada que certifique su comportamiento.

Lo que busco es más sencillo: **pedir menos veces lo obvio y revisar mejor lo importante**.

Que antes de programar esté claro el objetivo. Que después aparezcan las comprobaciones. Que un acuerdo no desaparezca con el chat. Y que «terminado» no signifique «he tocado treinta archivos y ya veremos».

En el [artículo sobre mi stack de IA local](/es/blog/menos-espera-mas-agentes-stack-ia-local/) hablaba de reducir la espera para poner a trabajar agentes. Esto es la otra mitad: darles una forma de trabajar que me resulte útil.

El modelo pone capacidad. Las herramientas le permiten actuar. Las skills ponen un procedimiento. Y yo sigo teniendo que mirar qué estamos construyendo.
