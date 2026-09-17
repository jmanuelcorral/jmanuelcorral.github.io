# Plan de mejora del sitio

Plan derivado de una revisión de arquitectura del repo (Astro 7.2.10, `output: 'static'`,
bilingüe es/en, desplegado en GitHub Pages). Ordenado por prioridad y por riesgo de
regresión: **P0** son fallos funcionales o ausencia de barreras de calidad, **P1** es
datos que viven en código en lugar de en el contenido, **P2** es deduplicación y código
muerto, **P3** es limpieza de automatización heredada y de documentación inexacta.

Todo lo de aquí respeta las invariantes de `AGENTS.md`: `newdesign/` es de solo lectura,
`README.md` no se toca, los artefactos generados no se commitean, y no se publican
email, `mailto:` ni PDFs de CV.

## Estado

| Prioridad | Elemento | Estado |
| --- | --- | --- |
| P0-1 | Menú móvil con selector de idioma | Hecho (rama `chore/site-quality-p0`) |
| P0-2 | CI que ejecuta `check` + validador + `build` en cada PR | Hecho |
| P0-3 | Validador de contenido bilingüe | Hecho |
| P0-4 | Unificar el predicado "publicado" | Hecho |
| P1 | Taxonomía, portfolio y URL base como datos | Hecho (rama `feat/content-as-data`) |
| P2 | Deduplicación de CSS/JS, código muerto, accesibilidad de filtros | Hecho (rama `refactor/dedup-and-a11y`) |
| P3 | Cruft de Squad, búsqueda, correcciones a `AGENTS.md` | Pendiente |

---

## P0 — Ejecutado en esta rama

### P0-1. Menú de navegación en móvil

**Problema.** En ≤640 px el nav ocultaba todos sus enlaces (`SiteNav.astro`, regla
`.nav-links > a:not(.cta) { display: none; }`) sin ofrecer ningún reemplazo. El
`newdesign/` del que se deriva hace exactamente eso (su export no incluye menú móvil),
pero copiarlo literalmente dejaba el sitio **sin navegación y sin selector de idioma**
en móvil, que en un sitio bilingüe es un fallo funcional real, no estético.

**Solución.** Un `<details class="mobile-menu">` (`src/components/SiteNav.astro:103`)
que reutiliza el patrón de desplegable que ya existe en el propio nav (`.cv-menu`), de
modo que no se inventa un lenguaje visual nuevo:

- Panel con `role="group"` y `aria-label` traducido (`navMenu` / `mobileMenuAria`,
  añadidos a `UI_STRINGS` en `src/lib/i18n.ts:37-38,60-61`).
- Enlaces a `#portfolio`, `#posts`, `#labs`, `resume-short.html`,
  `resume-extended.html` y un `.lang-btn` con el mismo `langHref`/`langTitle` que el
  selector de escritorio.
- El script de disclosure se generalizó de un único `.cv-menu` a
  `document.querySelectorAll('nav details')`: al abrir uno se cierran los demás,
  Escape cierra y devuelve el foco. Comparten `closeAllExcept(target)` para `focusin`
  y `click`.
- CSS en `SiteNav.astro:482-566` (oculto por defecto, visible solo ≤640 px en
  `:568-581`), calcando tokens de `.cv-submenu` (radio, `--surface`, `--line-2`,
  sombra del tema claro). Se eliminó la regla `.cv-submenu { right: 0; left: auto; }`
  que quedó muerta.

**Verificación.** `dist/es/index.html` contiene `mobile-menu`, `mobile-menu__chevron`
y `mobile-menu__panel` con `role="group" aria-label="Abrir el menú de navegación"`.

### P0-2. CI con barreras de calidad

**Problema.** `deploy.yml` solo ejecuta `withastro/action` (build). `npm run check`
no corría nunca en CI, así que los errores de tipos y los desajustes de contenido
llegaban a `master` sin señal.

**Solución.** Nuevo `.github/workflows/ci.yml`: `pull_request` (todas las ramas) y
`push` a `master` sobre `src/**`, `scripts/**`, `astro.config.mjs`, `tsconfig.json`,
`package*.json` y el propio workflow. Pasos: `npm ci` → `npm run check` →
`npm run validate:content` → `npm run build`, con Node 24 (la versión que usa por
defecto `withastro/action`) y caché de npm. Se mantiene **separado** de `deploy.yml`
para que un fallo de chequeo no se mezcle con los permisos de despliegue a Pages.

