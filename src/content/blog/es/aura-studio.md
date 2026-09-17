---
title: 'Aura Studio: un domingo para darle color a mi ASUS en Linux'
description: 'Usaba rogauracore para controlar las luces de mi ASUS, pero quería una interfaz más agradable. Así nació Aura Studio: Tauri, Rust, Svelte y un pequeño proyecto de domingo.'
lang: 'es'
translationKey: 'aura-studio'
slug: 'aura-studio-un-domingo-de-rgb-en-linux'
pubDate: '2026-09-14T14:00:00+02:00'
tags: ['linux', 'open-source', 'tauri', 'rust', 'svelte', 'desktop', 'asus']
category: 'devops'
kind: 'Post · Linux'
draft: false
---

El pasado domingo hice una aplicación para cambiar las luces de mi portátil ASUS en Linux. Se llama **Aura Studio** y nació de una necesidad bastante menos épica de lo que suena: podía controlar el teclado, pero no me gustaba la interfaz que estaba usando.

Usaba `rogauracore`, que ya hacía el trabajo importante de comunicarse con el hardware. Sin embargo, `rogauracore-ui` no terminaba de convencerme. Quería algo visualmente más cuidado, fácil de usar y más cercano a la experiencia que encontraba en Windows.

No necesitaba otro controlador. Quería abrir una ventana, ver colores, probar una combinación y guardarla sin tener que pensar en comandos.

Así que el proyecto del domingo fue ese: **hacer agradable algo que ya era posible**.

## No empezar desde cero también es construir

Cuando una herramienta no encaja con lo que quieres, es tentador pensar que toca rehacerlo todo. Aquí no tenía sentido.

