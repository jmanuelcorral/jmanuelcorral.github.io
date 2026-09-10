---
title: 'De un smoke ROCm a un laboratorio de fine-tuning: qué valida Docker y qué no'
description: 'Cómo estoy construyendo un laboratorio local de entrenamiento en AMD: un backward pass real, un workspace configurado, otro parcialmente validado y límites explícitos.'
lang: 'es'
translationKey: 'halostrix-rocm-training-lab'
slug: 'de-smoke-rocm-a-laboratorio-fine-tuning'
pubDate: '2026-09-09T15:29:00+02:00'
tags: ['experiment', 'local-ai', 'amd', 'rocm', 'docker', 'pytorch', 'fine-tuning', 'llama-factory', 'unsloth']
draft: false
---

> **Estado del experimento.** He validado cómputo y autograd básicos en la GPU. El workspace de LLaMA-Factory está solo configurado y planificado: no se ha ejecutado un smoke GPU de LlamaBoard ni un fine-tuning. En Unsloth Studio sí se validaron build, imports, detección GPU, health y UI, pero tampoco se entrenó un modelo. Una interfaz web sana o un `backward()` correcto no demuestran que LoRA, QLoRA, checkpoints y reanudación funcionen de extremo a extremo.

Después de estabilizar la inferencia local, quise explorar entrenamiento en la misma máquina AMD Strix Halo. La tentación era instalar un framework completo y pulsar “Train”. Elegí el camino contrario: una escalera de validación en la que cada peldaño responde una pregunta pequeña.

La idea central es sencilla: **Docker ayuda a controlar dependencias y operaciones, pero no convierte configuración en evidencia de entrenamiento**.

## Inferencia y entrenamiento son dos sistemas distintos

Aunque comparten GPU, GTT, RAM y almacenamiento, sus pilas tienen necesidades diferentes. La inferencia estaba funcionando con Lemonade y un backend `llama.cpp`; para entrenamiento validé primero un contenedor AMD PyTorch, configuré un workspace de LLaMA-Factory y validé parcialmente la integración de Unsloth Studio.

Los scripts de esos workspaces no detienen Lemonade ni administran otros servicios. Esa separación es intencionada, pero deja una responsabilidad operativa: antes de una carga real hay que decidir qué modelos residentes se descargan y cuánto margen de memoria se reserva. El aislamiento de procesos no elimina la contención del hardware.

## Primer gate: el smoke mínimo de PyTorch

Antes de introducir tokenizadores, datasets o frameworks, usé una imagen AMD PyTorch fijada por digest y un contenedor efímero. Ese smoke expuso `/dev/kfd` y `/dev/dri`; no usó `--privileged`, red del host, IPC del host, socket Docker ni montajes ROCm del host. Los workspaces posteriores sí restringen la configuración a `/dev/kfd` y un único nodo render.

El núcleo de la prueba fue deliberadamente pequeño:

```python
import torch

assert torch.version.hip
assert torch.cuda.is_available()

for dtype in (torch.float16, torch.bfloat16):
    a = torch.randn((2048, 2048), device="cuda", dtype=dtype, requires_grad=True)
    b = torch.randn((2048, 2048), device="cuda", dtype=dtype, requires_grad=True)
    loss = (a @ b).float().square().mean()
    loss.backward()
    torch.cuda.synchronize()
    assert torch.isfinite(loss)
    assert torch.isfinite(a.grad).all() and torch.isfinite(b.grad).all()
```

PyTorch detectó `gfx1151` y Radeon 8060S. Las multiplicaciones 2048×2048 en FP16 y BF16 terminaron con pérdida y gradientes finitos después de `backward()`. El contenedor se retiró al finalizar.

### Qué pasó

- la imagen arrancó sobre el runtime esperado;
- PyTorch vio una GPU AMD;
- FP16 y BF16 ejecutaron cálculo matricial;
- autograd produjo gradientes finitos;
- no quedaron contenedores del smoke.

