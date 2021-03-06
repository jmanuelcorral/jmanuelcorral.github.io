---
layout: post
title: Centrando validaciones en negocio
description: "Como a día de hoy valido logica de negocio"
comments: true
mathjax: false
typefix:
   indent: true
tags: [netcore, DDD, validations]
image:
  feature: "validation.jpg"
date: 2020-06-04T10:31:56-05:00
---

Una de las cosas que más me encuentro a la hora de enfocar un proyecto dentro de un equipo, es que cada uno tiene una forma diferente de hacer lógica de validación.

En mi caso, estructuro 2 tipos de validación:

- Validación con elementos externos (es la validación en la que necesitamos ir a base de datos a consultar algo, etc).
- Validación de Negocio.

En este post me centraré en la **validación de negocio**.

A dia de hoy si sé que un proyecto va a crecer apuesto por DDD. Si alguna vez has jugado DDD, normalmente hay más codigo, más capas, más arquitectura... pero luego el mantenimiento y la extensibilidad a medio-largo plazo es muy agradecido.

Cuando se trata de validaciones en un proyecto en el que hago DDD no me parece buena aproximación usar ni DataAnnotations, ni  FluentValidations, ni nada por el estilo. Creo que tienen su popularidad en el mundo del desarrollo .net, pero contribuyen a crear modelos anémicos en vez de un modelo DDD rico.

### ¿DataAnnotations o FluentValidation?

Muchos developers dicen que esyá bien tener lógica de validación en  DataAnnotations, por que es el punto de entrada a tu sistema, otros, algo más puristas, dirán que estas añadiendo responsabilidades al Dto que las utiliza y que "Rompe" SOLID.

Reconozco que yo en mi juventud también pasé por esas fases 😎. Pero a día de hoy me siento super orgulloso contandote que ahora mismo no utilizo ninguna de ellas.

Para mí cualquier solución que implique tener una validación en una Capa, ya sea en un Endpoint o en un servicio, hará que tarde o temprano necesite validar en varios puntos validaciones muy parecidas (a veces incluso la misma). Con esto quiero decir que tendré que validar lo mismo en dos sitios. Esto desde el punto de vista de la "mantenibilidad" es un problema, si tengo validaciones en dos sitios, alguien de mi equipo que tenga poco contexto de una pieza de codigo puede por ejemplo arreglar un bug de validación solo en una capa por ejemplo.

### Avanzando con validaciones en Servicios

Otra opción que a lo largo de los años he visto, es en equipos que estan arrancando con DDD, es que meten toda la logica de validación en servicios. Por ejemplo:

```csharp
public class BankService
...
public bool IsValidBank(Bank bank) 
{
    if (bank.Id == guid.Empty) return false;
    if (string.IsNullOrWhiteSpace(bank.Name)) return false;
    if !((bank.Bic.Length >=8 && bank.Bic.Length <=11)) return false;
}
```

En este caso, podrás refactorizar el codigo para que sea mucho más legible, es más podrías devolver en vez de un booleana un objeto con el resultado de la validación, podrías utilizar FluentValidation y montar un contexto de validación, etc. El problema es que ya has representado un banco en una entidad (está instanciado en memoria con tu objeto Bank) y no tiene por que ser valido.

El problema además, es que para construir un Banco siempre voy a necesitar ese servicio, y eso es algo que con el paso del tiempo podría evolucionar a que no todo mi equipo va a pasar por ahí.

## Entities Válidas

En mi concepción de DDD parto siempre de la premisa de que una Entity en nuestro dominio, sólo puede existir si es válida. Si puedo construir mi objeto de negocio, es que lo que contiene dentro es válido.

Para hacer esto tenemos muchos mecanismos. Pero el que más utilizo es de Vladimir Khorikov, Utilizar su librería C# Functional Extensions.

## Ejemplo

Tomaré como ejemplo una entidad de dominio anémica y a partir de ahí iré refactorizando. Por ejemplo la entidad Banco:

```csharp
public class Bank
{
    public Guid Id {get;set;}
    public string Name {get;set;}
    public string BIC {get;set;}
}
```

Lo primero que haremos es trasladar la logica de validación a cada uno de nuestras propiedades. En el caso de aprovechar las C# Functional Extensions, podemos utilizar Result y una vez implementado queda algo así:

```csharp
public class Bank
{
    private const int MaxLenghtName = 250;
    public Guid Id {get; private set;}
    public string Name {get; private set;}
    ...

    public Result<Bank> SetId(Guid value) {
      if (value== Guid.Empty())
       return Result.Failure<Bank>("Id incorrecto o mal inicializado");
      Id = value;
      return Result.Success(this);
    }

     public Result<Bank> Name(string value) {
      if (string.IsNullOrWhitespace(value) ))
       return Result.Failure<Bank>("Nombre incorrecto");
      if (value.Length >= MaxLenghtName))
       return Result.Failure<Bank>("Longitud de cadena incorrecta");
      Name = value;
      return Result.Success(this);
    }
    ...
}
```

Si te fijas, de esta forma, tu objeto **Muta** cada vez que hacemos un *Set* válido, pero si el *Set* es Inválido, tendremos un mensaje de error, y el objeto no habrá mutado. El Objeto result te da un contrato muy util, si su propiedad Success es true, puedes obtener tu objeto **Mutado** al nuevo estado en la propiedad Value. Si no Tendrás el Mensaje de error en la propiedad Error. ¿Fácil no? 

Lo interesante viene ahora. Siguiendo el ejemplo para nuestro negocio un BIC, es un codigo bancario,que puede tener entre 8 y 11 dígitos (los 3 últimos son opcionales):

- Código de entidad: está representado por los 4 primeros dígitos del código SWIFT / BIC y sirve para identificar al banco.
- Código de país: se encuentra en el quinto y sexto dígito del código, y se utiliza para identificar el país del banco. Para España se utiliza el código ES.
- Código de localidad: el séptimo y octavo número representa a la ciudad de la entidad bancaria. Lo más habitual es que sea Madrid (MM) o Barcelona (BB).
- Código de oficina: los últimos tres dígitos sirven para identificar una oficina concreta de la entidad financiera. Estos tres números son opcionales, si no aparecen en el código, se entiende que representa a la oficina principal de la entidad.

Hacer esa lógica en un SetBic es una cosa que probablemente nos chirríe a primera vista. 

En este momento, hay developers que te dicen, que lo suyo sería hacer un Helper, o Un servicio de Dominio. Tanto si decides hacer un helper como un servicio de dominio, te vas a enfrentar al problema de que no hay forma de que puedas obligar a otros developers a pasar por ese servicio o helper por diseño (no deberías acoplarlo a la entity), y ya sea por desconocimiento o falta de voluntad, puede que alguien de tu equipo no acabe encontrando ese helper o servicio. Por lo que esa validación con el paso del tiempo podría crecer reimplementándose en varios helpers, rompiendo el principio DRY. 

Pero en DDD tenemos los ValueObjects para esto. Al final un ValueObject no tiene "identidad" por si mismo pero si lógica de negocio que puede ser reutilizable.

podríamos hacer un ValueObject parecido a este:

```csharp
public class BicCode
{
    private const string MainOfficeCode = "XXX";
    private const int MaxLength = 11;
    private const int MinLength = 8;

    private BicCode()
    {
    }
    ...
    public string BankCode { get; private set; }
    public string CountryCode { get; private set; }
    public string LocationCode { get; private set; }
    public string NormalizedValue => $"{BankCode}{CountryCode}{LocationCode}{MainOfficeCode}";
    public string OfficeCode { get; private set; }

    public string Value
    {
        get
        {
            return $"{BankCode}{CountryCode}{LocationCode}{OfficeCode}";
        }

        private set
        {
            BankCode = value.Substring(0, 4).ToUpperInvariant();
            CountryCode = value.Substring(4, 2).ToUpperInvariant();
            LocationCode = value.Substring(6, 2).ToUpperInvariant();
            if (value.Length > MinLength)
            {
                OfficeCode = value.Substring(8).ToUpperInvariant();
            }
        }
    }

    public Result<BicCode> SetBankCode(string bankCode)
    {
        if (!bankCode.IsFourLetterCharacters())
        {
            return Result.Failure<BicCode>(Infrastructure.Messages.InvalidBicCode);
        }

        BankCode = bankCode.ToUpperInvariant();

        return Result.Success(this);
    }

    ...

    public static Result<BicCode> Create(string input)
    {
        if (string.IsNullOrEmpty(input))
        {
            return Result.Failure<BicCode>(Infrastructure.Messages.InvalidBicCode);
        }

        if (input.Length < MinLength || input.Length > MaxLength)
        {
            return Result.Failure<BicCode>(Infrastructure.Messages.InvalidBicCodeLength);
        }

        var bicCode = new BicCode();
        //Aqui llamariamos a los diferentes Setters, que devuelve cada uno un result y combinaríamos el resultado.

        return Result.Success(bicCode);
    }
```