### P0-3. Validador de contenido bilingüe

**Problema.** Las reglas que cruzan dos locales o el mapa de redirecciones no las
puede expresar un schema por archivo, y hasta ahora nadie las comprobaba.

**Solución.** `scripts/validate-content.mjs` (~230 líneas, cero dependencias nuevas),
expuesto como `npm run validate:content`.

Errores (salida 1):

- `lang` no coincide con la carpeta del locale.
- Falta o no es parseable un campo obligatorio (`title`, `description`,
  `translationKey`, `slug`), falta `pubDate`, o `draft` no es booleano.
- `slug` duplicado dentro de un locale (colisionarían en la misma URL) o
  `translationKey` duplicado (el cambio de idioma queda ambiguo).
- `slug` que no es kebab-case URL-seguro.
- `legacyPath` en un post que no es `es`, o con formato inválido.
- Una redirección que no resuelve a ningún post español (el build caería a `/es/` en
  silencio).
- Un post `es` que declara `legacyPath` pero ninguna redirección lo sirve (la URL
  antigua haría 404).

Avisos (informativos; `--strict` los convierte en errores): post `es` sin traducción
`en` (esperado: `es` es canónico y `en` puede ir detrás) y post `en` sin
contraparte `es` (inusual).

El *frontmatter* se lee con patrones por clave en lugar de un parser YAML para no
añadir dependencias; lo que no se puede leer se reporta como error, nunca se omite en
silencio.

**Pruebas realizadas.** Con el estado actual: 20 posts, 0 errores, 0 avisos (las 10
claves están emparejadas), y `--strict` también pasa. Negativas: cambiar `lang: 'en'`
a `'es'` en un post → salida 1 con el mensaje correcto; borrar una entrada de
`legacyRedirects.ts` → salida 1 señalando el `legacyPath` huérfano. Ambos casos
revertidos.

### P0-4. Predicado "publicado" unificado

**Problema.** La regla "los borradores no se publican" estaba escrita como ternarios
`import.meta.env.PROD ? !draft : true` repetidos en cuatro sitios, con riesgo de que
uno se desviara y filtrara un `draft: true` a producción (o que un feed dejara de
ver posts).

**Solución.** Dos predicados con nombre en `src/lib/content.ts:16,25`:

```ts
export function isPublished(entry: BlogPost): boolean {
  return !entry.data.draft;
}
export function isRenderable(entry: BlogPost): boolean {
  return import.meta.env.PROD ? isPublished(entry) : true;
}
```

`getPostsByLocale` / `getAllPosts` usan `isRenderable` (dev sigue previsualizando
borradores). Las superficies publicadas —`src/lib/llms.ts:21` y
`src/pages/{es,en}/rss.xml.ts:14`— usan `isPublished` explícitamente, así que un
feed nunca depende de la variable de entorno de la página que lo lee. Semántica
idéntica a la anterior; solo cambia que ahora hay un único sitio donde modificarla.

---

## P1 — Ejecutado en la rama `feat/content-as-data`

El patrón de fondo de la revisión: **el contenido descrito vive en módulos TS, no en
la colección**. Cada post nuevo obliga a tocar tres o cuatro archivos de plataforma, y
si se olvida uno, el fallo es silencioso. Esta rama saca ese contenido al frontmatter
y a `src/data/`, de modo que añadir un post o un repo deja de exigir editar
plataforma.

### P1-1. Taxonomía al frontmatter

`src/content.config.ts` declara ahora `category` (enum `cloud | devops | ai`), `kind`
(obligatorio) y `experimentCategory` opcional (`inference | training | rag`), más un
`refine` que exige `experimentCategory` a todo post etiquetado `experiment`
(«posts tagged 'experiment' must declare an experimentCategory so the lab filters list
them»). Lo que era convención social es validación de build: un post nuevo sin
`category` o `kind` no compila.

