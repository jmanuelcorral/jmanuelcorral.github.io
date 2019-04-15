---
layout: post
title: Añade cobertura a tus tests en netcore
description: "Una receta simple que funciona en local y Azure DevOps"
comments: true
mathjax: false
typefix:
   indent: true
tags: [netcore, Principiante, azure devops, testing]
image:
  feature: "quality.jpg"
date: 2019-04-15T10:31:56-05:00
---
En mi día a dia, tener un indicador de cobertura me sirve para varias cosas:

- Saber cuanto código (en porcentage) se ha comprometido/degradado en cada iteración.
- Saber que partes del código no se han probado.
- Saber que partes del código puedo borrar con cierta seguridad.

Creo que añadir una metrica de cobertura, te puede ayudar a tomar decisiones.

Yo como herramienta de cobertura utilizo [coverlet](https://github.com/tonerdo/coverlet) que me permite extraer los valores de mi codigo, y luego genero un report en html con una herramienta que se llama [reportgenerator](https://github.com/danielpalme/ReportGenerator) que me permite además, adjuntarlo a la build de azure devops.

Para utilizar coverlet, necesitais añadirlo en vuestra librería de test, editando el csproj y añadiendo el package:

```xml
 <ItemGroup>
    <PackageReference Include="coverlet.msbuild" Version="2.6.0">
      <PrivateAssets>all</PrivateAssets>
      <IncludeAssets>build; contentfiles</IncludeAssets>
    </PackageReference>
  </ItemGroup>
```

Para configurarlo en una CI de Azure devops os dejo un yaml de ejemplo:

```yml
name: Mi Build Molona
trigger:
- master

pool:
  vmImage: 'Ubuntu 16.04'

variables:
  buildConfiguration: 'Release'
  Major: '1'
  Minor: '0'
  Patch: '1'

steps:
- task: DotNetCoreInstaller@0
  displayName: 'Use .NET Core sdk 2.2.103'
  inputs:
    version: 2.2.105

- task: DotNetCoreCLI@2
  displayName: 'Compiling Application Library with configuration: $(buildConfiguration)'
  inputs:
    command: build
    projects: '**/*.csproj'
    arguments: '--configuration $(BuildConfiguration)'

- script: dotnet test tests/MiAppMolona.Tests/MiAppMolona.Tests.csproj -p:CollectCoverage=true -p:CoverletOutputFormat=cobertura -p:Exclude=[xunit.*]* --logger trx
  displayName: 'Launching Unit Tests'

- task: PublishTestResults@2
  displayName: 'Publishing Unit Test Results'
  inputs:
    testRunner: VSTest
    testResultsFiles: '**/*.trx'

- script: |
    dotnet tool install -g dotnet-reportgenerator-globaltool
    reportgenerator -reports:$(Build.SourcesDirectory)/tests/MiAppMolona.Tests/**/coverage.cobertura.xml -targetdir:$(Build.SourcesDirectory)/CodeCoverage -reporttypes:HtmlInline_AzurePipelines
  displayName: Create Code coverage report

- task: PublishCodeCoverageResults@1
  displayName: 'Publish code coverage report'
  inputs:
    codeCoverageTool: Cobertura
    summaryFileLocation: '$(Build.SourcesDirectory)/tests/MiAppMolona.Tests/**/coverage.cobertura.xml'
    reportDirectory: '$(Build.SourcesDirectory)/CodeCoverage'
```

Con esto tendreis una pipeline que compila, pasa los tests y genera el report de cobertura. No está incluida la generación de artifacts, pero puede valer como una build para aceptar Pull Requests por ejemplo.

Las partes más importantes (que podeis replicar en local) seria lanzar los tests, con los parámetros para generar la cobertura.

```bash
dotnet test tests/MiAppMolona.Tests/MiAppMolona.Tests.csproj -p:CollectCoverage=true -p:CoverletOutputFormat=cobertura -p:Exclude=[xunit.*]* --logger trx
```

Utilizar reportgenerator, este último, tendreis que instalarlo tan solo una vez solo en vuestras máquina, haciendo:

```bash
dotnet tool install -g dotnet-reportgenerator-globaltool
```

Una vez lo tengais instalado, podeis lanzarlo así:

```bash
reportgenerator -reports:tests/MiAppMolona.Tests/**/coverage.cobertura.xml -targetdir:./CodeCoverage -reporttypes:HtmlInline_AzurePipelines
```

y obtendreis un bonito report de html en la caperta CodeCoverage, si lanzais la build de Azure Devops, el report se os genera en una tab junto al report de los tests 😎.