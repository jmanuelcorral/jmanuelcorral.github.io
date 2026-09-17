---
title: 'Qwen3.8 de 27B en local: cuando el modelo trabaja, pero el chat se corta'
description: 'Cómo configuramos Qwen3.8-27B en HalostrixLab y por qué actualizar Lemonade resolvió un corte de streaming. Modelos locales, contexto y SSE explicados sin dar nada por sabido.'
lang: 'es'
translationKey: 'halostrix-qwen38-lemonade-sse'
slug: 'qwen38-27b-local-lemonade-sse'
pubDate: '2026-09-14T12:00:00+02:00'
tags: ['experiment', 'local-ai', 'inference', 'qwen', 'lemonade', 'llama-cpp', 'vulkan', 'streaming', 'beginner']
category: 'ai'
kind: 'Experimento · Inferencia'
experimentCategory: 'inference'
draft: false
---

Pones un modelo a funcionar en tu equipo, le mandas una conversación larga y esperas. La GPU está trabajando. No aparece ninguna respuesta. Pasan un par de minutos y el chat se corta.

La primera sospecha es bastante razonable: «Me he pasado de modelo para este ordenador».

En este caso, no era eso. En HalostrixLab nos encontramos con un límite de espera de Lemonade que cortaba la conexión mientras **Qwen3.8-27B todavía estaba leyendo la entrada**. Actualizamos Lemonade, conservamos el perfil del modelo y comprobamos que la misma clase de petición podía terminar.

Pero vamos por partes. Si nunca has montado un modelo local, hay varias piezas aquí que conviene separar.

## Un modelo, un motor y alguien que atienda el chat

Cuando usas un servicio de IA en la nube, casi todo esto queda escondido. En local lo montas tú, aunque no necesitas escribir cada pieza:

- **El modelo** son los archivos con los parámetros aprendidos durante su entrenamiento. Nosotros usamos Qwen3.8-27B. Ese `27B` significa aproximadamente 27.000 millones de parámetros, no 27 GB ni el tamaño máximo de la conversación.
- **llama.cpp** es el motor que carga esos archivos y hace los cálculos para generar respuestas. Ejecutar un modelo ya entrenado se llama *inferencia*; no estamos entrenándolo de nuevo.
- **Vulkan** es el backend que usamos para que ese motor aproveche la GPU de AMD.
- **Lemonade** gestiona los modelos y ofrece una API a la que se conecta el cliente de chat.

El recorrido, simplificado, es este:

<figure class="sketch-flow" aria-label="Recorrido de una petición de chat hasta el modelo local">
  <ol role="list">
    <li><strong>Cliente de chat</strong><span>Envía tu pregunta</span></li>
    <li><strong>Lemonade</strong><span>Recibe y dirige la petición</span></li>
    <li><strong>llama.cpp</strong><span>Ejecuta con Vulkan</span></li>
    <li><strong>Qwen3.8 · GPU</strong><span>Genera la respuesta</span></li>
  </ol>
  <figcaption>La pregunta va hacia el modelo; la respuesta vuelve al chat por el mismo camino.</figcaption>
</figure>

Esto importa porque un fallo en el chat no implica necesariamente un fallo del modelo. Hay conexiones, configuraciones y relojes de espera entre medias.

## Qué equipo y qué versión del modelo usamos

El laboratorio es un GMKtec EVO-X2 con Ryzen AI Max+ 395, Radeon 8060S, 128 GiB de memoria física y CachyOS. CPU y GPU comparten memoria: no es lo mismo que tener una tarjeta gráfica independiente con 128 GiB propios.

Ya conté [cómo elegimos Vulkan frente a HIP/ROCm](/es/blog/vulkan-o-rocm-en-strix-halo/). Para esta historia lo importante es que partíamos de una base Vulkan que ya funcionaba. No cambiamos de backend para arreglar el corte.

El identificador de Lemonade era `Qwen3.8-27B-GGUF-UD-Q4_K_XL`, procedente de `unsloth/Qwen3.8-27B-GGUF`.

El nombre parece una matrícula, pero se puede descomponer:

- **GGUF** es el formato de archivo que utiliza esta distribución del modelo.
- **Cuantización** significa representar los pesos con menos precisión para reducir su tamaño y sus necesidades de memoria. No es quitarle conocimientos a mano, ni es gratis: puede afectar a la calidad.
- **UD-Q4_K_XL** identifica la variante concreta de cuantización. Es una variante dinámica, no significa que absolutamente todo esté guardado a cuatro bits.

El inventario del laboratorio registra unos **16,35 GiB de pesos**, más unos **0,87 GiB del componente de visión**. Eso es tamaño de archivos, no una promesa de consumo total: al ejecutar el modelo también hay que reservar memoria para la conversación y los cálculos. Esta incidencia se validó con texto, no como una evaluación de sus capacidades visuales.

## La configuración: darle una mesa de trabajo, no toda la casa