**Desviación del plan.** El plan preveía `kindEs` / `kindEn`. Se implementó como un
**único campo `kind` escrito en el idioma del propio archivo**, igual que `title` y
`description`: cada archivo ya sabe qué idioma es el suyo, así que duplicar el par en
los dos archivos solo añade riesgo de deriva. La etiqueta visible sale del propio post.

Migración de los 20 posts (10 es + 10 en) con un script desechable que inserta los
campos detrás de `tags:`. Mapeo definitivo:

| translationKey | category | `kind` (es / en) | experimentCategory |
| --- | --- | --- | --- |
| `aspnet-core-elk` | cloud | Post · Observabilidad / Post · Observability | — |
| `aura-studio` | devops | Post · Linux / Post · Linux | — |
| `ddd-entity-validation` | devops | Post · Arquitectura / Post · Architecture | — |
| `dotnet-code-coverage` | devops | Post · DevOps / Post · DevOps | — |
| `epoaura` | devops | Post · Blog / Post · Blog | — |
| `hello-world` | devops | Post · Blog / Post · Blog | — |
| `kubernetes-windows-10` | cloud | Post · Kubernetes / Post · Kubernetes | — |
| `halostrix-qwen38-lemonade-sse` | ai | Experimento · Inferencia / Experiment · Inference | `inference` |
| `halostrix-rocm-training-lab` | ai | Experimento · Entrenamiento / Experiment · Training | `training` |
| `halostrix-vulkan-vs-rocm` | ai | Experimento · Inferencia / Experiment · Inference | `inference` |

Nota sobre `epoaura`: no estaba en la tabla antigua y se servía con
`DEFAULT_POST_TAXONOMY` = `devops` / «Post · Blog». Se conservó ese valor exacto para
no cambiar copy en producción; ahora se puede corregir a «Post · Linux» cambiando una
línea de su frontmatter.

`src/lib/postTaxonomy.ts` queda reducido a vocabulario y derivación: `PostCategory`,
`ExperimentCategory`, `FilterOption<T>`, `postCategoryFilters()` (`:46`),
`experimentCategoryFilters()` (`:54`) y las tablas de etiquetas y orden. Ya no conoce
ningún post concreto: se borraron `POST_TAXONOMY`, `DEFAULT_POST_TAXONOMY` y
`taxonomyFor()`.

**Las etiquetas de categoría viven en `postTaxonomy.ts`, no en `homeCopy.ts`**, porque
son propiedad del valor de la categoría (hace falta allí donde se pinta una categoría)
mientras que `homeCopy.ts` se autodefine copia estática que no es de posts.
Consecuencia: `labs.fInference` / `fTraining` / `fRag` se eliminaron de `homeCopy.ts`.

### P1-2. Botones de filtro derivados

`PostsSection.astro:24` y `LabsSection.astro:20` derivan los botones de las categorías
presentes en el slice que renderizan, en el orden fijo del vocabulario. Un post con
una categoría nueva aparece filtrable sin tocar componentes.

**Cambio visible intencionado:** un filtro que no devuelve nada ya no se ofrece. En la
home los tres posts destacados son todos `devops`, así que solo aparece
`Todos / DevOps` (antes `Todos / Cloud / DevOps`); en labs los tres destacados dan
`Todos / Inferencia / Entrenamiento` y el botón `RAG` desaparece. Los listings
completos (`/es/blog/`, `/es/experiments/`) siguen mostrando todas las categorías
presentes.

Al dar `aria-pressed` a los botones de posts hubo que reescribir su script para que la
clase `on` y el estado ARIA cambien juntos, alineándolo con el patrón de labs
(`const` + `querySelectorAll<T>`), lo que de paso eliminó los errores de tipos que el
ES5 con `var` introdujo.

### P1-3. `src/data/portfolio.ts`

Cada repo destacado se declara una sola vez con su URL, idioma, tags, estrellas,
badge y copy localizada (`FEATURED_REPOS`), más `STARRED_REPOS` (9 entradas) y
`GITHUB_LINKS` para los enlaces de cabecera. `PortfolioSection.astro` ahora solo
mapea: fuera la lista local `starred`, fuera las tres tarjetas escritas a mano y
fuera las URLs repetidas dos o tres veces por proyecto. De `homeCopy.ts` se borraron
`flag`, `veta` y `cco`; solo quedan las etiquetas compartidas del pie de tarjeta
(`foot.code`, `foot.docs`) y la cromación de secciones.

