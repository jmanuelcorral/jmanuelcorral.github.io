---
layout: post
title: Pon un kibana en tu vida  
description: "Nunca ha sido más facil añadir soporte a tu aplicativo para que funcione con los productos de Elastic Logstash y Kibana"
comments: true
mathjax: false
typefix:
   indent: true
tags: [aspnetcore, Principiante, docker, elk, elastic, kibana, logstash]
image:
  feature: "photo-1494412651409-8963ce7935a7.jfif"
date: 2019-03-22T10:31:56-05:00
---
El otro día, para un proyecto tenía que añadir soporte a Logstash, elasticsearch y kibana. 

¿Como lo hacemos? Lo más sencillo, para tener un entorno de desarrollo que tenga logstash, elasticsearch y kibana (de ahora en adelante ELK) sería poner a trabajar los 3 y apuntar desde nuestro aplicativo, para configurar un entorno de esas características tenemos varias opciones:
- Instalarlo en local (no sé si hay paquetes para windows, algo así como un lamp).
- Contratar la versión SASS (hay una trial de 30 días...).
- Con una Maquina virtual tipo Bitnami (estos ultimos tienen hasta certificadas para cloud).
- Tirar de contenedores.

Si ya has trabajado con contenedores, lo que te voy a dejar es una simple receta, que puedes añadir a tu ```docker-compose.yml```, o generarlo como ```docker-compose.override.yml```, con esto, podrás poner en marcha todo el stack, solo cuando lo necesites
```yml
version: '3.4'

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
Tienes el ejemplo completo [aquí](https://github.com/jmanuelcorral/elkSampleCompose), en este ejemplo está hasta la configuración de un indice, y su split filter hecho para que puedas, por ejemplo desde .net (con serilog) escribir contra logstash (con el sink de http) y funcione.

Una vez montado, si vas a trabajar en .net o netcore, te recomiendo que utilices serilog y el sink de http, apuntando a la url de ```http://logstash:9200``` si tu aplicativo está en el ```docker-compose```, en el caso de que todo esté en tu maquina de development, lo hagas contra ```http://localhost:9200```

El index-pattern configurado en el ejemplo se llama **miindicemolon-** si necesitas cambiarlo, lo puedes hacer [aqui](https://github.com/jmanuelcorral/elkSampleCompose/blob/master/elk/logstash/pipeline/logstash.conf)