El perfil documentado tras el mantenimiento del 10 de septiembre quedó así:

| Ajuste | Valor usado | Qué significa en la práctica |
|---|---|---|
| Backend | Vulkan | El motor utiliza la GPU mediante Vulkan. |
| Contexto | 65.536 tokens | Espacio disponible para entrada, historial, instrucciones y generación. |
| Peticiones simultáneas | 1 slot | Un hueco de trabajo para este modelo. |
| Caché K/V | `q8_0` / `q8_0` | Precisión de la memoria de atención, distinta de la cuantización de los pesos. |
| Flash Attention | Activada | Una implementación de atención orientada a usar los recursos de forma más eficiente. |
| Razonamiento | Activado, presupuesto de 4.096 tokens | Espacio configurado para el razonamiento del modelo, no 4.096 pasos de un agente. |
| Decodificación especulativa | Desactivada | No añadimos ese mecanismo de aceleración durante la corrección. |

Un **token** es una unidad de texto que maneja el modelo. Puede ser una palabra o solo un fragmento; no conviene convertir tokens a palabras con una regla fija.

Piensa en el contexto como una mesa de trabajo. En ella tienen que caber lo que preguntas, el historial, las instrucciones y lo que el modelo va generando. Que su ficha anuncie una mesa mucho mayor no significa que hayas reservado ese espacio en tu servidor. Aquí el perfil era de **64k**, no de 262k.

El razonamiento también consume presupuesto. No queda fuera de la conversación por ser menos visible en la interfaz.

Para quien quiera reconocer los ajustes en Lemonade, estos eran los argumentos adicionales del perfil. El contexto se configura aparte:

```text
--parallel 1 --flash-attn on --cache-type-k q8_0 --cache-type-v q8_0 --spec-type none --reasoning on --reasoning-budget 4096 --temp 1.0 --top-p 0.95 --top-k 20 --min-p 0.0 --repeat-penalty 1.0 --chat-template-kwargs '{"reasoning_effort":"medium","preserve_thinking":true}'
```

Los valores de temperatura y muestreo controlan cómo se elige el siguiente token. **No fueron la solución al timeout**, ni esta combinación es una receta universal. Son los ajustes que conservamos para no mezclar una reparación con una sesión de afinado.

Además, convivía con un modelo Coder. Lemonade permitía dos modelos residentes y ambos quedaron fijados para evitar su expulsión normal. Fijarlos no crea memoria ni garantiza que ejecutar todo a la vez vaya a rendir bien.

## Antes de escribir, el modelo tiene que leer

Una petición tiene dos fases que desde el chat no siempre se distinguen:

1. **Prefill:** el motor procesa la entrada y prepara la información que necesita para responder.
2. **Generación:** empieza a producir tokens de salida.

Si le pasas mucho historial o un documento grande, la primera fase puede tardar bastante. Puedes tener la GPU ocupada y seguir sin ver una sola palabra.

Ese tiempo hasta el primer token suele llamarse **TTFT**. No es lo mismo que la velocidad a la que aparecen las palabras una vez que arranca la respuesta.

Aquí está la trampa: **no recibir texto todavía no significa que el servidor esté parado**.

## SSE: el canal por el que llega la respuesta a trocitos

*SSE* significa *Server-Sent Events*. Es una forma de mantener una respuesta HTTP abierta para que el servidor envíe eventos al cliente. En un chat permite mostrar la respuesta mientras se genera, en lugar de esperar al texto completo.

No tiene que ver con las instrucciones SSE del procesador, aunque compartan siglas.

En nuestro caso, Lemonade recibía la respuesta de llama.cpp y la enviaba hacia el cliente. En la versión **11.8.1**, esa conexión interna de streaming tenía una condición fija: si transfería menos de **1 byte por segundo durante 120 segundos**, se cancelaba.

Durante un prefill largo, llama.cpp podía estar trabajando sin enviar todavía tokens. Para el reloj de la conexión, aquello era silencio.

El informe recoge cuatro cortes alrededor de los **126 segundos**, mientras el procesamiento de la entrada seguía avanzando. En las últimas muestras había llegado al 74 %, al 85 % o al 91 %. Después aparecía:

```text
CURL error: Timeout was reached
```

No era un límite exacto de 120 segundos de duración total, sino una política de baja transferencia. Tampoco se había agotado el contexto de 64k: los registros indicaban `truncated = 0`, y los procesos de los modelos seguían disponibles.

Había existido otro fallo con una ventana de 32k agotada. Era otro problema. Subir contexto y arreglar un timeout no son la misma operación.

## Por qué subir el timeout no bastaba

Ya teníamos `global_timeout = 1200`, es decir, 20 minutos. Lo intuitivo era pensar que Lemonade esperaría ese tiempo.

Pero en 11.8.1 **la rama de streaming no utilizaba ese ajuste para su límite de baja transferencia**. Podías aumentar el valor global y seguir chocando con la barrera de dos minutos.

