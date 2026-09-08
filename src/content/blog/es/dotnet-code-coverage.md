---
title: 'Añade cobertura a tus tests en .NET'
description: 'Una receta simple para medir cobertura de código con Coverlet y ReportGenerator, tanto en local como en Azure DevOps.'
lang: 'es'
translationKey: 'dotnet-code-coverage'
slug: 'cobertura-de-codigo-en-dotnet'
pubDate: '2019-04-15T10:31:56-05:00'
updatedDate: '2026-09-08'
tags: ['dotnet', 'azure-devops', 'testing', 'code-coverage', 'beginner']
draft: false
legacyPath: '/Get-Coberture-working'
---

> **Nota editorial (revisión de 2026).** El artículo original es de 2019 y usaba .NET Core 2.2, el agente `Ubuntu 16.04` y tareas de Azure DevOps que ya no existen o están en desuso. He actualizado los ejemplos a versiones vigentes de las tareas y he añadido la forma recomendada hoy de recoger cobertura (`coverlet.collector`). Aun así, las versiones concretas de SDK y de paquetes envejecen rápido: ajústalas a lo que uses en tu proyecto.

En mi día a día, tener un indicador de cobertura me sirve para varias cosas:

- Saber cuánto código (en porcentaje) se ha comprometido o degradado en cada iteración.
- Saber qué partes del código no se han probado.
- Saber qué partes del código puedo borrar con cierta seguridad.

Creo que añadir una métrica de cobertura te ayuda a tomar decisiones. Ojo: te ayuda a *decidir*, no es un objetivo en sí mismo. Un 90 % de cobertura con tests que no comprueban nada no vale nada.

Como herramienta de cobertura uso [Coverlet](https://github.com/coverlet-coverage/coverlet), que extrae los valores de mi código, y luego genero un informe HTML con [ReportGenerator](https://github.com/danielpalme/ReportGenerator), que además me permite adjuntarlo a la build de Azure DevOps.

## Opción recomendada hoy: el colector

La forma más sencilla de arrancar es añadir el paquete `coverlet.collector` a tu proyecto de tests. Las plantillas actuales de `dotnet new xunit`, `nunit` y `mstest` ya lo incluyen:

```bash
dotnet add tests/MiAppMolona.Tests package coverlet.collector
```

Y a partir de ahí, recoger cobertura es un flag:

```bash
dotnet test --collect:"XPlat Code Coverage"
```

Eso deja un `coverage.cobertura.xml` dentro de `tests/MiAppMolona.Tests/TestResults/<guid>/`.

## La opción del post original: coverlet.msbuild

En 2019 yo usaba la integración por MSBuild. Sigue siendo válida y da más control sobre exclusiones y umbrales. Se añade editando el `.csproj` de tu librería de tests:

```xml
<ItemGroup>
  <PackageReference Include="coverlet.msbuild" Version="6.0.4">
    <PrivateAssets>all</PrivateAssets>
    <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
  </PackageReference>
</ItemGroup>
```

Y se lanza así:

```bash
dotnet test tests/MiAppMolona.Tests/MiAppMolona.Tests.csproj -p:CollectCoverage=true -p:CoverletOutputFormat=cobertura "-p:Exclude=[xunit.*]*" --logger trx
```

Fíjate en las comillas alrededor de `-p:Exclude`. Los corchetes y los asteriscos los interpreta el shell (sobre todo PowerShell y bash), y si no los escapas el filtro llega vacío o directamente peta.

## El informe en local

ReportGenerator es una herramienta global: se instala una sola vez por máquina.

```bash
dotnet tool install -g dotnet-reportgenerator-globaltool
```

Una vez instalada, la lanzas apuntando al XML de cobertura:

```bash
reportgenerator -reports:tests/MiAppMolona.Tests/**/coverage.cobertura.xml -targetdir:./CodeCoverage -reporttypes:Html
```

Y obtienes un informe HTML muy legible en la carpeta `CodeCoverage`.

## La pipeline de Azure DevOps

Este es el equivalente actualizado del YAML del post original:

```yml
name: Mi Build Molona

trigger:
- main

pool:
  vmImage: 'ubuntu-latest'

variables:
  buildConfiguration: 'Release'

steps:
- task: UseDotNet@2
  displayName: 'Instalar el SDK de .NET'
  inputs:
    packageType: sdk
    version: '8.0.x'

- task: DotNetCoreCLI@2
  displayName: 'Compilando la solución en configuración $(buildConfiguration)'
  inputs:
    command: build
    projects: '**/*.csproj'
    arguments: '--configuration $(buildConfiguration)'

- script: >
    dotnet test tests/MiAppMolona.Tests/MiAppMolona.Tests.csproj
    --configuration $(buildConfiguration)
    -p:CollectCoverage=true
    -p:CoverletOutputFormat=cobertura
    "-p:Exclude=[xunit.*]*"
    --logger trx
  displayName: 'Lanzando los tests unitarios'

- task: PublishTestResults@2
  displayName: 'Publicando el resultado de los tests'
  condition: succeededOrFailed()
  inputs:
    testRunner: VSTest
    testResultsFiles: '**/*.trx'

- script: |
    dotnet tool install -g dotnet-reportgenerator-globaltool
    reportgenerator \
      -reports:$(Build.SourcesDirectory)/tests/**/coverage.cobertura.xml \
      -targetdir:$(Build.SourcesDirectory)/CodeCoverage \
      -reporttypes:'Cobertura;HtmlInline_AzurePipelines'
  displayName: 'Generando el informe de cobertura'

- task: PublishCodeCoverageResults@2
  displayName: 'Publicando el informe de cobertura'
  inputs:
    summaryFileLocation: '$(Build.SourcesDirectory)/CodeCoverage/Cobertura.xml'
    pathToSources: '$(Build.SourcesDirectory)'
```

Qué ha cambiado respecto al original y por qué:

- `DotNetCoreInstaller@0` está retirada; hoy se usa `UseDotNet@2`. De paso, el YAML original tenía un despiste clásico: el `displayName` decía 2.2.103 y la versión instalada era la 2.2.105.
- La imagen `Ubuntu 16.04` ya no existe en los agentes hospedados. `ubuntu-latest` se mantiene sola.
- `PublishCodeCoverageResults@1` está en desuso. La versión 2 detecta el formato y no necesita ni `codeCoverageTool` ni `reportDirectory`.
- Le pido a ReportGenerator un informe `Cobertura` además del HTML, para publicar un único fichero consolidado en lugar de varios sueltos.
- Añadí `condition: succeededOrFailed()` a la publicación de tests: si un test falla, es justo cuando más quieres ver el informe.

Con esto tienes una pipeline que compila, pasa los tests y genera el informe de cobertura. No incluye la generación de artefactos, pero sirve perfectamente como build de validación de Pull Requests.

Si lanzas la build en Azure DevOps, el informe te aparece en una pestaña propia junto al de los tests 😎.
