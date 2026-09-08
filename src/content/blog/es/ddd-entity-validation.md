---
title: 'Centrando las validaciones en el negocio'
description: 'Cómo valido hoy la lógica de negocio en proyectos DDD: entidades que solo existen si son válidas, ValueObjects y el patrón Result.'
lang: 'es'
translationKey: 'ddd-entity-validation'
slug: 'validaciones-en-entidades-de-dominio'
pubDate: '2020-06-04T10:31:56-05:00'
updatedDate: '2026-09-08'
tags: ['dotnet', 'ddd', 'validation', 'architecture']
draft: false
legacyPath: '/Validation-on-Entities'
---

> **Nota editorial (revisión de 2026).** Los fragmentos de código de la versión original tenían varios errores de sintaxis y nombres inconsistentes. Los he corregido y los he hecho coherentes entre sí. Aun así, siguen siendo **extractos ilustrativos**: llevan `...` donde se ha omitido código y no compilan tal cual copiados en un fichero. El planteamiento arquitectónico es el mismo que en 2020.

Una de las cosas que más me encuentro al arrancar un proyecto en equipo es que cada persona tiene su propia forma de hacer lógica de validación.

En mi caso distingo dos tipos:

- **Validación con elementos externos**: la que necesita ir a base de datos, a otro servicio o a cualquier fuente fuera del proceso.
- **Validación de negocio**: la que solo depende de las reglas del dominio.

En este post me centro en la **validación de negocio**.

A día de hoy, si sé que un proyecto va a crecer, apuesto por DDD. Si alguna vez has jugado con DDD sabes que normalmente hay más código, más capas y más arquitectura, pero a medio y largo plazo el mantenimiento y la extensibilidad se agradecen muchísimo.

Cuando trabajo así, no me parece buena aproximación usar DataAnnotations, FluentValidation ni nada por el estilo. Tienen su popularidad en el mundo .NET, pero contribuyen a crear modelos anémicos en lugar de un modelo de dominio rico.

## ¿DataAnnotations o FluentValidation?

Mucha gente defiende tener la lógica de validación en DataAnnotations porque es el punto de entrada al sistema. Otros, algo más puristas, dirán que estás añadiendo responsabilidades al DTO que las utiliza y que "rompe" SOLID.

Reconozco que yo también pasé por esas fases en mi juventud 😎. Pero hoy te digo, muy orgulloso, que no uso ninguna de las dos.

Para mí, cualquier solución que ponga la validación en una capa —un endpoint, un servicio— acaba obligándome tarde o temprano a validar lo mismo en varios sitios. Y eso, desde el punto de vista de la mantenibilidad, es un problema: si tengo la misma validación duplicada, alguien de mi equipo con poco contexto sobre esa pieza puede arreglar un bug de validación en una sola de las dos capas y dejar la otra rota.

## El siguiente paso: validaciones en servicios

Otra opción que he visto muchas veces, sobre todo en equipos que empiezan con DDD, es meter toda la lógica de validación en servicios. Por ejemplo:

```csharp
public class BankService
{
    public bool IsValidBank(Bank bank)
    {
        if (bank.Id == Guid.Empty) return false;
        if (string.IsNullOrWhiteSpace(bank.Name)) return false;
        if (bank.Bic.Length < 8 || bank.Bic.Length > 11) return false;

        return true;
    }
}
```

Este código se puede refactorizar para que sea mucho más legible. Es más: en lugar de un `bool` podrías devolver un objeto con el resultado de la validación, podrías usar FluentValidation y montar un contexto de validación, etc.

El problema de fondo es otro: cuando llamas a `IsValidBank`, **el banco ya existe**. Está instanciado en memoria, en tu objeto `Bank`, y no tiene por qué ser válido. Además, para construir un banco correctamente vas a necesitar siempre ese servicio, y con el paso del tiempo es muy fácil que alguien del equipo se salte ese paso.

## Entidades siempre válidas

En mi concepción de DDD parto siempre de la misma premisa: **una entidad de nuestro dominio solo puede existir si es válida**. Si consigo construir mi objeto de negocio, es que lo que contiene dentro es válido.