### Qué sigue sin probar

- carga de un modelo o tokenizer;
- consumo de un dataset;
- paso de optimizador;
- entrenamiento durante varias iteraciones;
- creación y restauración de un checkpoint;
- evaluación de calidad;
- estabilidad térmica o de memoria bajo carga sostenida.

Este gate descarta algunos problemas básicos de runtime. No certifica entrenamiento de LLM.

## Segundo peldaño: un workspace de LLaMA-Factory

El workspace de LLaMA-Factory fija dos entradas importantes:

```dockerfile
ARG BASE_IMAGE=rocm/pytorch@sha256:<AMD_IMAGE_DIGEST>
ARG LLAMAFACTORY_COMMIT=<PINNED_COMMIT>
FROM ${BASE_IMAGE}
```

La imagen base se referencia por digest y la fuente por commit. Eso reduce cambios accidentales y permite atribuir una build, aunque **no garantiza reproducibilidad byte a byte**: dependencias transitivas de APT o Python todavía pueden variar.

Compose expone únicamente los dispositivos AMD necesarios, liga la interfaz web a loopback por defecto, añade un health check y persiste explícitamente modelos, datasets, salidas y cachés:

```yaml
devices:
  - /dev/kfd:/dev/kfd
  - ${RENDER_DEVICE}:${RENDER_DEVICE}
ports:
  - 127.0.0.1:7860:7860
volumes:
  - ./data/models:/workspace/models
  - ./data/datasets:/workspace/data
  - ./data/outputs:/workspace/saves
healthcheck:
  test: ["CMD", "python3", "-c", "<LOOPBACK_HEALTH_PROBE>"]
```

La configuración separa `build`, `start`, `status`, `logs`, `stop` y `cleanup`. El script de arranque está diseñado para usar una imagen ya construida, validar el nodo render y esperar salud sin reconstruir implícitamente. No se ha demostrado que LlamaBoard arranque sano ni que vea la GPU.

Existe una receta pequeña de LoRA BF16 con batch 1, acumulación de gradiente, una época y un máximo de 100 muestras. Contiene marcadores para modelo y dataset y no se ejecuta automáticamente. Su existencia demuestra **intención de prueba**, no un resultado.

### Qué está configurado

- base AMD y fuente de LLaMA-Factory fijadas;
- exposición mínima de dispositivos;
- persistencia diferenciada;
- health check y scripts de ciclo de vida;
- receta de POC BF16 preparada.

### Qué no está demostrado

- smoke GPU dentro de LlamaBoard;
- ejecución LoRA o QLoRA;
- pérdida de entrenamiento;
- checkpoints o reanudación;
- calidad del adaptador resultante.

## Tercer peldaño: integrar Unsloth Studio sin sustituir el stack AMD

Unsloth Studio exigió otro enfoque porque su combinación de dependencias no era la misma. La build usa una base PyTorch distinta, compila el frontend en una etapa Node separada y aplica constraints para conservar las versiones AMD de Torch y Triton. También falla si aparecen sustituciones CUDA/NVIDIA.

En la validación registrada pasaron:

- build y `pip check`;
- importación de Torch, Triton y Unsloth;
- detección de Radeon 8060S y `gfx1151`;
- endpoint de salud;
- carga de la aplicación web.

El contenedor se ejecuta sin root, publica en loopback, recibe únicamente KFD y un nodo render, y persiste por separado estado de Studio, proyectos, caché y temporales. La contraseña es obligatoria y permanece en configuración local privada; no forma parte del repositorio ni de este artículo.

Pero dos límites son especialmente importantes:

- `bitsandbytes` no está instalado, así que QLoRA de cuatro bits no está disponible en el stack registrado;
- una ruta FLA avisó de fallback a CPU porque no consideraba compatible ese Triton.

Por tanto, el resultado correcto es “Studio, imports, GPU y health pasan”, no “Unsloth entrena en Strix Halo”.

## Seguridad operativa también forma parte del experimento