### P1-4. Un único `siteUrl()` en `seo.ts`

`siteUrl(site?)` (`src/lib/seo.ts:16`) resuelve el origen canónico y deja el literal
de respaldo en un solo sitio. Los cinco puntos de fallo
(`src/pages/[legacy].astro:52`, `src/pages/es/rss.xml.ts:22`,
`src/pages/en/rss.xml.ts:22`, `src/pages/llms.txt.ts:19`,
`src/pages/llms-full.txt.ts:39`) ahora llaman a `siteUrl(context.site)`. Efecto
secundario deseado: `seo.ts` deja de ser código muerto del todo (ver P2-1).

### P1-5. URLs de los juegos como datos

`src/data/games.ts` expone `gameUrl(slug)` construido sobre `siteUrl()`, y
`Terminal.astro:43-44` lo usa para `barrelshift` y `pinball`. El dominio ya no está
escrito dentro del componente; el origen resuelto sigue siendo el de `site` en
`astro.config.mjs`, que es lo correcto porque los juegos se sirven en el mismo origen
fuera de este repo.

**Verificación de P1.** `npm run check` → 0 errores (quedan los 4 avisos preexistentes
de `Terminal.astro`), `npm run validate:content` → 20 posts, `npm run build` → 33
páginas. En `dist`: la home pinta `data-cat="devops"` ×3 y `data-f` solo con
`all`/`devops`; `/es/blog/` ofrece `all`/`cloud`/`devops`; `/es/experiments/` ofrece
`all`/`inference`/`training`; las tarjetas de portfolio salen de datos (`openteam`,
`veta-agents`, `CCOInsights`) con 9 `star-item`; las URLs de juegos salen absolutas
desde `siteUrl()`. Pruebas negativas del schema: quitar `category` de un post y quitar
`experimentCategory` de un post etiquetado `experiment` rompen el build con el mensaje
esperado (ambos archivos restaurados después).

---

## P2 — Ejecutado en la rama `refactor/dedup-and-a11y`

El patrón de fondo de esta fase: **la misma idea escrita dos veces y ninguna de las
dos resuelta del todo**. Filtros con CSS y JS gemelos en posts y labs, un `seo.ts`
con funciones correctas que nadie importaba mientras los componentes reimplementaban
lo mismo, y ~240 líneas de copia multiidioma en un solo archivo. Además de la
deduplicación, aquí se cierran dos defectos reales de SEO: el sitio no tenía ninguna
imagen social y la raíz `noindex` se anunciaba en el sitemap.

### P2-1 / P2-9. Alternates resueltos una sola vez, arriba

`getPostAlternates()` (`src/lib/seo.ts:31`) por fin tiene consumidor: los dos
`getStaticPaths` de `src/pages/{es,en}/blog/[slug].astro` lo llaman y pasan al
componente solo los enlaces de traducción ya resueltos. `PostView.astro` cambió de
`{ locale, post, allPosts }` a `{ locale, post, translations: AlternateLink[] }`: se
borró su reimplementación en línea de los hreflang y el import de `findTranslation`.
Consecuencia de P2-9: ninguna página de post recibe ya el array completo de 20
entradas a través de `getStaticPaths`.

`getStaticPageAlternates()` (`:49`) sigue sin importadores; se conserva porque es el
helper previsto para unificar los alternates de las páginas de índice.

### P2-1b. `SeoHead` consume `seo.ts`

`src/components/SeoHead.astro` importa ahora `siteUrl()` y `canonicalUrl()` en vez
de construir la canónica a mano. El local que se llamaba `siteUrl` y tapaba la
función se renombró a `site`, y los alternates se resuelven con
`new URL(alt.path, site)`.

### P2-2. Claves muertas y su CSS, en el mismo golpe

`lab1Kind`/`lab1Title`, `lab2Kind`/`lab2Title`, `lab3Kind`/`lab3Title`, `pending` y
`seed` ya no existen (verificado: cero consumidores). El CSS huérfano que
arrastraban se borró junto con ellas: `.post.stub` y sus descendientes (`h4`, `.ph`,
`.ph.w70`, `.ph.w45`) y `.seed-note` con su `::before`, todos en
`LabsSection.astro`.

