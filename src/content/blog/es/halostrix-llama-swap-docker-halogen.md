---
title: 'Menos espera, más agentes: así renové mi stack de IA local'
description: 'De Lemonade y Vulkan a llama-swap, Docker y Halogen: cómo renové mi stack de IA local para poner a trabajar agentes. Rendimiento, decisiones y resultados explicados sin una sopa de siglas.'
lang: 'es'
translationKey: 'halostrix-llama-swap-docker-halogen'
slug: 'de-12-t-s-a-128k-fontaneria-halo-strix'
pubDate: '2026-09-18T10:00:00+02:00'
tags: ['experiment', 'local-ai', 'amd', 'strix-halo', 'llama-swap', 'docker', 'halogen', 'qwen', 'inference']
category: 'ai'
kind: 'Experimento · Inferencia'
experimentCategory: 'inference'
draft: false
---

Hay un momento muy concreto en el que tener una IA en casa pierde parte de su glamour: le pides algo, te quedas mirando la pantalla y empiezas a negociar contigo mismo si dará tiempo a hacer un café.

Ese era un poco el ambiente en mi Halo Strix. Funcionaba, que no es poca cosa. Pero yo quería usarlo para ayudarme a programar, no para practicar la contemplación.

En los últimos días he cambiado buena parte de los programas que lo hacen funcionar. He pasado de **Lemonade Server y Vulkan** a una combinación de **llama-swap, Docker y Halogen**. Parece que he cambiado dos nombres raros por tres. Un progreso discutible, visto así.

La gracia está en qué hace cada uno y en lo que ahora puedo hacer con ellos.

## Primero: ¿qué tengo montado en casa?

Mi equipo es un **AMD Strix Halo con 128 GiB de memoria**. Un ordenador pequeño con bastante memoria, compartida entre el procesador y la parte gráfica. No es un centro de datos, aunque mis planes para él a veces no se hayan enterado.

Lo uso para ejecutar modelos de IA en mi propia máquina, en lugar de mandar las preguntas a un servicio que hace los cálculos en la nube.

Uno de los modelos que he estado probando es **Qwen3.8-Flash-Next**. Pero con el modelo solo no haces nada: necesitas un **runtime bien calibrado**, el programa que lo carga y ejecuta los cálculos para generar respuestas. Tener el modelo descargado es el principio, no el trabajo terminado.

Mi finalidad nunca ha sido chatear. A mí lo que me gusta es sacar el látigo y poner a trabajar **agentes de programación**. Y ahí una tarea son muchas consultas seguidas, uso de herramientas, lectura masiva de archivos... Cada espera cuenta.

## Lo que tenía funcionaba, pero yo quería pedirle más

Al principio usaba **Lemonade Server** para elegir modelos, cargarlos y conectar mis aplicaciones. Por debajo trabajaba **llama.cpp**, el runtime, con **Vulkan**, la tecnología que le permitía aprovechar la parte gráfica del ordenador.

No hace falta memorizarlo. La versión corta es: Lemonade organizaba el servicio y llama.cpp hacía los cálculos.

Con Flash-Next, cuando ponía **dos peticiones a trabajar a la vez**, me quedaba alrededor de **12 tokens por segundo de decode por petición**: 12,38 de media en el ensayo del 15 de septiembre. Con una sola petición, esa misma serie llegó a 16,13 de media. No era un techo absoluto del modelo, pero sí una referencia bastante poco emocionante para lo que yo quería hacer.

¿Tokens, decode, prefill? Vamos a ponerle nombre a las dos esperas antes de llenar esto de números.

También probé a pedir varias respuestas a la vez. El ordenador sacaba más trabajo en conjunto, pero cada respuesta se generaba más despacio. Como abrir más cajas en el supermercado y descubrir que todas comparten al mismo cajero.

**Mi objetivo dejó de ser solo «que el modelo arranque». Quería conversaciones largas, varias peticiones y libertad para probar otros runtimes sin desmontar todo lo demás.**

## Tokens, prefill y decode: qué estamos cronometrando

Un **token** es un trocito de texto: una palabra, parte de ella o un signo. El *tokenizador* del modelo se encarga de partir el texto y contarlo. No cuento palabras a ojo: uso los contadores y tiempos que devuelve el runtime. Dos modelos pueden dividir el mismo texto de forma distinta, así que sus cuentas no siempre coinciden.

| Fase | Qué está haciendo la IA | Cómo medimos la velocidad |
|---|---|---|
| **Prefill** | Procesar la entrada: instrucciones, historial, archivos y resultados de herramientas | Tokens de entrada realmente procesados divididos entre los segundos dedicados a esa fase |
| **Decode** | Generar los nuevos tokens de la respuesta, incluido el razonamiento cuando lo hay | Tokens generados divididos entre los segundos dedicados a generarlos |