[rogauracore](https://github.com/Syndelis/rogauracore) ya permite controlar la iluminación de dispositivos ASUS compatibles en Linux. Aura Studio se apoya en ese trabajo: aporta la interfaz y deja el control del dispositivo donde ya estaba.

Dicho sin jerga: una parte decide cómo mostrarte las opciones y otra sabe cómo enviarlas al teclado.

No es una crítica al proyecto original ni a quienes han construido interfaces para él. Sin ese trabajo previo, este domingo habría sido muy diferente. Es una de las cosas que más me gustan del código abierto: puedes mejorar una parte de la experiencia sin tener que resolver de nuevo todas las demás.

## De elegir un comando a elegir un ambiente

En vez de empezar por una lista de parámetros, Aura Studio propone seis ambientes: **Océano, Concentración, Atardecer, ROG clásico, Neón y Espectro**.

Son puntos de partida, no configuraciones cerradas. Puedes escoger uno, cambiar los colores y darle tu toque. La aplicación ofrece:

- Selección visual de color y entrada hexadecimal, para quien ya sabe exactamente qué tono quiere.
- Brillo de 0 a 3 y velocidad de 1 a 3, respetando los niveles del controlador.
- Controles de cuatro zonas en los modos que los admiten.
- Una previsualización del teclado en SVG, con animación aproximada.
- Perfiles locales que puedes guardar, renombrar, duplicar y eliminar.
- Interfaz en español e inglés, que recuerda el idioma elegido.

La idea es que no tengas que reconstruir tu combinación favorita cada vez. Ajustas un ambiente, lo guardas y puedes recuperarlo después. La biblioteca admite hasta 100 perfiles.

En los README del [repositorio de Aura Studio](https://github.com/jmanuelcorral/aura-studio) hay capturas del estudio y de la biblioteca en ambos idiomas. Son capturas de la aplicación en modo demostración, no fotografías de un teclado real.

## Previsualizar no debería cambiarte el teclado

Una decisión importante fue separar **probar una idea** de **aplicarla al hardware**.

Abrir Aura Studio no cambia las luces. Tampoco lo hacen previsualizar, cambiar de idioma o cerrar la ventana. Los efectos solo se envían cuando pulsas **Aplicar al teclado**.

Parece un detalle pequeño, pero cambia bastante la experiencia. Puedes explorar colores sin que el teclado vaya obedeciendo cada movimiento del ratón. Además, no hay un servicio de iluminación residente funcionando por detrás.

La previsualización también tiene un límite deliberado: muestra una aproximación de lo que quieres enviar, **no lee el estado físico del teclado**. Que el comando termine correctamente confirma que se ha enviado, no que todos los efectos se vean igual en cualquier ASUS.

La comprobación final sigue siendo bastante sencilla: mirar el teclado.

## Qué hay debajo: Tauri, Rust y Svelte

La aplicación está hecha con **Tauri 2, Rust, Svelte 5 y TypeScript**.

Si no conoces estas herramientas, la división es bastante intuitiva:

- **Svelte y TypeScript** construyen la parte visual: controles, colores, perfiles y estados de la interfaz.
- **Tauri** permite empaquetar esa interfaz como aplicación de escritorio y conectarla con la parte nativa.
- **Rust** se ocupa de la parte nativa que conecta la aplicación con el sistema y el controlador.

En Linux, Tauri utiliza **WebKitGTK**, el motor web disponible como dependencia del sistema. No es Electron ni lleva una copia de Chromium integrada. Eso no significa que no tenga dependencias: requiere una sesión gráfica, GTK 3 y WebKitGTK 4.1, entre otras.

También hay dos formas de abrir el proyecto durante el desarrollo. La versión de navegador es una **demostración** que permite probar la interfaz, pero no controla hardware. La aplicación nativa es la que puede hablar con `rogauracore`. Sus bibliotecas de perfiles están separadas, así que probar la demo no equivale a modificar tus perfiles reales.

## Una interfaz bonita no necesita permisos de administrador

Aura Studio se abre como usuario normal. **La interfaz no se ejecuta como root**.

El acceso al dispositivo depende de los permisos de `rogauracore`, mediante las reglas de `udev`: el mecanismo con el que Linux puede asignar permisos cuando detecta un dispositivo. Si esos permisos no están bien, la solución no es abrir toda la aplicación como administrador.

Tampoco hay cuentas ni nube. Los perfiles se guardan en el equipo, con escritura atómica para reducir el riesgo de dejar un archivo a medio escribir. Si la biblioteca contiene datos inválidos o una versión desconocida, se conserva y se bloquea el guardado en lugar de reemplazarla silenciosamente.

Son decisiones poco vistosas, pero para mí forman parte del mismo objetivo que los colores: que la aplicación sea agradable de usar porque puedes entender qué está haciendo y confiar en que no te cambie cosas por sorpresa.

## El domingo también llegó hasta el paquete instalable

La [versión 0.2.0](https://github.com/jmanuelcorral/aura-studio/releases/tag/v0.2.0) quedó publicada el propio domingo. Incluye un paquete firmado para **Arch Linux y CachyOS**, una guía bilingüe y un repositorio pacman opcional para recibir actualizaciones.

Para probarla, el camino más directo es abrir esa release y seguir su `GUIDE.md`: ahí están los requisitos, la verificación de firmas y la instalación. No necesitas Node.js ni Rust para ejecutar el paquete descargado; sí necesitas `rogauracore` compatible instalado mediante el gestor de paquetes. Aura Studio no lo distribuye.

Hay también archivos DEB y RPM, pero conviene leer la letra pequeña: **se compilaron en CachyOS/Arch y son experimentales, no paquetes universales para cualquier distribución**. Cambiar la extensión del paquete no elimina las diferencias entre bibliotecas del sistema.

Los archivos se pueden obtener además mediante GitHub Packages. En ese caso, la imagen de GHCR sirve para transportar los paquetes, no para ejecutar la interfaz dentro de Docker.

## Qué está probado y qué no quiero prometer

La release registra 10 pruebas Rust, 9 unitarias de frontend, 8 flujos Chromium y comprobación con WebKitGTK nativo. Las pruebas automatizadas simulan el envío de efectos: **no escriben en el teclado**.

Esto permite comprobar lógica e interfaz sin convertir cada ejecución de tests en una fiesta de luces. No sustituye la validación física en cada modelo de portátil.

La versión actual admite un dispositivo compatible a la vez. No ofrece RGB individual por tecla, sincronización musical, autoinicio, bandeja del sistema ni actualizador integrado. Tampoco amplía lo que puede hacer el firmware del teclado.

Si la suspensión altera las luces, puede ser necesario volver a aplicar el perfil. Y mejor no poner varias herramientas RGB a controlar el mismo dispositivo al mismo tiempo.

## Un proyecto pequeño, una mejora que sí quería usar

No todos los proyectos personales tienen que resolver un problema enorme. A veces basta con algo que usas a menudo y que te hace pensar: «Esto podría ser un poco más cómodo».

Aura Studio salió de ahí. De aprovechar un controlador existente y dedicar el esfuerzo a elegir colores, guardar combinaciones y tener una interfaz que me apeteciera abrir en Linux.

El código está en [GitHub](https://github.com/jmanuelcorral/aura-studio), con licencia MIT. Es un proyecto independiente, sin afiliación a ASUS, y construido sobre el trabajo de la comunidad.

Un domingo, unas luces y una excusa bastante buena para construir algo propio.