### P2-3. CSS de filtros en `global.css`

`.filters`, `.fbtn`, `.fbtn:hover` y `.fbtn.on` viven ahora una sola vez en
`src/styles/global.css` (bloque `/* ---- category filter chips ---- */`), junto a una
regla combinada `.posts-actions, .labs-actions` que unifica el layout de las dos
cabeceras sin renombrar clases que usa `newdesign/`. En el CSS compilado quedan
exactamente 3 ocurrencias de `.fbtn` (una por estado) en un único chunk.

### P2-4. `initFilterSection()` compartido

`src/lib/filterSection.ts` expone `initFilterSection(filterContainerId, gridId)`:
un manejador delegado (`target.closest('button[data-f]')`) que sincroniza la clase
`.on` con `aria-pressed` en los `.fbtn` del contenedor y `.hidden` en las
`.post[data-cat]` de la rejilla. `PostsSection.astro` y `LabsSection.astro` quedan a
una llamada cada uno y solo conservan en su `<style>` lo propio de la sección: el
color de `.kind` (`--indigo` frente a `--copper`).

Para que el helper pueda hablar de «contenedor de controles» en ambos casos,
`id="lab-filters"` se movió del `<div class="labs-actions">` exterior al
`<div class="filters">` interior, normalizando con `#post-filters` y con
`newdesign/index.html:473`. No existía ninguna referencia externa al id antiguo.

### P2-5. `src/copy/` repartido por dominio

La copia vive ahora en `src/copy/site.ts` (`SEO_COPY`, `FOOT_COPY`), `nav.ts`
(`NAV_COPY`, `LANG_COPY`), `hero.ts` (`HERO_COPY`), `sections.ts` (`PORT_COPY`,
`STAR_COPY`, `POSTS_COPY`, `LABS_COPY`) y `cli.ts` (`CLI_COPY`, las 18 cadenas del
terminal).

**Decisión clave:** se conservan intactos la forma de la interfaz `HomeCopy` y el
export `HOME_COPY`, ahora construidos por `compose(locale)`. Los nueve consumidores
(`Hero`, `HomePage`, `SiteFooter`, `SiteNav`, `LabsSection`, `PortfolioSection`,
`PostsSection`, `Terminal` y `[locale]/[listing]`) no cambiaron una importación: el
reparto es invisible para quien llama. Las cadenas con HTML (`<span class="hl">`,
`<b>Barcelona</b>`) se movieron literales. `homeCopy.ts` queda como compositor fino.

### P2-6. RSS unificado con `lastBuildDate`

`src/lib/feed.ts` concentra `FEED_META` (título, descripción y `language` por
locale) y `buildFeed(locale, context)`: filtra por idioma y `isPublished`, ordena
del más reciente al más antiguo y mapea las URLs con `blogPostPath()`. Los dos
`src/pages/{es,en}/rss.xml.ts` quedan en nueve líneas: un envoltorio que llama al
builder.

`@astrojs/rss` no expone `lastBuildDate` como opción de primer nivel, así que se
inyecta vía `customData` junto a `<language>`. Consecuencia: el RSS ya no es
byte-idéntico entre builds (intencionado).

### P2-7. Imagen social

`scripts/build-og-image.mjs` genera `public/og-image.png` (1200×630) desde un SVG
inline con `sharp`, reutilizando los tokens del tema oscuro de
`src/styles/tokens.css` (fondo `#0c0f14`, acento `#2dd4bf`, cobre `#e8935f`) y el
`mark()` del favicon. Solo contiene nombre, rol y dominio: nada prohibido por §11 de
`AGENTS.md` (sin email, sin `mailto:`, sin PDF de CV).

`SeoHead` recibe la nueva prop `ogImage?: string` con default `'/og-image.png'` y
emite `og:image`, `og:image:width`, `og:image:height` y `twitter:image`.
**Cambio visible intencionado:** `twitter:card` pasa de `summary` a
`summary_large_image` en todo el sitio. La prop con default deja sitio para una
tarjeta por post más rica sin tocar el componente de cabecera.

### P2-8. Cero avisos de `astro check`

