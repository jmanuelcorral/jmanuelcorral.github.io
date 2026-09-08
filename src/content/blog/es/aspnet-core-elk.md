---
title: 'Pon un Kibana en tu vida: ELK con ASP.NET Core y Docker'
description: 'Una receta con Docker Compose para levantar Elasticsearch, Logstash y Kibana en local, y enviarles los logs de tu aplicación ASP.NET Core con Serilog.'
lang: 'es'
translationKey: 'aspnet-core-elk'
slug: 'elk-con-aspnet-core-y-docker'
pubDate: '2019-03-22T10:31:56-05:00'
updatedDate: '2026-09-08'
tags: ['aspnetcore', 'docker', 'elk', 'elasticsearch', 'kibana', 'logstash', 'beginner']
draft: false
legacyPath: '/Add-Elk-to-aspnetcore'
---

> **Nota editorial (revisión de 2026).** Este artículo es de 2019 y describe un stack ELK 6.x/7.x sin seguridad activada. Se ha revisado para corregir un error de puerto del original y para actualizar la sintaxis de Docker Compose, pero el ejemplo sigue siendo un montaje **de desarrollo local**. En las versiones modernas de Elasticsearch la autenticación y TLS vienen activadas por defecto, así que la configuración real que necesites hoy será distinta.

El otro día, en un proyecto, tenía que añadir soporte para Logstash, Elasticsearch y Kibana.

¿Cómo lo montamos? Lo más sencillo para tener un entorno de desarrollo con Logstash, Elasticsearch y Kibana (de ahora en adelante, ELK) es poner los tres a funcionar y apuntar desde nuestra aplicación. Para eso hay varias opciones:

- Instalarlo en local, con paquetes nativos.
- Contratar la versión SaaS (hay periodo de prueba).
- Usar una máquina virtual preconfigurada, tipo Bitnami.
- Tirar de contenedores.

Si ya has trabajado con contenedores, lo que te dejo aquí es una receta simple que puedes añadir a tu `docker-compose.yml`, o generar como `docker-compose.override.yml`. Con eso levantas todo el stack solo cuando lo necesitas.

```yml
services:

  elasticsearch:
    build:
      context: elk/elasticsearch/
    volumes:
      - ./elk/elasticsearch/config/elasticsearch.yml:/usr/share/elasticsearch/config/elasticsearch.yml:ro
    ports:
      - "9200:9200"
      - "9300:9300"
    environment:
      ES_JAVA_OPTS: "-Xmx256m -Xms256m"

  logstash:
    build:
      context: elk/logstash/
    volumes:
      - ./elk/logstash/config/logstash.yml:/usr/share/logstash/config/logstash.yml:ro
      - ./elk/logstash/pipeline:/usr/share/logstash/pipeline:ro
    ports:
      - "8080:8080"
    environment:
      LS_JAVA_OPTS: "-Xmx256m -Xms256m"
    depends_on:
      - elasticsearch

  kibana:
    build:
      context: elk/kibana/
    volumes:
      - ./elk/kibana/config/:/usr/share/kibana/config:ro
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch
```

El `version: '3.4'` que llevaba el fichero original ya no hace falta: Docker Compose v2 lo ignora y avisa de que está obsoleto.

Tienes el ejemplo completo [en este repositorio](https://github.com/jmanuelcorral/elkSampleCompose). Ahí está incluso la configuración del índice y su *split filter*, montada para que puedas escribir desde .NET (con Serilog) contra Logstash y que funcione de principio a fin.

## Ojo con el puerto: Logstash no escucha en 9200

Aquí hay un error que arrastraba la versión original de este post y que conviene dejar muy claro, porque es la causa número uno de "no me llega ningún log".

- **9200 es Elasticsearch.** Es el puerto al que Logstash envía los eventos ya procesados.
- **8080 es Logstash**, porque el pipeline del ejemplo usa un `input { http { ... } }` y el plugin HTTP de Logstash escucha por defecto en `0.0.0.0:8080`.

Tu aplicación debe apuntar a **Logstash**, no a Elasticsearch. Es decir:

- Si tu aplicación está dentro del mismo `docker-compose`: `http://logstash:8080`
- Si tu aplicación corre en tu máquina de desarrollo y solo el stack está en Docker: `http://localhost:8080`

## Enviando logs desde .NET con Serilog

Para trabajar en .NET o .NET Core, te recomiendo Serilog con el sink HTTP (`Serilog.Sinks.Http`). La idea es esta:

```csharp
Log.Logger = new LoggerConfiguration()
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.Http(requestUri: "http://logstash:8080")
    .CreateLogger();
```

> Snippet ilustrativo: la firma exacta de `WriteTo.Http` ha cambiado entre versiones mayores del paquete `Serilog.Sinks.Http` (por ejemplo, en versiones recientes hay que pasar explícitamente `queueLimitBytes`). Comprueba la sobrecarga que corresponde a la versión que instales.

El sink agrupa los eventos y los envía en lotes dentro de un array llamado `events`. Por eso el pipeline de Logstash del ejemplo lleva un `split` sobre ese campo: sin él, cada petición HTTP acabaría como un único documento en Elasticsearch en lugar de un documento por evento de log.

## Cambiar el nombre del índice

El *index pattern* configurado en el ejemplo se llama **`miindicemolon-`**. Si necesitas cambiarlo, se hace en [el fichero `logstash.conf` del pipeline](https://github.com/jmanuelcorral/elkSampleCompose/blob/master/elk/logstash/pipeline/logstash.conf), en la sección `output`.

Después, en Kibana, tendrás que crear el *index pattern* (o *data view*, según la versión) que coincida con ese nombre para poder ver los datos.