Una vez hecho el ValueObject podríamos incluirlo de la siguiente forma en la entity:

```csharp
public Result<Bank> SetBIC(string value)
{
    var bicCode = BicCode.Create(documentId);
    if (bicCode.isFailure)
        return Result.Failure<Bank>(bicCode.Error);
    _BicCode = bicCode.Value;
    return Result.Success(this);
}
```

Si nos fijamos, una máxima que hemos de seguir y que aún no hemos aplicado en nuestra entity, es que si quiero crear algo en nuestro dominio, no podemos recurrir a un constructor, ya que los constructores aunque son parametrizables, no devuelven estado de lo que se crea. Es por eso que no nos sirven en este caso para construir Objetos con Validación.

Lo que debemos hacer, es recurrir a una función estática que nos permita construir nuestro objeto de negocio si y solo si es válido, y para que nadie pueda crear instancias de nuestro objeto si no es desde este método, deberemos de hacer que el constructor por defecto sea privado.

```csharp

private Bank() {}

public static Result<Bank> Create(string code, string name, string bic)
{
    var bank = new Bank();
    return Constraints
            .AddResult(bank.SetName(command.Name))
            .AddResult(bank.SetCode(command.Code))
            .AddResult(bank.SetBiC(command.Bics))
            .CombineIn(bank);
}
```

Esa clase Constraints, es un pequeño Helper que os dejo en el repositorio de Github que acompaña el post, que ayuda a que el código sea un poco más legible.

## Ventajas de trabajar así

Para empezar, las ventajas son muy claras, mis entidades si existen siempre serán validas, y si no puedo crearlas, tendré mensajes de error de que es lo que falla. Si mis entidades tienen su propia logica de construcción basada en lógica de validación, no necesito servicios para construir dichas entidades.

Además, podré testear mi logica de negocio con tests unitarios, tal que así:

```csharp
[InlineData("CCRIES2A")]
[InlineData("MNTYESMM")]
[InlineData("CAGLESMM")]
[InlineData("SCFBESMM")]
[InlineData("SCFBESMMXXX")]
[Theory]
public void BicCodesShouldPass(string bicCode)
{
    // Arrange
    Result<BicCode> myBicCode;
    // Act
    myBicCode = BicCode.Create(bicCode);
    // Assert
    myBicCode.IsSuccess.Should().BeTrue();
}

[InlineData()]
[InlineData("4433","SCFBESMM","Banco de Mundodisco")]
[InlineData("3344","SCFBESMMXXX", "Banco del MAL")]
[Theory]
public void BankShouldPass(string code, string bicCode, string name)
{
    // Arrange
    Result<Bank> myBank;
    // Act
    myBank = Bank.Create(code, bicCode, name);
    // Assert
    myBank.IsSuccess.Should().BeTrue();
}

```

Y si ahora devolviendo hacia fuera un resultado, ya sea desde un Command, una Query o directamente desde un Controller, este código es portable y fácil de transformar en una "salida" estandarizada.

## Referencias y links de interés

- [https://fluentvalidation.net/](https://fluentvalidation.net/)
- [https://docs.microsoft.com/es-es/aspnet/core/mvc/models/validation?view=aspnetcore-3.1](https://docs.microsoft.com/es-es/aspnet/core/mvc/models/validation?view=aspnetcore-3.1)
- [https://enterprisecraftsmanship.com/posts/validation-and-ddd/](https://enterprisecraftsmanship.com/posts/validation-and-ddd/)
- [https://enterprisecraftsmanship.com/posts/functional-c-primitive-obsession/](https://enterprisecraftsmanship.com/posts/functional-c-primitive-obsession/)
- [https://www.pluralsight.com/courses/refactoring-anemic-domain-model](
https://www.pluralsight.com/courses/refactoring-anemic-domain-model)

## Código de ejemplo

[https://github.com/jmanuelcorral/DDDValidations](https://github.com/jmanuelcorral/DDDValidations)