Ambas velocidades se expresan en **tokens por segundo**, abreviado t/s o tps. Por ejemplo, 120 tokens generados en 10 segundos son 12 t/s de decode. Eso no incluye lo que haya tardado antes en leer la entrada o esperar turno.

Para comparar pruebas miro también cuántas peticiones había a la vez y si el runtime pudo reutilizar texto ya procesado. Si una prueba aprovecha esa caché y otra empieza de cero, no están haciendo el mismo trabajo.

Leer y escribir no cuestan lo mismo. Un agente que acaba de incorporar muchos archivos puede tardar en arrancar la respuesta aunque luego escriba deprisa. Por eso me importan **las dos velocidades**, además del tiempo que espero hasta ver contenido.

## Dos Qwen con apellido parecido, pero muy distintos

Antes de Flash-Next jugué con **Qwen3.8-27B**, uno de mis primeros modelos. En aquel momento yo veía muchísimo hype alrededor de él en la comunidad y, claro, había que probarlo. No iba a quedarme sin mi correspondiente tarde de experimentos.

Ese **27B** significa unos 27.000 millones de parámetros, los valores aprendidos del modelo. Es un modelo **denso**: a grandes rasgos, utiliza el conjunto de sus capas en cada paso de generación.

**Qwen3.8-Flash-Next no es el 27B con un modo rápido activado.** Es otro modelo, con una arquitectura de *mezcla de expertos* (MoE): en parte de sus cálculos selecciona qué grupos de parámetros usar para cada token, en vez de activar todos los expertos. Puede tener muchos parámetros en total sin utilizarlos todos a la vez. Eso cambia las necesidades de memoria y de ejecución; no garantiza que vaya a volar con cualquier runtime. El apellido Flash, por desgracia, no sustituye a los ajustes.

Fue con el **27B**, no con Flash-Next, con el que tuve un corte de conexión mientras seguía procesando la entrada. [Lo resolví actualizando Lemonade](/es/blog/qwen38-27b-local-lemonade-sse/). Era un problema de cuánto esperaba el servidor, no una señal de que hubiera que tirar el ordenador por la ventana.

Ese fallo y los cambios de estos días son asuntos distintos. **No abandoné Lemonade porque todo estuviera roto; cambié el montaje para poder experimentar con otras piezas.**

## El nuevo reparto: quién recibe, quién calcula y dónde vive

Para entender lo que he montado, imagina una cocina:

| Pieza | Su trabajo, sin manual de instrucciones |
|---|---|
| **llama-swap** | Recibe los pedidos de mis aplicaciones y los dirige al runtime configurado. Es el encargado de sala |
| **Halogen** | Ejecuta el modelo y prepara las respuestas. Es quien cocina |
| **Docker** | Mantiene el runtime y sus dependencias en un entorno separado. Es la cocina equipada, no otro cocinero |

El camino de una petición queda así:

**Mi aplicación → llama-swap → Halogen dentro de Docker → respuesta.**

**llama-swap hace de proxy**: recibe la petición y la pasa al runtime que tenga configurado, alojado en un contenedor Docker. ¿Por qué Docker? Para probar runtimes y modelos con arquitecturas distintas sin mezclar versiones incompatibles de sus bibliotecas. Cada entorno lleva sus dependencias y, de paso, no dejo la máquina hecha un vertedero. Eso no convierte un modelo incompatible en compatible: el runtime sigue teniendo que soportarlo.

La ventaja de llama-swap es tener **una misma puerta de entrada para las aplicaciones**, aunque cambie el runtime de detrás. Eso no significa que todos los modelos entiendan las mismas herramientas o admitan los mismos tamaños de conversación: esas diferencias todavía hay que configurarlas y probarlas.

Mi preocupación al migrar a Docker era el rendimiento: bastante estaba esperando ya como para añadir otra capa que se comiera lo ganado. Los resultados del nuevo montaje me han sorprendido gratamente. Para mi laboratorio, la discusión de si merece la pena usar contenedores está bastante resuelta.

## Docker sin miedo al peaje de rendimiento

Aquí hay un matiz importante: **en este Linux nativo, Docker no está emulando otro ordenador**. Los procesos del contenedor comparten el núcleo del sistema y acceden a la GPU mediante los dispositivos que les habilito. Se separa el entorno de ejecución, no se simula la tarjeta gráfica.

Eso no significa que cualquier configuración tenga coste cero. Tampoco he comparado el mismo runtime, versión y carga dentro y fuera de Docker para medir ese coste por separado. Mi conclusión es práctica: el rendimiento del conjunto me convence y la comodidad que gano también. No atribuyo a Docker la mejora que corresponde al cambio de runtime.

Y una vez resuelta mi preocupación inicial, estas son las ventajas que me hacen querer quedarme:

| Lo que quiero hacer | Lo que me aporta Docker en este montaje |
|---|---|
| Probar otro runtime | Preparar su entorno sin mezclar sus bibliotecas con las del anterior |
| Conservar una versión que funciona | Fijar exactamente la imagen usada, en lugar de descargar «la última» cada vez |
| Cambiar el programa sin descargar otra vez el modelo | Guardar los archivos del modelo fuera del contenedor, separados del software |
| Parar un experimento | Detener su contenedor sin hacer una limpieza general de todo el laboratorio |
| Volver a una configuración conocida | Conservar la imagen, los archivos y los ajustes que ya había probado |

La **imagen** es el paquete del que sale ese contenedor. En mi configuración queda fijada por su huella digital: una forma de identificar el contenido exacto, no solo un nombre que mañana podría apuntar a otra versión.

Además, los archivos del modelo se montan en **solo lectura**: el runtime puede usarlos, pero no modificarlos desde ese montaje. Tiene su encanto cuando te acabas de descargar casi 118 GiB y no te apetece repetir la excursión.

¿La letra pequeña? Todos los contenedores siguen compartiendo la misma máquina. **Docker no crea memoria, no duplica la GPU y no actualiza por arte de magia el controlador del ordenador.** Tampoco convierte cualquier programa en seguro: dar acceso al grupo Docker concede un control enorme sobre el equipo.

Me ayuda a ordenar el taller. No me compra otro taller.

## Halogen: aquí sí cambia quien hace los cálculos

Halogen es un runtime especializado para este hardware y la familia de modelos que estaba explorando. Para probarlo descargué su paquete **W4B Quality**, con los archivos del modelo y los componentes que necesita. No bastaba con cambiarle el nombre al archivo que ya usaba con Vulkan.

También hay una contrapartida: **Halogen es un runtime cerrado, con licencia propia**, no software de código abierto que pueda inspeccionar y recompilar libremente. Es parte de la decisión, no un detalle que desaparezca porque los tiempos me gusten.

Una de las pruebas más ilustrativas consistió en darle un texto repetitivo muy largo y pedirle recuperar una clave situada al principio:

| Configuración probada | Texto de entrada, en tokens | Espera hasta ver el primer contenido |
|---|---:|---:|
| Halogen con W4B Quality | 105.074 | Unos **78 segundos** |
| Qwen3-Coder con Vulkan | 120.033 | Unos **24 minutos** |

Ambas devolvieron la clave y terminaron la respuesta. Esa diferencia de espera hizo que retirara Coder del catálogo activo, conservando sus archivos por si quería volver.

**Ojo: esto no compara Flash-Next a 12 t/s contra Halogen.** Aquí cambia también el modelo y la forma de dividir el texto en tokens. Mide la espera hasta ver contenido, no la velocidad pura de lectura ni la de escritura. No permite decir «Halogen es tantas veces más rápido».

Lo que sí cuenta es una experiencia concreta: para aquella petición larga, una configuración me tuvo esperando mucho menos. Y eso, cuando estás delante de la pantalla, importa bastante.

## Más sitio para conversar, sin confundirlo con más inteligencia

Ahora tengo configurada una ventana de **128K de contexto**, es decir, 131.072 tokens.

El *contexto* es el texto que el modelo puede tener en cuenta dentro de una petición: instrucciones, conversación, archivos, resultados de herramientas y espacio para su respuesta. Imagínalo como una mesa de trabajo. Una mesa más grande permite tener más papeles abiertos; no convierte automáticamente al que se sienta en ella en mejor programador.

En mi configuración la salida tiene un máximo de 8.192 tokens, que **también ocupa parte de esa mesa**. No son 128K de entrada más una respuesta gratis.

¿Me sirve? Para trabajar con código, poder incluir más material antes de recortar el historial es útil. ¿Demuestra que vaya a encontrar todos los detalles de una conversación enorme? No. La prueba de la clave es una comprobación pequeña, no un examen de comprensión lectora universal.

## Y después llegaron cuatro peticiones a la vez

El siguiente paso fue habilitar cuatro puestos de trabajo simultáneos, los llamados *slots*. Para comprobarlos lancé cuatro peticiones juntas y repetí la ronda. Cada una llevaba unos 7.800 tokens de entrada y produjo 512 de salida, contando el razonamiento.

| Prueba con cuatro peticiones | Espera hasta el primer contenido de cada una | Tiempo hasta terminar las cuatro |
|---|---:|---:|
| Primera ronda | Unos **28 segundos** | Unos **55 segundos** |
| Repetición, reutilizando el texto ya procesado | Entre **1,3 y 1,5 segundos** | Unos **27 segundos** |

Las ocho respuestas terminaron correctamente.

