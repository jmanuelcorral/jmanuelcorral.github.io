---
title: 'Configurando Kubernetes en Windows 10'
description: 'Levantar un clúster de Kubernetes en Windows 10 con Docker Desktop no era un camino de rosas. Estos son los trucos que a mí me desatascaron el proceso.'
lang: 'es'
translationKey: 'kubernetes-windows-10'
slug: 'configurar-kubernetes-en-windows-10'
pubDate: '2019-03-18T10:31:56-05:00'
updatedDate: '2026-09-08'
tags: ['kubernetes', 'windows', 'docker', 'beginner']
draft: false
legacyPath: '/Setup-Kubernetes-en-win10'
---

> **Nota editorial (revisión de 2026).** Este artículo se escribió en 2019, cuando Docker Desktop usaba el backend de Hyper-V y compartir unidades era un paso obligatorio. El texto se ha revisado para corregir un consejo inseguro del original —desactivar el firewall— y para actualizar la terminología del producto. Aun así, es un artículo histórico: los menús, las versiones y el backend por defecto de Docker Desktop han cambiado desde entonces, así que trátalo como contexto y no como una guía paso a paso literal.

Poner en marcha Kubernetes en Windows 10 tenía su miga. A mí me costó más de lo que esperaba: solo quería un clúster local para hacer pruebas y acabé peleándome con memoria, permisos de disco y reglas de red.

Mi recomendación de partida sigue siendo la misma: instala la última versión estable de **Docker Desktop para Windows** y activa Kubernetes desde sus ajustes (*Settings → Kubernetes → Enable Kubernetes*). Docker Desktop trae un clúster de un solo nodo ya integrado, que para desarrollo local es más que suficiente.

Estos son los pasos que a mí me sacaron del atasco.

## 1. Súbele la memoria a Docker

Con la asignación por defecto, muchas imágenes se caen sin dar una explicación clara. En 2019 subí la memoria a **4096 MB** y los problemas desaparecieron; si vas a levantar bases de datos (SQL Server, Elasticsearch y compañía) probablemente necesites más.

Lo encontrarás en *Settings → Resources*. Si usas el backend de WSL 2, la memoria no se configura ahí sino en el fichero `%UserProfile%\.wslconfig`:

```ini
[wsl2]
memory=6GB
processors=4
```

## 2. No desactives el firewall: abre lo justo

El consejo original de este post era desactivar el firewall de Windows porque bloqueaba `vpnkit`, el proceso que Docker Desktop usa para publicar puertos. **No hagas eso.** Desactivar el firewall entero para arreglar un problema de desarrollo local deja tu máquina expuesta y, además, oculta cuál era el problema real.

Lo correcto es acotar:

- Comprueba en *Firewall de Windows Defender → Permitir una aplicación* que los procesos de Docker Desktop (`vpnkit.exe`, `com.docker.backend.exe`, `Docker Desktop.exe`) están permitidos en el perfil de red que estés usando. Si tu red está clasificada como *Pública*, muchas reglas no aplican: cambia la red a *Privada* en lugar de tirar el firewall abajo.
- Si tienes un antivirus o un firewall de terceros, revisa **sus** logs. En mi experiencia, la mayoría de los bloqueos de `vpnkit` venían de ahí y no del firewall de Windows.
- Un cliente de VPN corporativa activo también puede secuestrar la red de Docker. Prueba a desconectarlo temporalmente para descartarlo.

Si desactivas el firewall y funciona, eso solo te dice *dónde* está el bloqueo, no que la solución sea dejarlo desactivado. Vuelve a activarlo y crea la regla concreta.

## 3. Comparte la unidad de disco (solo con el backend Hyper-V)

Para montar volúmenes desde Windows había que compartir explícitamente la unidad con Docker (en mi caso la `C:`), en *Settings → Resources → File Sharing*.

Este paso, y los problemas de credenciales que arrastraba con cuentas de Azure AD, **son historia si usas el backend de WSL 2**: los ficheros se comparten directamente y no hay que autenticar nada. Si aún estás en Hyper-V, migrar a WSL 2 te ahorrará ese dolor.

## 4. Lee los logs antes de improvisar

Docker Desktop deja sus logs en:

```text
%LOCALAPPDATA%\Docker\log
```

Normalmente el fichero activo es el que no lleva número al final. Ahí es donde vas a ver de verdad si lo que falla es la VM, el arranque del clúster o la descarga de las imágenes de control plane (que la primera vez tarda un buen rato y parece que se ha colgado, pero no).

También ayuda comprobar el contexto de `kubectl`, porque es un fallo clásico apuntar al clúster equivocado:

```bash
kubectl config get-contexts
kubectl config use-context docker-desktop
kubectl get nodes
```

En versiones antiguas el contexto se llamaba `docker-for-desktop`; hoy es `docker-desktop`.

## 5. Si todo falla, reset de fábrica

Cuando algún paso se ejecuta en el orden equivocado, Docker Desktop se queda en un estado raro del que no sale. En *Settings → Troubleshoot* tienes **Reset Kubernetes cluster** (borra solo el clúster) y **Reset to factory defaults** (borra todo).

Empieza siempre por el primero: recrear el clúster suele ser mano de santo y no te lleva por delante las imágenes que ya tengas descargadas.