`Terminal.astro` ya no pasa `T` ni `NAV` por `define:vars`: los datos se emiten en
un `<script type="application/json" id="cli-data">` y el script del terminal los
lee desde el DOM. Desaparecen los 4 avisos preexistentes y, de paso, los strings
interpolados en JS.

Detalle de implementación: TypeScript no conserva el estrechamiento de `const` dentro
de `function` con hoisting, así que el primer intento con guarda de retorno temprano
produjo cinco `ts(18047) 'out' is possibly 'null'`. La solución fue un helper
`requireElement<T extends HTMLElement>(id)` dentro del IIFE que lanza si el elemento
no está: el tipo se estrecha y un elemento ausente pasa de fallo silencioso a error
ruidoso y diagnosticable.

### P2-10. Redirección raíz explícita e instantánea

`Astro.redirect()` en salida estática fija un *meta refresh* de 2 segundos, así que
`/` se renderiza como página explícita: `<meta http-equiv="refresh" content="0;url=/es/">`,
`<meta name="robots" content="noindex">`, `<link rel="canonical" href="…/es/">` y
un enlace visible de respaldo.

**Cambio necesario que lo acompaña:** una URL `noindex` no puede anunciarse en el
sitemap, así que el `filter` de `astro.config.mjs` empieza ahora descartando
`new URL(page).pathname !== '/'`. `dist/sitemap-0.xml` ya no lista la raíz.

---

## P3 — Limpieza de automatización y documentación

1. **Cruft de Squad.** Cuatro workflows que no aportan a este sitio:
   `.github/workflows/squad-heartbeat.yml`, `squad-issue-assign.yml`,
   `squad-triage.yml`, `sync-squad-labels.yml`, más el directorio `.squad/`
   (plantillas de skills de otra herramienta). Borrarlos y podar `.squad/`.
2. **Decidir `search:index`.** `package.json:11` es un placeholder que no indexa
   nada. O se conecta Pagefind de verdad (generación en build, assets no commiteados)
   o se quita el script; dejarlo a medias confunde.
3. **Corregir `AGENTS.md`.** Tres afirmaciones ya no son ciertas:
   - §2 dice "5 Spanish + 5 English"; son **10 + 10**.
   - §2 no menciona las rutas `/es/blog/`, `/en/blog/`, `/es/experiments/`.
   - §4 dice "`/` → 302 a `/es/`"; en realidad es *meta refresh* + `noindex`.
   - §6 afirma que el blog no tiene imágenes de post; existe
     `public/epoaura-pantalla.mp4` (380K) incrustado con `<video>` en los posts de
     epoaura. Actualizar la regla a "sin imágenes heredadas de Jekyll; el vídeo
     embebido existente es consciente".

---

## Verificación

Comandos de validación del repo (no hay framework de tests ni linter; estos son los
umbrales):

```bash
npm ci
npm run check            # 0 errores, 0 avisos, 0 hints (desde P2-8)
npm run validate:content # 20 posts, 0 errores, 0 avisos
npm run build            # 33 páginas
npm run preview
node scripts/build-og-image.mjs  # regenera public/og-image.png (1200x630)
```

Comprobaciones manuales recomendadas tras cambios de UI: menú móvil a 360/414/640 px
(apertura, cierre con Escape, cierre del otro desplegable, selector de idioma), y
diff visual contra `newdesign/index.html` para tokens y breakpoints.

## Hallazgos positivos (no requieren acción)

Verificado en el estado actual del repo:

- Sin `mailto:` ni dirección de email en HTML, `<meta>`, JSON-LD ni RSS.
- Sin PDFs de CV en `public/`, `newdesign/`, fuente ni `dist/`.
- `dist/` y `.astro/` correctamente en `.gitignore`; ningún artefacto generado
  commiteado.
- `.mcp.json` y `.copilot/mcp-config.json` sin secretos hardcodeados.
- La costura `pages → components → lib` es limpia, y las invariantes de SEO,
  redirecciones y `llms.txt` están bien planteadas (todo generado en build, nada
  escrito a mano).

## Fuera de alcance

Cambiar el *Source* de GitHub Pages (Settings → Pages), tocar `newdesign/`, editar
`README.md`, modificar el schema de contenido sin comprobar los 20 posts existentes,
o fusionar esta rama a `master` (la decisión es del dueño del repo).
