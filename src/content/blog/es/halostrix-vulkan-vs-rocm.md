---
title: 'Vulkan o ROCm en Strix Halo: cómo fallé, medí y elegí un backend para inferencia local'
description: 'Un experimento con llama.cpp en AMD Strix Halo: memoria UMA, smokes fallidos, gates reproducibles y una comparación corta entre Vulkan e HIP/ROCm.'
lang: 'es'
translationKey: 'halostrix-vulkan-vs-rocm'
slug: 'vulkan-o-rocm-en-strix-halo'
pubDate: '2026-09-09T15:30:00+02:00'
tags: ['experiment', 'local-ai', 'amd', 'strix-halo', 'llama-cpp', 'vulkan', 'rocm', 'benchmarking']
draft: false
---

> **Estado del experimento.** Esta es una crónica de laboratorio, no una recomendación universal ni una guía de producción. Los números proceden de una prueba corta con una versión y un modelo concretos. No hubo *soak* térmico prolongado, evaluación de calidad ni una matriz amplia de modelos.

La pregunta parecía sencilla: en una APU AMD Strix Halo, ¿me convenía ejecutar `llama.cpp` con Vulkan o invertir en una compilación HIP/ROCm?

La respuesta no salió de una tabla genérica. Salió de varios fallos, de acotar mejor cada prueba y de decidir por adelantado qué tendría que mejorar HIP para sustituir a una base Vulkan que ya funcionaba.

## El equipo y el presupuesto de memoria real

El laboratorio usa un GMKtec EVO-X2 con Ryzen AI Max+ 395, Radeon 8060S (`gfx1151`), 128 GiB de memoria física y CachyOS. En una APU con memoria unificada, esa cifra comercial no equivale a 128 GiB disponibles para cualquier carga.

La primera configuración de BIOS, con UMA en automático, dejaba a Linux unos 62 GiB de RAM visible y al driver aproximadamente 31,2 GiB de GTT. La evidencia apuntaba a un *carve-out* de firmware, no a una reserva CMA normal del kernel.

Hice un cambio deliberadamente reversible: `UMA_SPECIFIED` con un *frame buffer* fijo de 2 GiB. Tras reiniciar y repetir el inventario:

| Configuración | RAM visible | VRAM fija | Límite GTT aproximado |
|---|---:|---:|---:|
| UMA Auto | 62 GiB | 64 GiB observados por AMDGPU | 31,2 GiB |
| UMA especificada | 123,5 GiB | 2 GiB | 61,7 GiB |

Esto no “creó” memoria. Recuperó para el sistema operativo memoria que el firmware había apartado de forma fija y dejó una ventana GTT dinámica mayor. También fijó el techo práctico del experimento: **memoria física, RAM visible, VRAM fija y GTT son magnitudes relacionadas, pero no intercambiables**.

## Antes de compilar: definir el criterio de promoción

Quería evitar una comparación en la que cada backend usara parámetros distintos. Congelé:

- el modelo `Qwen3-1.7B-Q8_0`;
- la misma cuantización y el mismo *offload*;
- `PP512` para procesado de prompt;
- `TG128` para generación;
- tres repeticiones;
- comprobaciones separadas de dispositivo, carga, generación, journal y limpieza.

El criterio también quedó escrito antes del resultado: HIP debía mejorar al menos un 5 % la métrica objetivo sin introducir una regresión inaceptable en generación. No es un umbral científico general; es una regla operativa de este laboratorio.

Separar PP y TG resultó importante. Un backend puede preparar el contexto más rápido y, a la vez, producir tokens más despacio. Un único promedio habría ocultado ese intercambio.

## Vulkan: llegar a una base que realmente se pueda medir

El primer obstáculo fue corriente: faltaban cabeceras de desarrollo de Vulkan. Instalarlas permitió configurar la compilación, pero no convirtió el primer *smoke* en una prueba fiable.

Ese intento se descontroló. La generación superó diez minutos y produjo un log de 6,4 GiB. En las muestras del principio y el final se mezclaban salida del modelo y líneas del controlador. La hipótesis principal fue contaminación por `stdin` o un límite de tokens que no estaba actuando como se esperaba, pero **no quedó demostrada una causa raíz única**.

Después aparecieron fallos menos espectaculares y muy instructivos:

- ambigüedad al decidir qué proceso era seguro terminar;
- un error de sintaxis Bash en el script de preparación;
- una validación demasiado frágil del proceso monitor;
- intentos detenidos antes de ejecutar el modelo porque el propio arnés no superaba sus gates.

La mejora no fue “volver a ejecutar hasta que funcionase”, sino limitar cada dimensión de daño. Este es el patrón reducido —con rutas genéricas— que quedó como referencia:

```bash
timeout --foreground --signal=TERM --kill-after=10s 120s \
  bash -c 'ulimit -f 131072; exec "$1" -m "$2" \
    -p "Reply with exactly: VULKAN_SMOKE_OK" \
    -ngl 999 -c 2048 -n 64 --temp 0 \
    --simple-io --no-display-prompt --no-warmup --log-disable' \
  _ "<LLAMA_CLI>" "<MODEL_PATH>" \
  </dev/null >"<LOG_DIR>/smoke.stdout" 2>"<LOG_DIR>/smoke.stderr"
```

