---
title: 'Adding code coverage to your .NET tests'
description: 'A simple recipe for measuring code coverage with Coverlet and ReportGenerator, both locally and on Azure DevOps.'
lang: 'en'
translationKey: 'dotnet-code-coverage'
slug: 'code-coverage-for-dotnet-tests'
pubDate: '2019-04-15T10:31:56-05:00'
updatedDate: '2026-09-08'
tags: ['dotnet', 'azure-devops', 'testing', 'code-coverage', 'beginner']
draft: false
---

> **Editorial note (2026 revision).** The original article is from 2019 and used .NET Core 2.2, the `Ubuntu 16.04` agent, and Azure DevOps tasks that are now retired or deprecated. I've updated the samples to current task versions and added the approach recommended today (`coverlet.collector`). Even so, specific SDK and package versions age fast — pin whatever your project actually uses.

Day to day, a coverage number buys me a few things:

- Knowing how much code (as a percentage) I gained or lost in each iteration.
- Knowing which parts of the code have never been exercised.
- Knowing which parts of the code I can delete with some confidence.

A coverage metric helps you make decisions. Note the wording: it helps you *decide*, it isn't a goal in itself. Ninety per cent coverage from tests that assert nothing is worth nothing.

My coverage tool of choice is [Coverlet](https://github.com/coverlet-coverage/coverlet), which pulls the numbers out of my code. I then generate an HTML report with [ReportGenerator](https://github.com/danielpalme/ReportGenerator), which also lets me attach the result to an Azure DevOps build.

## The recommended option today: the collector

The easiest way in is to add the `coverlet.collector` package to your test project. Current `dotnet new xunit`, `nunit` and `mstest` templates already include it:

```bash
dotnet add tests/MiAppMolona.Tests package coverlet.collector
```

From there, collecting coverage is a single flag:

```bash
dotnet test --collect:"XPlat Code Coverage"
```

That drops a `coverage.cobertura.xml` into `tests/MiAppMolona.Tests/TestResults/<guid>/`.

## The original post's option: coverlet.msbuild

Back in 2019 I used the MSBuild integration. It's still valid and gives you finer control over exclusions and thresholds. Add it by editing your test library's `.csproj`:

```xml
<ItemGroup>
  <PackageReference Include="coverlet.msbuild" Version="6.0.4">
    <PrivateAssets>all</PrivateAssets>
    <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
  </PackageReference>
</ItemGroup>
```

And run it like this:

```bash
dotnet test tests/MiAppMolona.Tests/MiAppMolona.Tests.csproj -p:CollectCoverage=true -p:CoverletOutputFormat=cobertura "-p:Exclude=[xunit.*]*" --logger trx
```

Note the quotes around `-p:Exclude`. Brackets and asterisks get eaten by the shell (PowerShell and bash in particular), and without quoting the filter either arrives empty or the command fails outright.

## The local report

ReportGenerator is a global tool, so you install it once per machine:

```bash
dotnet tool install -g dotnet-reportgenerator-globaltool
```

Then point it at the coverage XML:

```bash
reportgenerator -reports:tests/MiAppMolona.Tests/**/coverage.cobertura.xml -targetdir:./CodeCoverage -reporttypes:Html
```

You get a very readable HTML report in the `CodeCoverage` folder.

## The Azure DevOps pipeline

Here's the updated equivalent of the YAML from the original post:

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
  displayName: 'Install the .NET SDK'
  inputs:
    packageType: sdk
    version: '8.0.x'

- task: DotNetCoreCLI@2
  displayName: 'Building the solution in $(buildConfiguration)'
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
  displayName: 'Running the unit tests'

- task: PublishTestResults@2
  displayName: 'Publishing unit test results'
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
  displayName: 'Creating the code coverage report'

- task: PublishCodeCoverageResults@2
  displayName: 'Publishing the code coverage report'
  inputs:
    summaryFileLocation: '$(Build.SourcesDirectory)/CodeCoverage/Cobertura.xml'
    pathToSources: '$(Build.SourcesDirectory)'
```

What changed from the original, and why:

- `DotNetCoreInstaller@0` is retired; `UseDotNet@2` replaces it. While I was there I fixed a classic slip in the original YAML: the `displayName` said 2.2.103 while the installed version was 2.2.105.
- The `Ubuntu 16.04` image no longer exists on hosted agents. `ubuntu-latest` keeps itself current.
- `PublishCodeCoverageResults@1` is deprecated. Version 2 detects the format and needs neither `codeCoverageTool` nor `reportDirectory`.
- I ask ReportGenerator for a `Cobertura` report alongside the HTML one, so I can publish a single consolidated file instead of several scattered ones.
- I added `condition: succeededOrFailed()` to the test publish step: a failing test run is exactly when you most want the report.

That gives you a pipeline that builds, runs the tests and produces a coverage report. It doesn't publish artifacts, but it works perfectly well as a pull request validation build.

Run it on Azure DevOps and the report shows up in its own tab, right next to the test results 😎.