Tampoco bastaba con que Lemonade enviara algún ping al cliente. Hay dos tramos: cliente → Lemonade y Lemonade → llama.cpp. Mantener vivo el primero no reinicia necesariamente el reloj del segundo.

La [versión oficial 11.9.0 de Lemonade](https://github.com/lemonade-sdk/lemonade/releases/tag/v11.9.0) corrigió ese comportamiento: el intervalo pasó a respetar el timeout configurado. La versión anuncia 600 segundos por defecto; en el laboratorio conservamos **1200 segundos**.

El mantenimiento documenta Lemonade **11.9.0-1** y el backend Vulkan **b10723-010be9683**. En CachyOS se utilizó un paquete local construido desde las fuentes oficiales, no un binario Arch firmado por el proyecto.

La idea fue cambiar lo necesario, conservar una vuelta atrás y restaurar los perfiles. No aprovechar el arreglo para cambiar de driver, activar aceleraciones experimentales o ampliar el contexto.

## La prueba buena no era preguntar «hola»

Una respuesta corta demuestra que el chat funciona. No demuestra que sobreviva al silencio que provocaba el fallo.

Por eso la prueba tenía que ser deliberadamente lenta **antes del primer contenido**, pero con una respuesta final muy sencilla: `READY`.

Se enviaron 2.221 registros sintéticos, unos **44.500 tokens de entrada**, y se exigió que el primer contenido real llegase después de 130 segundos. No contaban un HTTP 200, un ping ni un evento que solo anunciara el rol del asistente.

Para aislar el streaming, esa petición desactivaba el razonamiento y limitaba la salida a 16 tokens. Fue un ajuste solo de la prueba: el perfil habitual conservó su razonamiento activado. De hecho, sin ese ajuste, el modelo podía gastar el pequeño presupuesto en razonamiento y no llegar a escribir `READY`.

Los resultados registrados fueron:

| Prueba | Entrada | Primer contenido | Finalización |
|---|---:|---:|---|
| Desde el propio host | 44.500 tokens | 214,735 s | `READY`, `stop`, `[DONE]` |
| Desde Windows | 44.497 tokens | 214,866 s | `READY`, `stop`, `[DONE]` |

Algo más de tres minutos y medio sin contenido inicial. Justo el tipo de espera que antes se cortaba.

`stop` indica que la generación terminó normalmente; `[DONE]` cierra el stream. Comprobar ambos evitaba dar por buena una respuesta incompleta. Los registros también permitían distinguir procesamiento real de una espera en cola.

**La actualización no hizo que Qwen leyera más rápido. Dejó de interrumpirlo mientras leía.**

## Con qué me quedo

Si estás empezando con modelos locales, no necesitas memorizar todas estas opciones. Sí merece la pena quedarse con estas preguntas:

- **¿Está cargando, leyendo o generando?** Son esperas distintas.
- **¿El corte ocurre casi siempre al mismo tiempo?** Antes de culpar a la GPU, revisa los timeouts.
- **¿El contexto se agotó o se cerró una conexión?** El síntoma puede parecerse; la solución no.
- **¿Has probado el caso que fallaba?** Un «hola» no valida una conversación enorme.
- **¿Quién más puede dejar de esperar?** El cliente y un posible proxy tienen sus propios límites; actualizar Lemonade no los cambia.

Tampoco hace falta convertir la espera en infinita. Mantener límites y poder cancelar sigue siendo útil. Y si cada conversación arrastra decenas de miles de tokens, reducir historial innecesario puede mejorar la experiencia mucho más que seguir ampliando el reloj.

Montar IA local no es solo conseguir que el modelo quepa. Es conseguir que todas las piezas se pongan de acuerdo sobre cuánto trabajo le estamos pidiendo.

## Notas y fuentes

Esta crónica sigue el informe de mantenimiento del **10 de septiembre de 2026** del [repositorio HalostrixLab](https://github.com/jmanuelcorral/halostrixlab). Allí están `docs/incidente-sse-lemonade.md`, su informe ampliado en inglés y `scripts/test-lemonade-sse.py` para revisar la configuración y las pruebas.

El repositorio conserva una advertencia: hay un registro anterior donde la actualización estaba preparada, pero aún no instalada; el informe posterior recoge la instalación y las dos pruebas. Este artículo relata ese resultado documentado, no una nueva auditoría del equipo ni una medición de su estado actual.

La corrección del timeout sí puede contrastarse en la [publicación oficial de Lemonade 11.9.0](https://github.com/lemonade-sdk/lemonade/releases/tag/v11.9.0) y en su [cambio de código](https://github.com/lemonade-sdk/lemonade/commit/bb39eafc22aa7e57fc7aeb8b7d384d70b44a4531). Las dos pruebas comprueban este fallo de streaming; no son una evaluación de calidad del modelo ni una garantía de estabilidad para cualquier carga.
