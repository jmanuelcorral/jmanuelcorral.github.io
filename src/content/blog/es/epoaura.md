---
title: 'EpoAura: me regalaron un teclado y acabé haciendo una app para Linux'
description: 'Un regalo de cumpleaños, un AK820 Pro a medio aprovechar en Linux y una excusa para cacharrear con RGB, pantallas e ingeniería inversa con ayuda de la IA y GPT-Astra.'
lang: 'es'
translationKey: 'epoaura'
slug: 'epoaura-teclado-cumpleanos-linux'
pubDate: '2026-09-15T10:00:00+02:00'
tags: ['linux', 'open-source', 'tauri', 'rust', 'svelte', 'desktop', 'ai', 'reverse-engineering']
draft: false
---

Me regalaron un teclado por mi cumpleaños. Un **EPOMAKER Ajazz AK820 Pro**, con sus luces, su pantallita y ese potencial de distracción que tiene cualquier cacharro nuevo encima de la mesa.

El regalo, genial. La experiencia en Linux... bueno, ahí empezaba la segunda parte del regalo.

**No me iban la mitad de las funcionalidades.** Escribir, sí. Pero quería aprovechar también las luces y la pantalla, no quedarme mirando las opciones de personalización como quien mira un escaparate cerrado.

Y claro, entre aceptar la situación y meterme en otro proyecto personal, hice lo razonable: meterme en otro proyecto personal.