Un laboratorio reproducible no es solo un Dockerfile. En estos workspaces he intentado reducir el radio de impacto:

- sin modo privilegiado;
- sin red o IPC del host;
- sin socket Docker dentro del contenedor;
- sin exponer todo `/dev/dri`;
- puertos ligados a loopback por defecto;
- UID/GID y grupo del dispositivo explícitos donde el framework lo requiere;
- credenciales únicamente en configuración local;
- bind mounts separados para distinguir código, caché y resultados.

Esto no convierte el entorno en una plataforma endurecida. Sí hace visibles las concesiones y evita que una prueba necesite acceso al host que no puede justificar.

## Rollback: la imagen no es el estado completo

Los scripts están diseñados para registrar el ID real de la imagen construida y arrancar desde un ID retenido. Eso configura un mecanismo de rollback de binario más fiable que confiar solo en un tag mutable, pero este artículo no afirma que se haya ejecutado un rollback completo.

Sin embargo, volver a una imagen anterior **no revierte**:

- datasets;
- modelos descargados;
- adaptadores y checkpoints;
- bases de datos o estado de autenticación;
- migraciones sobre datos persistentes.

Por eso una actualización necesita dos planes: rollback de imagen y copia/compatibilidad de datos. Los pins y digests mejoran la repetibilidad de las entradas, pero tampoco vuelven hermético todo el grafo de paquetes.

## La limpieza destructiva es una decisión de arquitectura

Ambos workspaces tratan la limpieza como una operación con gates:

```bash
./cleanup.sh --dry-run   # inventario, no borra
./cleanup.sh --all       # exige confirmación explícita
```

El modo seco domina aunque se combine con flags destructivos. Antes de borrar, los scripts revalidan rutas y labels exactos del proyecto; no usan coincidencias parciales, comodines ni `docker system prune`. Las pruebas usan Docker falso y datos sintéticos, e incluyen recursos ajenos, symlinks y fallos parciales.

Es fácil considerar esto “fontanería” ajena al experimento de ML. Yo lo veo al revés: si una iteración no se puede detener, inspeccionar, conservar o limpiar con seguridad, el laboratorio no es repetible.

## El siguiente experimento honesto

El próximo gate útil no es entrenar un modelo grande. Es un LoRA BF16 pequeño y acotado que demuestre, en este orden:

1. modelo y dataset explícitos y revisados;
2. atribución del trabajo a la GPU;
3. pérdida finita durante varias iteraciones;
4. límites de tiempo, memoria y temperatura;
5. checkpoint creado;
6. proceso detenido y reanudado desde ese checkpoint;
7. salida y licencias revisadas;
8. limpieza sin afectar a otros servicios o datos.

Solo entonces tendría sentido hablar de viabilidad práctica, rendimiento o comparar frameworks.

## Matriz de resultados

| Área | Probado | Configurado | No probado |
|---|---|---|---|
| PyTorch ROCm | GPU, FP16/BF16, `backward()`, gradientes finitos | contenedor efímero limitado | modelo, dataset, optimizador, checkpoint |
| LLaMA-Factory | — | workspace, controles operativos, persistencia, health check y receta LoRA BF16 | build/arranque de LlamaBoard, smoke GPU y cualquier fine-tuning |
| Unsloth Studio | build, imports, GPU, health y UI | aislamiento, autenticación y persistencia | entrenamiento; QLoRA 4-bit no disponible |
| Operación | dry-run y tests de limpieza | rollback por ID de imagen | rollback automático de datos |

La conclusión provisional es menos vistosa, pero más útil: ya tengo una base para experimentar sin confundir detección de GPU con entrenamiento validado. El laboratorio está evolucionando; todavía no es una plataforma de fine-tuning lista para uso sostenido.

Como limitación adicional, HalostrixLab aún no tiene historial de commits. La secuencia procede de documentación fechada, artefactos fijados y resultados registrados, no de una cronología Git que permita reconstruir cada cambio.
