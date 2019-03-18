---
layout: post
title: Configurando Kubernetes en Windows 10    
description: "Configurar Kubernetes en Windows 10 para montar un cluster no es un camino de rosas, pero aquí te enseño algun truco que te puede ayudar a desatascar cosas."
mathjax: false
typefix:
   indent: true
tags: [Kubernetes, Principiante, Windows, Trucos]
image:
  feature: "photo-1494412651409-8963ce7935a7.jfif"
date: 2019-03-18T10:31:56-05:00
---
Es complicado echar a andar Kubernetes en windows 10. A mi me ha costado un poco, quería empezar a hacer pruebas y no ha sido tan sencillo como esperaba.

Mi recomendación a día de hoy es que os descargueis la ultima versión estable de docker para windows.
Los pasos que he seguido han sido:
 - Subirle la memoria de docker a 4096 (Si utilizais bases de datos, muchas imagenes dan problemas si no hay suficiente memoria).
   ![Memoria]({{ site.url }}/images/dockermem.png)
 - Desactivar el firewall, esto es debido a que bloquea el comando vpnkit que es necesario para que kubernetes funcione.
 - Compartir la unidad de disco con Docker (en mi caso la unidad C), si teneis Azure AD el bug aquel que había, a día de hoy no pasa, pero si os pasa [link](https://dagope.github.io/2019/03/10/compartir-discos-docker-usuario-azuread/).
    ![Disco]({{ site.url }}/images/dockershare.png)
 - Leer los logs de Docker/Kubernetes que estan en **%LOCALAPPDATA%\Docker** (Normalmente el fichero de log actual, no tendrá numero )
 - Si todo falla, o algun paso no se ejecuta en el orden correcto... Hacer un factory reset (esto suele ser mano de santo.)
    ![Reset Fabrica]({{ site.url }}/images/dockerreset.png)