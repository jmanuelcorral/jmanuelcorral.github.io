---
title: 'El Strix Halo se hace mayor: visión, NPU para el trabajo sucio y mantenimiento con red de seguridad'
description: 'De Halogen 0.11 a 0.20 en AMD Strix Halo: visión nativa, 8 slots en 128k de contexto, descarga de embeddings y decisiones al NPU, y mantenimiento semanal con Btrfs y ntfy.'
lang: 'es'
translationKey: 'halostrix-halogen-020-npu-mantenimiento'
slug: 'halogen-020-npu-mantenimiento-strix-halo'
pubDate: '2026-11-09T10:00:00+01:00'
tags: ['experiment', 'local-ai', 'amd', 'strix-halo', 'halogen', 'npu', 'llama-swap', 'docker', 'qwen', 'inference', 'btrfs']
category: 'ai'
kind: 'Experimento · Inferencia'
experimentCategory: 'inference'
draft: false
---

En septiembre conté cómo [renové mi stack de IA local](/es/blog/menos-espera-mas-agentes-stack-ia-local/) cambiando Lemonade Server por una combinación de llama-swap, Docker y Halogen. La ganancia de velocidad fue notable: pasé de esperar con resignación a ver a Qwen3.8-Flash-Next responder con una agilidad estupenda para programar con agentes.

Pero una cosa es conseguir que un modelo vuele en un benchmark controlado de sábado por la tarde y otra muy distinta es **mantener un servidor de inferencia encendido día y noche**, listo para recibir peticiones de herramientas, lecturas masivas de código, llamadas a modelos auxiliares y actualizaciones periódicas del sistema operativo sin que nada explote.

En las últimas semanas mi servidor AMD Strix Halo (un GMKtec EVO-X2 con 128 GiB de memoria unificada y CachyOS) ha dejado atrás la fase de «laboratorio con cables al aire». Hemos actualizado el motor a **Halogen 0.20.0**, activado **visión nativa**, puesto a trabajar el **NPU integrado** para la fontanería de los agentes y blindado el equipo con un **mantenimiento semanal automático con snapshots de Btrfs y avisos al móvil**.

Aquí está el registro de lo probado, los números medidos y las decisiones tomadas.

---

## 1. Halogen 0.20 y checkpoint v2: menos espacio, más trucos

El salto de Halogen 0.11 a 0.20.0 ha venido acompañado de un cambio importante en los pesos del modelo:

- **De w4b a v2**: antes utilizábamos `qwen38-flash-next-w4b.hgn` (115.55 GiB) con un overlay complementario. Ahora hemos pasado a `qwen38-flash-next-v2.hgn` (62.11 GiB), que incorpora ngram y MTP (*Multi-Token Prediction* / decodificación especulativa). Menos de la mitad de ocupación en disco para una respuesta idéntica o superior.
- **Visión activa**: hemos incorporado el sidecar `qwen38-flash-next-vision.hgn` (857 MiB). Ahora el servidor no solo razona sobre texto o código; si un agente le pasa una captura de pantalla, un diagrama o un error visual, el modelo lo procesa de forma multimodal directamente.
- **Tiempos de arranque**: tras un reinicio completo del sistema, el motor tarda 34 segundos en estar listo escuchando peticiones, y la primera respuesta de texto completa sale en 17 segundos.

En cuanto a velocidad bruta, un flujo aislado con contexto largo (128k) entrega **57,2 tokens por segundo de decode**. Cuando metemos concurrencia de flujos cortos, el rendimiento agregado sube hasta los **127 tok/s**.

---

## 2. Concurrencia de 8 slots y 128k de contexto

Uno de los grandes límites de los servidores locales domésticos es qué pasa cuando varios agentes hacen peticiones largas al mismo tiempo. En Halogen configuramos un **pool de KV cache de 1.048.576 posiciones** repartido en **8 slots de concurrencia**, con cada petición pudiendo llegar hasta los 131.072 tokens (`context: 131072, output: 8192`).

