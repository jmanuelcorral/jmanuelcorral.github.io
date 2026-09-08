---
title: 'Put a Kibana in your life: ELK with ASP.NET Core and Docker'
description: 'A Docker Compose recipe for running Elasticsearch, Logstash and Kibana locally, and shipping your ASP.NET Core logs into it with Serilog.'
lang: 'en'
translationKey: 'aspnet-core-elk'
slug: 'elk-with-aspnet-core-and-docker'
pubDate: '2019-03-22T10:31:56-05:00'
updatedDate: '2026-09-08'
tags: ['aspnetcore', 'docker', 'elk', 'elasticsearch', 'kibana', 'logstash', 'beginner']
draft: false
---

> **Editorial note (2026 revision).** This article is from 2019 and describes an ELK 6.x/7.x stack with security switched off. It has been revised to fix a port mistake in the original and to modernise the Docker Compose syntax, but the example is still a **local development** setup. Modern Elasticsearch versions ship with authentication and TLS enabled by default, so whatever you actually run today will need a different configuration.

I recently had to add Logstash, Elasticsearch and Kibana support to a project.

So how do you set that up? The simplest way to get a development environment with Logstash, Elasticsearch and Kibana (ELK from here on) is to run all three and point your application at them. There are a few ways to do that:

- Install it locally from native packages.
- Pay for the SaaS version (there's a trial).
- Use a pre-built virtual machine image, Bitnami-style.
- Use containers.

If you've worked with containers before, here's a simple recipe you can drop into your `docker-compose.yml`, or keep as a `docker-compose.override.yml`. Either way you spin the whole stack up only when you need it.

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

The `version: '3.4'` line the original file carried is no longer needed: Docker Compose v2 ignores it and warns that it's obsolete.

The full example lives [in this repository](https://github.com/jmanuelcorral/elkSampleCompose). It includes the index configuration and its split filter, wired up so you can write from .NET (with Serilog) into Logstash and have it work end to end.

## Mind the port: Logstash does not listen on 9200

There's a mistake the original version of this post carried, and it's worth being blunt about it, because it is the number one cause of "no logs are showing up".

- **9200 is Elasticsearch.** That's where Logstash sends events once it has processed them.
- **8080 is Logstash**, because the example pipeline uses an `input { http { ... } }` block, and the Logstash HTTP plugin listens on `0.0.0.0:8080` by default.

Your application must target **Logstash**, not Elasticsearch:

- App running inside the same `docker-compose`: `http://logstash:8080`
- App running on your dev machine with only the stack in Docker: `http://localhost:8080`

## Shipping logs from .NET with Serilog

On .NET and .NET Core I'd go with Serilog and its HTTP sink (`Serilog.Sinks.Http`). The shape of it is this:

```csharp
Log.Logger = new LoggerConfiguration()
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.Http(requestUri: "http://logstash:8080")
    .CreateLogger();
```

> Illustrative snippet: the exact `WriteTo.Http` signature has changed across major versions of `Serilog.Sinks.Http` (recent versions, for instance, require an explicit `queueLimitBytes`). Check the overload that matches the version you install.

The sink batches events and posts them inside an array called `events`. That's why the example Logstash pipeline runs a `split` on that field — without it, every HTTP request would land in Elasticsearch as a single document instead of one document per log event.

## Changing the index name

The index pattern configured in the example is **`miindicemolon-`**. If you want a different one, change it in [the pipeline's `logstash.conf`](https://github.com/jmanuelcorral/elkSampleCompose/blob/master/elk/logstash/pipeline/logstash.conf), in the `output` section.

Then, in Kibana, create the matching index pattern (or data view, depending on your version) so you can actually see the data.
