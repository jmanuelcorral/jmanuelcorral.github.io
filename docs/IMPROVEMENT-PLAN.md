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
| P1 | Taxonomía, portfolio y URL base como datos | Pendiente |
| P2 | Deduplicación de CSS/JS, código muerto, accesibilidad de filtros | Pendiente |
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

## P1 — Datos fuera del código

El patrón de fondo de la revisión: **el contenido descrito vive en módulos TS, no en
la colección**. Cada post nuevo obliga a tocar tres o cuatro archivos de plataforma, y
si se olvida uno, el fallo es silencioso.

1. **Taxonomía al frontmatter.** Sustituir la tabla
   `POST_TAXONOMY` (`src/lib/postTaxonomy.ts:24-46`, 9 claves escritas a mano, con
   `DEFAULT_POST_TAXONOMY` en `:48` y `taxonomyFor()` en `:53`) por campos reales en
   cada post: `category` (enum `cloud | devops | ai`), `kindEs` / `kindEn`, y
   `experimentCategory` opcional (`inference | training | rag`). Al migrar cada campo,
   el schema de `src/content.config.ts` pasa a validar lo que hoy es una convención
   social, y el validador P0-3 puede exigir su presencia.
2. **Botones de filtro derivados.** `PostsSection.astro:39-46` y
   `LabsSection.astro:29-42` enmarcan a mano "All / Cloud / DevOps" y
   "All / Inference / Training / RAG". Generar los botones a partir de las
   categorías realmente presentes: un post con una categoría nueva aparece filtrable
   sin editar componentes.
3. **`src/data/portfolio.ts`.** Los repos enlazados están repartidos por el
   componente: la lista de destacados en `PortfolioSection.astro:17-25` y luego URLs
   repetidas 2-3 veces por proyecto en `:36,50,63,64,72,83,84,94,105,123`. Un array
   con una URL por entrada elimina la duplicación y hace posible ordenar/filtrar.
4. **Un único `siteUrl()` en `seo.ts`.** El fallback
   `?? new URL('https://josecorral.dev')` está copiado en cinco archivos:
   `src/pages/[legacy].astro:52`, `src/pages/es/rss.xml.ts:22`,
   `src/pages/en/rss.xml.ts:22`, `src/pages/llms.txt.ts:19`,
   `src/pages/llms-full.txt.ts:39`. Cambiar de dominio hoy es un buscador y reemplazo
   con cinco puntos de fallo.
5. **URLs de los juegos como datos.** `src/components/Terminal.astro:41-44` fija
   `https://josecorral.dev/barrelshift/` y `/pinball/` con el dominio escrito dentro
   del componente, así que en `dev`/`preview` apuntan a producción. Deben derivarse
   del `siteUrl()` común.

---

## P2 — Deduplicación, código muerto y accesibilidad

1. **`src/lib/seo.ts` está entero sin usar.** `getPostAlternates` (`:19`),
   `getStaticPageAlternates` (`:37`) y `canonicalUrl` (`:42`) no tienen ni un import;
   `SeoHead.astro:43` construye su propia URL canónica localmente y
   `PostView.astro:17-25` reimplementa los alternates en línea. Decisión: usar
   `getPostAlternates` desde `PostView.astro` (preferible, es el código probado y da
   hreflang consistente) o borrar el módulo.
2. **Claves muertas de `homeCopy.ts`.** `lab1Kind`, `lab1Title`, `pending`, `seed`
   (`:42-49` en el tipo, `:143-150` es, `:242-249` en) ya no las consume nadie, y
   arrastran CSS huérfano: `.post.stub` (`LabsSection.astro:128-146`) y `.seed-note`
   (`:147-161`). Borrar claves y CSS juntos.
3. **CSS de filtros duplicado.** `.filters` / `.fbtn` / `:hover` / `.on` están
   copiados literalmente en `PostsSection.astro:108-132` y `LabsSection.astro:91-124`.
   Subirlos a `src/styles/global.css`.
4. **Un solo script de filtros accesible.** Los dos scripts divergieron: el de posts
   es ES5 con `var` (`PostsSection.astro:80-99`) y sus botones no llevan `type`,
   `aria-pressed` ni `aria-controls`; el de labs sí (`LabsSection.astro:31-41,68-86`).
   Unificar en un helper accesible (patrón del de labs) y usarlo en ambas secciones.
5. **Partir `homeCopy.ts` por dominio.** ~300 líneas de copia es/en mezclando nav,
   hero, CLI y secciones; separar en `nav.ts` / `hero.ts` / `cli.ts` / `sections.ts`
   para que un cambio de copy no mueva todo el archivo.
6. **Unificar los RSS.** `src/pages/es/rss.xml.ts` y `src/pages/en/rss.xml.ts` son
   idénticos salvo el literal del locale; extraer `buildFeed(locale)` y añadir
   `lastBuildDate`.
7. **Faltan imágenes sociales.** No hay `og:image` ni `twitter:image` en ninguna
   página: los enlaces compartidos salen sin imagen. Añadir una imagen de sitio
   (y por post si se quiere richer card), cuidando que sea un asset propio en
   `public/` y no un PDF ni nada prohibido por §11 de `AGENTS.md`.
8. **Limpiar los 4 avisos de `astro check`.** `Terminal.astro` pasa `T` y `NAV` por
   `define:vars` y `astro check` no los resuelve (`:73` y otras dos). Cambiar a un
   bloque JSON en el DOM (`<script type="application/json">`) elimina los avisos y de
   paso quita strings interpolados en JS.
9. **No atravesar `getStaticPaths` con todo el array.** Cada una de las 20 páginas de
   post recibe `allPosts` completo cuando solo necesita una búsqueda de traducción;
   resolver el par en `getStaticPaths` y pasar solo la traducción correspondiente.
10. **Redirección raíz: aclarar o corregir.** `/` no es un 302: Astro estático emite
    `<meta http-equiv="refresh" content="2;url=/es/">` con `noindex` (verificado en
    `dist/index.html`). Bajar el retardo a `0` y enlazar `/es/` como canonical, o
    dejarlo como está y corregir la documentación (§P3).

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
npm run check            # 0 errores; 4 hints preexistentes en Terminal.astro
npm run validate:content # 20 posts, 0 errores, 0 avisos
npm run build            # 33 páginas
npm run preview
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