Para no quedarnos con la duda de si el equipo aguantaría un diluvio de contexto, ejecutamos una prueba de carga sintética implacable: **8 peticiones simultáneas con prompts de 128.949 tokens cada una** (rozando el límite físico asignable).

Los resultados de la prueba:

| Métrica | Resultado medido |
|---|---|
| **Peticiones completadas** | 8 de 8 correctas (`finish_reason: stop`), sin cuelgues ni errores 500 |
| **Tiempo de pared total** | 555,7 segundos (~9 minutos) |
| **Pico de ocupación del pool** | 922.112 de 1.048.576 posiciones (88 % de ocupación) |
| **Velocidad de prefill por flujo** | Entre 1.840 y 1.976 tokens/segundo (~65-70 s por petición) |
| **Decode en paralelo** | ~5-6 tok/s por flujo durante los prefills activos; ~77 tok/s en el último flujo liberado |

### La lección del cuello de botella (anti-hype)
El test dejó clara una realidad que no suele salir en los hilos de Twitter: **el cuello de botella en contexto largo concurrente no fue la memoria RAM, sino el prefill**.

Como los prefills masivos se procesan en serie para proteger la latencia y la coherencia del motor, 8 peticiones de 128k tardan unos 9 minutos en digerir todo el texto acumulado (~1 millón de tokens de entrada en total). El servidor no se rompió ni agotó el pool (llegó al 88 %), pero confirma que para el día a día conviene que los agentes compartan prefills cacheados siempre que sea posible.

### El desmentido del GTT
Durante semanas arrastré una hipótesis equivocada: creía que los pesos completos del modelo debían caber dentro del límite GTT de la GPU en Linux (`ttm.pages_limit`, en nuestro caso fijado en 61,73 GiB). Upstream lo aclaró y nuestras mediciones lo confirmaron: **los pesos residen en la memoria física del host registrada (`mlock`) y no compiten directamente contra el GTT**. Durante la prueba de estrés el uso real de GTT osciló entre 17 y 41 GiB, dejando margen holgado.

---

## 3. El NPU entra en juego: repartir el trabajo sucio

El procesador AMD Strix Halo incluye una unidad de procesamiento neuronal (NPU) bajo la arquitectura Ryzen AI / XDNA, accesible en Linux mediante `/dev/accel/accel0` y el driver del núcleo `amdxdna`.

Tener una GPU potente ocupada resolviendo razonamientos complejos mientras un agente la interrumpe para pedirle un embedding vectorial o una clasificación JSON trivial es una pésima optimización.

En esta actualización hemos descargado esas tareas auxiliares al NPU:

1. **`decider-0.8b`**: decisiones estructuradas rápidas con `json_schema` (rutas, llamadas a herramientas y validaciones de agentes).
2. **`qwen3-embedding-0.6b`**: generación de vectores para búsqueda semántica y RAG local.
3. **`qwen3-reranker-0.6b`**: reordenación de fragmentos recuperados antes de inyectarlos al contexto de Flash.

Halogen toma el control del NPU montando `/host/sys` y fija el reloj del tejido de la GPU a **2000 MHz** sostenidos mientras corre el NPU. Los tres modelos auxiliares consumen apenas ~4,2 GiB de memoria física fijada, dejando la GPU enteramente disponible para Flash-Next.

A través de **llama-swap v271**, los modelos del NPU se exponen como peers (`halogen-npu/decider-0.8b`, etc.), de forma que los agentes pueden atacarlos por endpoints estándar de OpenAI (`/v1/embeddings`, `/v1/rerank`, `/v1/chat/completions`) sin que la GPU se entere ni sufra desalojos de memoria.

---

## 4. Poda en el panel de control: menos ruido, más estabilidad

Con Halogen consolidado y el NPU cubriendo los flancos, los experimentos previos de convivencia que manteníamos en el servidor empezaban a estorbar más que ayudar:

- Retiramos **Gufo (Qwen3.8-27B en GPU)** y **Laya (modelo en CPU)** de la configuración de llama-swap. Mantenerlos en el grupo `gpu` implicaba el riesgo de que una petición despistada descargase Flash de la memoria de vídeo para montar un modelo obsoleto.
- Actualizamos el panel de control web en Cockpit (**Halo Control**): eliminamos las tarjetas y selectores de Gufo y Laya, dejando únicamente Halogen y sus compañeros del NPU.
- Rehabilitamos el servicio de telemetría y métricas (`halo-metrics.service`), que nos permite monitorizar temperaturas, frecuencias y ocupación del pool en tiempo real.

El principio de diseño es simple: **en producción, menos variedad de juguete y más estabilidad para el caballo de batalla**.

---

## 5. Mantenimiento semanal sin miedo: Btrfs, snapshots y ntfy

Tener un servidor doméstico basado en una distribución rolling-release como CachyOS (basada en Arch Linux) tiene una ventaja indudable: acceso inmediato a los últimos drivers de AMD, versiones recientes de XRT y kernels optimizados. Pero también tiene un peligro evidente: una actualización desatendida un martes por la tarde te puede dejar sin inferencia en mitad de una jornada de trabajo.

Para resolverlo sin tener que acordarme manualmente cada semana, hemos automatizado un ciclo de mantenimiento con una red de seguridad estricta:

```
Domingos 20:00 (timer systemd)
  │
  ├─ 1. ¿Hay inferencia activa?
  │      ├─ Sí → Espera hasta 30 min. Si sigue ocupado, aborta y avisa.
  │      └─ No → Procede.
  │
  ├─ 2. Snapshot de Btrfs previo (snapper: 'weekly-maintenance')
  │
  ├─ 3. pacman -Syu --noconfirm (snap-pac genera snapshot adicional)
  │
  ├─ 4. Apagado ordenado con aviso por ntfy (halo-shutdown-notify.service)
  │
  └─ 5. Reinicio del sistema y comprobación de salud del gateway
         └─ Aviso de encendido exitoso por ntfy
```

### La regla de oro con Docker
**Las imágenes de Docker de inferencia jamás se actualizan en este proceso.** Halogen y los runtimes están anclados por digest SHA256 inmutable. Lo que se actualiza los domingos son los paquetes del sistema operativo, el kernel y las bibliotecas base. Un cambio de versión de modelo o de runtime es siempre un acto consciente y documentado.

### Avisos al móvil con ntfy
Para tener visibilidad sin abrir una terminal:
- **Sábados a las 12:00**: recibo un aviso que me indica cuántos paquetes del sistema hay pendientes para el domingo.
- **Domingos al apagar**: una unidad de sistema (`halo-shutdown-notify.service`, ordenada estratégicamente antes de `shutdown.target` pero después de que la red siga viva) dispara el mensaje de apagado.
- **Al encender**: el servicio comprueba que llama-swap vuelve a responder en HTTP 200 y me confirma que el servidor está listo para trabajar.

Si cualquier actualización del sistema provocase un conflicto con el driver de GPU o el NPU, el procedimiento de rollback está verificado: restaurar el snapshot de Snapper anterior y volver a arrancar en menos de dos minutos.

---

## 6. Conclusiones

Tener un servidor de inferencia local no termina cuando consigues descargar un modelo y ver texto en una consola. La verdadera satisfacción llega cuando:

1. Tienes **8 slots con 128k de contexto** que no se caen ante prompts masivos.
2. Cuentas con un **NPU silencioso** que asume los embeddings y el enrutado de herramientas sin robarle ciclos a la GPU.
3. El sistema operativo **se actualiza solo cada semana**, se saca una foto de seguridad antes de tocar nada y te avisa al teléfono mientras cenas el domingo.

El Halo Strix ya no es un experimento de fin de semana: se ha convertido en una pieza de infraestructura fiable, predecible y lista para dar soporte a cualquier ejército de agentes que le echemos encima.