Aquí hay tres límites independientes: 120 segundos, 64 tokens y un límite de tamaño por fichero. El prompt viaja como argumento y la redirección desde `/dev/null` evita heredar la entrada interactiva del controlador. Las unidades de `ulimit -f`, los valores concretos y los flags deben contrastarse con el shell y la ayuda de la build bajo prueba; no son contratos eternos.

También separé dos preguntas que antes estaban mezcladas:

1. **¿Carga el modelo y se descarga en la GPU?** Una ejecución sin generación confirmó `29/29 layers` en Radeon.
2. **¿Genera una salida corta, acotada y verificable?** Solo después de ese gate se habilitó el benchmark.

El baseline Vulkan resultante fue:

| Backend | PP512 | TG128 |
|---|---:|---:|
| Vulkan/RADV | 5263,79 ± 10,83 tok/s | 114,39 ± 0,24 tok/s |

Las lecturas térmicas y del journal de esa ventana corta no mostraron errores relevantes, pero eso **no sustituye** una prueba sostenida de temperatura, potencia o estabilidad.

## HIP/ROCm: varios “fallos” estaban en el procedimiento

La ruta HIP avanzó por gates independientes:

1. Primero no pude confirmar correctamente la ruta del compilador.
2. CMake detectó HIP, pero faltaba el metadato de desarrollo de `hipBLAS`.
3. El preflight de paquetes bloqueó la instalación por un falso positivo: encontró la palabra “linux” dentro de una URL del repositorio, no en el nombre de un paquete del kernel.
4. Tras corregir el parser e instalar un conjunto ROCm coherente, la compilación terminó.
5. Los primeros gates de dispositivo y enlazado rechazaron salida válida porque sus predicados eran demasiado estrictos.
6. Una reclasificación basada en la evidencia permitió completar carga, *smoke* y benchmark.

La lección aquí no es relajar cualquier comprobación que moleste. Es diseñar gates que validen la propiedad que importa. Buscar una palabra en texto arbitrario no equivale a inspeccionar nombres de paquetes; exigir una forma exacta de salida tampoco equivale a comprobar que la cadena HIP está realmente cargada.

## El resultado medido

Con el mismo modelo y las mismas dimensiones:

| Backend | PP512 | TG128 | Cambio frente a Vulkan |
|---|---:|---:|---:|
| Vulkan/RADV | 5263,79 ± 10,83 tok/s | 114,39 ± 0,24 tok/s | base |
| HIP/ROCm | 5448,84 ± 173,67 tok/s | 102,51 ± 0,17 tok/s | PP ≈ +3,5 %; TG ≈ −10,4 % |

HIP procesó el prompt algo más rápido, pero no alcanzó el 5 % de mejora definido para la promoción y empeoró claramente la generación. Para este modelo pequeño y este perfil de uso, mantuve Vulkan como baseline y conservé HIP como build experimental.

Eso no demuestra que Vulkan sea siempre más rápido en AMD, ni siquiera en este equipo. Modelos mayores, otras cuantizaciones, tamaños de lote o revisiones posteriores de `llama.cpp`, Mesa y ROCm pueden cambiar el resultado. La decisión es local, fechada y reversible.

## El workflow que me llevo

Mi secuencia para el siguiente backend será:

1. Inventariar hardware, memoria visible, GTT y versiones.
2. Definir modelo, parámetros y umbral de promoción antes de medir.
3. Validar configuración y compilación.
4. Confirmar dispositivo y enlazado con predicados específicos.
5. Ejecutar carga sin generación.
6. Ejecutar un *smoke* con límites de tiempo, tokens y salida.
7. Medir PP y TG por separado.
8. Revisar sensores, journal y procesos restantes.
9. Promover, conservar como experimental o revertir.

No todo fallo de un gate es un fallo del backend. En este recorrido hubo dependencias ausentes, un parser defectuoso y comprobaciones demasiado rígidas. Precisamente por eso conviene que los gates sean pequeños: permiten distinguir un problema de infraestructura de un resultado de rendimiento.

## Qué quedó establecido —y qué no

**Establecido por esta prueba:**

- la configuración UMA cambió de forma medible el presupuesto de RAM/GTT;
- ambas builds descargaron las 29 capas del modelo de prueba en la GPU;
- Vulkan e HIP completaron el mismo benchmark corto;
- con este workload, HIP ganó algo en PP y perdió más en TG;
- según el criterio previo, Vulkan debía seguir como baseline.

**No establecido:**

- estabilidad durante horas;
- calidad de respuesta;
- eficiencia energética comparada;
- comportamiento con modelos grandes o varias solicitudes;
- superioridad general de Vulkan sobre ROCm;
- preparación para producción.

Una última limitación documental: el repositorio de HalostrixLab todavía no tiene historial de commits. Las fechas y la secuencia proceden de sus notas de laboratorio y configuraciones versionadas por referencia, no de una cronología Git verificable. Por eso presento estos datos como el cierre provisional de un experimento, no como una verdad permanente.