Así nació [**EpoAura**](https://github.com/jmanuelcorral/epoaura).

## Yo solo quería cambiar unas luces

Venía de hacer [Aura Studio](https://github.com/jmanuelcorral/aura-studio), una interfaz para controlar la iluminación de mi portátil ASUS en Linux. La idea aquí era parecida: abrir una aplicación agradable, elegir colores y guardar combinaciones sin tener que acordarme de comandos.

La comunidad ya había avanzado mucho. El [controlador de gohv para el AK820 Pro](https://github.com/gohv/EPOMAKER-Ajazz-AK820-Pro) permitía controlar una variante USB del teclado, y EpoAura aprovecha ese trabajo para ese modelo. No empezábamos de cero, ni tendría sentido contarlo así.

Pero apareció la letra pequeña: **mi variante ISO-ES no hablaba exactamente el mismo idioma**.

Que dos teclados compartan nombre comercial no significa que compartan protocolo. Y que puedas conectarlos por cable, receptor o Bluetooth tampoco significa que puedas configurarlos de la misma manera por las tres vías.

Lo que parecía una interfaz con unos botones de colores empezaba a tener bastante más conversación con el hardware de la prevista.

## IA, GPT-Astra y un rato de mirar debajo del capó

En este proyecto, **gracias a la IA y a GPT-Astra hemos hecho research y, en algunos momentos, reverse engineering**. O, dicho menos fino: buscar pistas, leer código y tratar de entender qué le estaba diciendo el configurador oficial al teclado.

La IA ha sido una ayuda para recorrer ese material, ordenar hipótesis y convertir lo encontrado en código y comprobaciones. No ha sido un botón de «hazme un driver» y a otra cosa. El teclado no entiende de respuestas convincentes: o responde como esperas o toca revisar la idea.

La investigación pasó por el configurador web de la variante ISO-ES, su uso de WebHID y los mensajes con los que consulta y modifica la iluminación. También hubo que distinguir el receptor de 2,4 GHz del dispositivo Bluetooth, aunque algunas identificaciones pudieran parecerse.

Una de mis anécdotas favoritas es la del brillo y la velocidad: **el firmware probado recibe niveles del 1 al 6, pero los devuelve del 0 al 5**. Reenviar tal cual lo que acababas de leer bajaba ambos ajustes. Tú pensando que no has cambiado nada y el teclado, un poquito más apagado.

Ese detalle se detectó probando contra el dispositivo real. Hubo que corregir la conversión y comprobar que leer y volver a aplicar el mismo estado dejaba los niveles como estaban.

Para mí, ahí está lo interesante de trabajar con IA: ayuda mucho a avanzar, pero una hipótesis bien redactada sigue siendo una hipótesis. **Hay que contrastarla con lo que hace el cacharro de verdad.**

Y también saber dónde parar. En la investigación de Bluetooth apareció un canal identificado como OTA, relacionado con actualizaciones de firmware. No era una invitación a mandarle colores a ver qué pasaba. Esa vía no se tocó.

## Vale, pero ¿qué hace EpoAura?

La aplicación está hecha con **Tauri, Rust y Svelte**: una interfaz visual conectada a una parte nativa que se ocupa de hablar con el dispositivo. En Linux utiliza WebKitGTK, sin empaquetar Chromium como haría Electron.

La parte menos detectivesca, y la que quería usar desde el principio, permite:

- Partir de seis ambientes y personalizar colores, brillo, velocidad y los ajustes que admita cada modo.
- Elegir entre veinte modos de iluminación.
- Ver una previsualización aproximada del teclado antes de aplicar nada.
- Guardar, renombrar, duplicar y eliminar perfiles locales, hasta 100.
- Cambiar entre español e inglés.

Abrir la aplicación o cargar un perfil **no cambia las luces**. Para enviarlas hay que pulsar **Aplicar al teclado**. Parece poca cosa, pero prefiero poder trastear con un color sin montar una discoteca con cada movimiento del ratón.

No hay cuentas, sincronización en la nube ni un servicio de iluminación residente. La interfaz funciona como usuario normal; el acceso al dispositivo se resuelve con permisos de `udev`, no abriendo toda la aplicación como root.

## La pantallita también tenía que entrar en la fiesta

Porque, seamos sinceros, tener una pantalla en el teclado y no intentar ponerle algo es dejar una tentación demasiado cerca.

EpoAura tiene una sección **Pantalla** con seis diseños, ajustes de color y texto, importación de PNG, JPEG y GIF, previsualización animada y exportación a GIF.

Enviar ese contenido al teclado es otra historia, y conviene no mezclar las dos cosas. **La carga nativa por USB está limitada al ISO-ES con firmware 1.16** y pide confirmación antes de sustituir lo que hay. Se han comprobado físicamente una imagen de diagnóstico y una animación sencilla; eso no certifica por separado todos los diseños de la galería.

Además, no hay recuperación garantizada de la animación anterior ni cancelación segura durante la transferencia. No hay que desconectar el teclado ni cerrar la aplicación mientras está enviando. La demo en navegador permite probar la interfaz, pero no controla el hardware.

Me hace ilusión que funcione, pero más me importa no vender como «todo probado» lo que todavía tiene límites.

Y para que no se quede todo en palabras, aquí va un vídeo de la pantallita funcionando en el teclado de verdad:

<video controls playsinline preload="metadata" width="480" height="848" style="display: block; max-width: 100%; height: auto; margin: 0 auto 18px;" aria-describedby="epoaura-screen-caption">
  <source src="/epoaura-pantalla.mp4" type="video/mp4" />
  Tu navegador no permite reproducir este vídeo. <a href="/epoaura-pantalla.mp4">Descargar el vídeo de la pantalla funcionando</a>.
</video>
<p id="epoaura-screen-caption">La pantalla del AK820 Pro funcionando en una grabación real de 3,5 segundos, sin audio. No es la previsualización de la aplicación.</p>

## Compatible no significa «todo, por cualquier conexión»

El estado del proyecto al escribir esto es el siguiente:

| Conexión o variante | Qué permite EpoAura |
| --- | --- |
| ISO-ES con receptor compatible de 2,4 GHz | Control RGB, lectura de ajustes y comprobación posterior al aplicar. |
| Variante USB anterior | RGB, temporizador de reposo y sincronización del reloj mediante su controlador. |
| ISO-ES por cable, firmware 1.16 | Carga a la pantalla; RGB por cable no soportado. |
| Bluetooth | No soportado. |

Reposo y reloj no están disponibles a través del receptor ISO-ES. Tampoco hay remapeo de teclas, RGB individual por tecla ni actualización de firmware. Se trabaja con un dispositivo compatible a la vez.

Lo de Bluetooth significa que **EpoAura no lo soporta**, no que hayamos demostrado que sea imposible. Es una distinción pequeña, pero después de unas cuantas vueltas al protocolo prefiero dejarla bien clara.

## El regalo venía con proyecto incluido

Si tienes un AK820 Pro, el [repositorio de EpoAura](https://github.com/jmanuelcorral/epoaura) reúne el código, las capturas y la guía de compatibilidad e instalación. La [versión 0.4.1](https://github.com/jmanuelcorral/epoaura/releases/tag/v0.4.1) ofrece paquetes para Arch Linux/CachyOS y Ubuntu 24.04, además de un RPM experimental. No son binarios universales ni paquetes firmados con GPG; se incluyen sumas SHA-256.

Es un proyecto independiente, con licencia MIT y sin afiliación a EPOMAKER o AJAZZ. Hay trabajo de la comunidad debajo, investigación propia y bastante ayuda de la IA para ir uniendo las piezas.

Yo quería disfrutar del teclado que me habían regalado. De paso, he acabado aprendiendo sobre protocolos HID, receptores y las pequeñas bromas que puede gastarte un firmware.

Me regalaron un teclado. El proyecto venía sin envolver.