La segunda ronda aprovechó la **caché**: el runtime había guardado trabajo hecho al procesar el principio de las peticiones y pudo reutilizarlo. No estaba aprendiendo algo nuevo ni memorizando para siempre; simplemente no tenía que rehacer toda esa parte.

Es la diferencia entre volver a leer un expediente desde la portada y retomarlo con los separadores ya puestos.

Esto prueba cuatro peticiones simultáneas de ese tamaño, **no cuatro agentes programando durante horas ni cuatro conversaciones de 128K llenas**. Todavía tengo deberes.

## El antes y el después, sin abrir una terminal

| Necesidad | Antes | Ahora |
|---|---|---|
| Conectar mis aplicaciones a la IA | Lemonade Server | llama-swap como entrada común |
| Ejecutar el modelo | llama.cpp con Vulkan | Halogen dentro de Docker |
| Probar alternativas | Partía del runtime gestionado por Lemonade | Puedo preparar runtimes en entornos separados y conectarlos a la misma entrada |
| Mantener el servicio funcionando al cerrar la sesión | Ya usaba un servicio de Lemonade | Configuré uno para llama-swap, con reinicio del programa si se para |
| Deshacer la migración | Era la configuración de partida | Lemonade sigue instalado, pero desactivado; conservé configuración y archivos |

También usé **Cockpit**, una interfaz de terminal para explorar y lanzar pruebas. La norma ahora es sencilla: o hago pruebas desde ahí o dejo que el servicio gestione el runtime. No pongo a dos encargados a encender y apagar la misma cocina.

## Lo que falta antes de darme demasiadas palmaditas

Las pruebas documentadas son de los últimos días; aún tengo que darle rodaje y ajustar valores. No son una garantía de funcionamiento permanente. Aún falta:

- Mantenerlo trabajando durante horas y observar memoria, temperatura y errores.
- Comparar una, dos y cuatro peticiones con el mismo trabajo para elegir mejor los ajustes.
- Probar cuatro conversaciones realmente largas a la vez y evaluar la calidad de las respuestas.

Y una advertencia importante: el despliegue privado del laboratorio tiene una excepción de acceso por red local **sin cifrado ni contraseña**. Los equipos admitidos por esa regla pueden consultar y administrar el servicio. No es una configuración para copiar sin más; los ejemplos públicos del repositorio sí parten de acceso local autenticado y contemplan un frontal cifrado para acceso remoto.

## Links y referencias

### Las piezas del stack

- [AI Toolbox Cockpit](https://github.com/kyuz0/ai-toolbox-cockpit): la interfaz de terminal que usé para explorar modelos y lanzar runtimes en contenedores. Es este Cockpit, no el panel de administración de servidores del mismo nombre.
- [Halogen](https://github.com/peonist-ai/halogen-flash-server): el runtime especializado que uso ahora. Aquí están su documentación, configuración y licencia; que tenga repositorio público no significa que el runtime sea de código abierto.
- [llama-swap](https://github.com/mostlygeek/llama-swap): el proxy que recibe las peticiones y gestiona el arranque y cambio de runtimes según la configuración.
- [AMD Strix Halo Toolboxes](https://github.com/kyuz0/amd-strix-halo-toolboxes): imágenes y recetas para ejecutar llama.cpp con Vulkan y ROCm en Strix Halo, sin montarlo todo a mano.
- [llama.cpp](https://github.com/ggml-org/llama.cpp): el runtime de código abierto con el que empecé y que sigue siendo una referencia para ejecutar modelos en local.
- [Lemonade Server](https://github.com/lemonade-sdk/lemonade): el servidor con el que monté la primera versión del laboratorio, antes de esta migración.

### Mis pruebas y configuraciones

La historia y las mediciones completas están en [HalostrixLab](https://github.com/jmanuelcorral/halostrixlab). Esta entrada resume las pruebas del 14 al 17 de septiembre, con los últimos cambios publicados el día 18:

- [Ensayos de Qwen3.8-Flash-Next](https://github.com/jmanuelcorral/halostrixlab/blob/master/docs/ensayos-qwen38-flash-next.md): decode por petición en la serie del día 15 y rendimiento agregado en el ensayo del día 16, dos medidas diferentes.
- [Investigación de Docker y los runtimes](https://github.com/jmanuelcorral/halostrixlab/blob/master/docs/investigacion-docker-toolboxes-halogen.md): las alternativas y sus límites.
- [Despliegue de Halogen y pruebas posteriores](https://github.com/jmanuelcorral/halostrixlab/blob/master/docs/despliegue-halogen-128k.md): contexto largo, cuatro peticiones, memoria y comprobaciones pendientes.
- [Herramientas del laboratorio](https://github.com/jmanuelcorral/halostrixlab/tree/master/workspaces/inference): programas y ejemplos de configuración para quien quiera entrar en los detalles.