Para eso hay muchos mecanismos, pero el que más uso es el de Vladimir Khorikov: su librería [CSharpFunctionalExtensions](https://github.com/vkhorikov/CSharpFunctionalExtensions) y su tipo `Result`.

## Ejemplo

Voy a partir de una entidad de dominio anémica e ir refactorizando desde ahí. Por ejemplo, la entidad `Bank`:

```csharp
public class Bank
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public string BIC { get; set; }
}
```

Lo primero es trasladar la lógica de validación a cada una de las propiedades. Aprovechando `Result`, queda algo así:

```csharp
public class Bank
{
    private const int MaxNameLength = 250;

    public Guid Id { get; private set; }
    public string Name { get; private set; }
    // ...

    public Result<Bank> SetId(Guid value)
    {
        if (value == Guid.Empty)
            return Result.Failure<Bank>("Id incorrecto o mal inicializado");

        Id = value;
        return Result.Success(this);
    }

    public Result<Bank> SetName(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return Result.Failure<Bank>("Nombre incorrecto");

        if (value.Length > MaxNameLength)
            return Result.Failure<Bank>("Longitud de cadena incorrecta");

        Name = value;
        return Result.Success(this);
    }

    // ...
}
```

Fíjate en el detalle importante: tu objeto **muta** cada vez que hacemos un *set* válido, pero si el *set* es inválido tendremos un mensaje de error y el objeto **no** habrá mutado.

`Result` te da un contrato muy útil: si `IsSuccess` es `true`, tienes tu objeto ya mutado al nuevo estado en la propiedad `Value`; si no, tienes el mensaje de error en `Error`. Fácil, ¿no?

## Cuando la regla de negocio no cabe en un setter

Lo interesante viene ahora. En nuestro dominio, un BIC es un código bancario de **8 u 11 caracteres alfanuméricos** (los 3 últimos son opcionales) definido por la norma ISO 9362:

- **Código de entidad**: los 4 primeros caracteres identifican al banco.
- **Código de país**: los caracteres quinto y sexto, en formato ISO 3166-1 alfa-2. Para España, `ES`.
- **Código de localidad**: los caracteres séptimo y octavo. En España es habitual ver `MM`, pero conviene no tomárselo como una regla: el valor lo asigna SWIFT y no es necesariamente un acrónimo de la ciudad.
- **Código de oficina**: los 3 últimos caracteres identifican una sucursal concreta. Son opcionales; si no aparecen, se entiende que el código representa a la oficina principal, que por convenio se escribe `XXX`.

Meter toda esa lógica en un `SetBic` chirría a primera vista, y con razón.

En este punto hay quien te dirá que lo suyo es hacer un *helper* o un servicio de dominio. Con cualquiera de las dos opciones te enfrentas al mismo problema: no hay forma de obligar por diseño a que el resto del equipo pase por ahí (y no deberías acoplar ese servicio a la entidad). Ya sea por desconocimiento o por prisa, alguien acabará sin encontrar ese helper, y esa validación crecerá reimplementada en varios sitios rompiendo el principio DRY.

Pero en DDD tenemos los **ValueObjects** justo para esto. Un ValueObject no tiene identidad propia, pero sí lógica de negocio reutilizable.

```csharp
public class BicCode
{
    private const string MainOfficeCode = "XXX";
    private const int LengthWithoutBranch = 8;
    private const int LengthWithBranch = 11;

    private BicCode()
    {
    }

    public string BankCode { get; private set; }
    public string CountryCode { get; private set; }
    public string LocationCode { get; private set; }
    public string OfficeCode { get; private set; }

    public string Value => $"{BankCode}{CountryCode}{LocationCode}{OfficeCode}";

    public string NormalizedValue =>
        $"{BankCode}{CountryCode}{LocationCode}{(string.IsNullOrEmpty(OfficeCode) ? MainOfficeCode : OfficeCode)}";

    public Result<BicCode> SetBankCode(string bankCode)
    {
        if (!bankCode.IsFourLetterCharacters())
            return Result.Failure<BicCode>(Messages.InvalidBicCode);

        BankCode = bankCode.ToUpperInvariant();

        return Result.Success(this);
    }

    // ... SetCountryCode, SetLocationCode y SetOfficeCode siguen el mismo patrón

    public static Result<BicCode> Create(string input)
    {
        if (string.IsNullOrWhiteSpace(input))
            return Result.Failure<BicCode>(Messages.InvalidBicCode);

        var value = input.Trim().ToUpperInvariant();

        if (value.Length != LengthWithoutBranch && value.Length != LengthWithBranch)
            return Result.Failure<BicCode>(Messages.InvalidBicCodeLength);

        var bicCode = new BicCode();

        return Constraints
            .AddResult(bicCode.SetBankCode(value.Substring(0, 4)))
            .AddResult(bicCode.SetCountryCode(value.Substring(4, 2)))
            .AddResult(bicCode.SetLocationCode(value.Substring(6, 2)))
            .AddResult(bicCode.SetOfficeCode(
                value.Length == LengthWithBranch ? value.Substring(8, 3) : MainOfficeCode))
            .CombineIn(bicCode);
    }
}
```

Un par de notas sobre este fragmento:

- `IsFourLetterCharacters()` es un método de extensión propio, no algo de la BCL. Cada parte del BIC tiene su propia comprobación de formato.
- `Messages` es una clase de constantes con los mensajes de error, para no repartir literales por el dominio.
- La versión de 2020 aceptaba cualquier longitud entre 8 y 11. Eso permitía códigos de 9 o 10 caracteres, que no son válidos según ISO 9362. Aquí ya solo se aceptan 8 u 11.

Con el ValueObject hecho, lo incluimos en la entidad:

```csharp
public Result<Bank> SetBic(string value)
{
    var bicCode = BicCode.Create(value);

    if (bicCode.IsFailure)
        return Result.Failure<Bank>(bicCode.Error);

    Bic = bicCode.Value;

    return Result.Success(this);
}
```

## Construir solo lo válido

Queda una máxima que aún no hemos aplicado: si quiero crear algo en mi dominio, no puedo recurrir a un constructor. Los constructores admiten parámetros, pero no devuelven estado sobre lo que se ha creado, así que no me sirven para construir objetos con validación.

La solución es un método estático de fábrica que construya el objeto de negocio si y solo si es válido. Y para que nadie pueda crear instancias por otra vía, el constructor por defecto tiene que ser privado.

```csharp
private Bank()
{
}

public static Result<Bank> Create(string code, string name, string bic)
{
    var bank = new Bank();

    return Constraints
        .AddResult(bank.SetId(Guid.NewGuid()))
        .AddResult(bank.SetCode(code))
        .AddResult(bank.SetName(name))
        .AddResult(bank.SetBic(bic))
        .CombineIn(bank);
}
```

`Constraints` es un pequeño helper que tienes en el repositorio de GitHub que acompaña al post. Lo único que hace es acumular los `Result` de cada setter y combinarlos en uno solo, para que el código quede legible y para que el error que devuelves incluya *todos* los fallos, no solo el primero.

## Ventajas de trabajar así

Las ventajas son bastante claras:

- Si mis entidades existen, siempre son válidas.
- Si no se pueden crear, tengo un mensaje de error explicando qué ha fallado.
- Si la entidad tiene su propia lógica de construcción basada en su lógica de validación, no necesito servicios para construirla.

Además, puedo testear la lógica de negocio con tests unitarios puros, sin dobles ni infraestructura:

```csharp
[Theory]
[InlineData("CCRIES2A")]
[InlineData("MNTYESMM")]
[InlineData("CAGLESMM")]
[InlineData("SCFBESMM")]
[InlineData("SCFBESMMXXX")]
public void BicCodesShouldPass(string bicCode)
{
    // Act
    var myBicCode = BicCode.Create(bicCode);

    // Assert
    myBicCode.IsSuccess.Should().BeTrue();
}

[Theory]
[InlineData("4433", "Banco de Mundodisco", "SCFBESMM")]
[InlineData("3344", "Banco del MAL", "SCFBESMMXXX")]
public void BankShouldPass(string code, string name, string bic)
{
    // Act
    var myBank = Bank.Create(code, name, bic);

    // Assert
    myBank.IsSuccess.Should().BeTrue();
}
```

En la versión original, estos tests tenían un `[InlineData()]` vacío que habría hecho fallar la ejecución, y el orden de los argumentos no coincidía con el de `Bank.Create`. Ambas cosas están corregidas arriba.

Y como hacia fuera lo que devuelves es un `Result` —desde un Command, una Query o directamente desde un Controller—, ese código es portable y muy fácil de transformar en una salida estandarizada.

## Referencias y enlaces de interés

- [CSharpFunctionalExtensions](https://github.com/vkhorikov/CSharpFunctionalExtensions)
- [FluentValidation](https://fluentvalidation.net/)
- [Validación de modelos en ASP.NET Core](https://learn.microsoft.com/es-es/aspnet/core/mvc/models/validation)
- [Validation and DDD — Enterprise Craftsmanship](https://enterprisecraftsmanship.com/posts/validation-and-ddd/)
- [Functional C#: Primitive obsession — Enterprise Craftsmanship](https://enterprisecraftsmanship.com/posts/functional-c-primitive-obsession/)
- [Refactoring from Anemic Domain Model Towards a Rich One (Pluralsight)](https://www.pluralsight.com/courses/refactoring-anemic-domain-model)

## Código de ejemplo

[github.com/jmanuelcorral/DDDValidations](https://github.com/jmanuelcorral/DDDValidations)
