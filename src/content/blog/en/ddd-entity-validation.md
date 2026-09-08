---
title: 'Keeping validation where the business lives'
description: 'How I validate business rules in DDD projects today: entities that can only exist if they are valid, value objects, and the Result pattern.'
lang: 'en'
translationKey: 'ddd-entity-validation'
slug: 'validation-inside-domain-entities'
pubDate: '2020-06-04T10:31:56-05:00'
updatedDate: '2026-09-08'
tags: ['dotnet', 'ddd', 'validation', 'architecture']
draft: false
---

> **Editorial note (2026 revision).** The code snippets in the original version had several syntax errors and inconsistent names. I've fixed them and made them consistent with each other. They are still **illustrative excerpts**: they contain `...` where code was omitted and won't compile as-is if you paste them into a file. The architectural argument is the same one I made in 2020.

One of the things I run into most when a team starts a project is that everybody has their own idea of how validation logic should work.

I split it into two kinds:

- **Validation against external state**: anything that needs the database, another service, or any source outside the process.
- **Business validation**: anything that depends only on domain rules.

This post is about **business validation**.

These days, if I know a project is going to grow, I reach for DDD. Anyone who has worked with DDD knows the trade: more code, more layers, more architecture up front — and maintenance and extensibility that pay you back handsomely over the medium and long term.

When I work that way, I don't think DataAnnotations, FluentValidation or anything in that family is a good fit. They're popular in the .NET world, but they push you towards anaemic models instead of a rich domain model.

## DataAnnotations or FluentValidation?

Plenty of people argue for keeping validation logic in DataAnnotations because that's the entry point to your system. Others, a bit more purist, will tell you that you're piling responsibilities onto the DTO that uses them and "breaking" SOLID.

I'll admit I went through both phases in my younger days 😎. But today I'll happily tell you I use neither.

For me, any solution that puts validation in a layer — an endpoint, a service — sooner or later forces me to validate the same thing in more than one place. From a maintainability standpoint that's a problem: with the same rule duplicated, a teammate with little context on that piece of code can fix a validation bug in one layer and leave the other one broken.

## The next step: validation in services

Another pattern I've seen a lot, especially in teams getting started with DDD, is to push all the validation logic into services:

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

You can refactor this into something far more readable. You could return a validation result object instead of a `bool`, you could bring in FluentValidation and set up a validation context, and so on.

But the real problem is somewhere else: by the time you call `IsValidBank`, **the bank already exists**. It's sitting in memory as a `Bank` instance with no guarantee of being valid. On top of that, building a bank correctly now always requires that service — and over time it's very easy for someone on the team to skip it.

## Entities that are always valid

My take on DDD always starts from the same premise: **an entity in your domain can only exist if it is valid**. If I managed to construct the business object, then what's inside it is valid.

There are many ways to get there. The one I use most is Vladimir Khorikov's: his [CSharpFunctionalExtensions](https://github.com/vkhorikov/CSharpFunctionalExtensions) library and its `Result` type.

## An example

Let's start from an anaemic domain entity and refactor from there. Say, a `Bank`:

```csharp
public class Bank
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public string BIC { get; set; }
}
```

The first move is to push the validation logic onto each property. Using `Result`, that looks like this:

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
            return Result.Failure<Bank>("Invalid or uninitialised id");

        Id = value;
        return Result.Success(this);
    }

    public Result<Bank> SetName(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return Result.Failure<Bank>("Invalid name");

        if (value.Length > MaxNameLength)
            return Result.Failure<Bank>("Name is too long");

        Name = value;
        return Result.Success(this);
    }

    // ...
}
```

Here's the key detail: your object **mutates** on every valid set, but on an invalid one you get an error message and the object is left untouched.

`Result` gives you a very useful contract. If `IsSuccess` is `true`, `Value` hands you the object already mutated into its new state; if it isn't, `Error` gives you the reason. Straightforward enough.

## When a business rule doesn't fit in a setter

Now for the interesting part. In our domain a BIC is a bank code of **8 or 11 alphanumeric characters** (the last 3 being optional), defined by ISO 9362:

- **Institution code**: the first 4 characters identify the bank.
- **Country code**: characters five and six, in ISO 3166-1 alpha-2 format. `ES` for Spain.
- **Location code**: characters seven and eight. In Spain you'll often see `MM`, but don't treat that as a rule — SWIFT assigns the value and it isn't necessarily a city acronym.
- **Branch code**: the last 3 characters identify a specific branch. They're optional; when absent, the code refers to the institution's head office, conventionally written as `XXX`.

Cramming all of that into a `SetBic` feels wrong at first glance, and it should.

At this point someone will suggest a helper or a domain service. Either way you hit the same problem: there's no way to force the rest of the team through it by design (and you shouldn't couple that service to the entity). Whether through ignorance or time pressure, someone will eventually not find your helper, and that validation will end up reimplemented in several places, breaking DRY.

But DDD gives us **value objects** for exactly this. A value object has no identity of its own, but it does carry reusable business logic.

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

    // ... SetCountryCode, SetLocationCode and SetOfficeCode follow the same shape

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

A couple of notes on that snippet:

- `IsFourLetterCharacters()` is a custom extension method, not something from the BCL. Each part of the BIC gets its own format check.
- `Messages` is a constants class holding the error messages, so string literals aren't scattered across the domain.
- The 2020 version accepted any length between 8 and 11. That let 9- and 10-character codes through, which aren't valid under ISO 9362. This version accepts only 8 or 11.

With the value object in place, the entity uses it like this:

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

## Only ever building valid things

There's one rule we still haven't applied: if I want to create something in my domain, a constructor won't do. Constructors take parameters, but they can't report on the state of what they built — so they're useless for constructing objects that must be validated.

The answer is a static factory method that builds the business object if and only if it's valid. And to stop anyone creating instances another way, the default constructor has to be private.

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

`Constraints` is a small helper you'll find in the GitHub repository that accompanies this post. All it does is accumulate the `Result` from each setter and combine them into one, so the code stays readable and the error you return carries *every* failure rather than just the first.

## Why this pays off

The benefits are pretty clear:

- If my entities exist, they're valid.
- If they can't be created, I get an error message explaining what went wrong.
- If an entity owns its construction logic on top of its validation logic, I don't need services to build it.

On top of that, I can test my business logic with pure unit tests — no test doubles, no infrastructure:

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

In the original version these tests carried an empty `[InlineData()]` that would have failed the run, and the argument order didn't match `Bank.Create`. Both are fixed above.

And because what you hand back to the outside world is a `Result` — from a command, a query, or straight from a controller — that code is portable and very easy to map onto a standardised response.

## References and further reading

- [CSharpFunctionalExtensions](https://github.com/vkhorikov/CSharpFunctionalExtensions)
- [FluentValidation](https://fluentvalidation.net/)
- [Model validation in ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/mvc/models/validation)
- [Validation and DDD — Enterprise Craftsmanship](https://enterprisecraftsmanship.com/posts/validation-and-ddd/)
- [Functional C#: Primitive obsession — Enterprise Craftsmanship](https://enterprisecraftsmanship.com/posts/functional-c-primitive-obsession/)
- [Refactoring from Anemic Domain Model Towards a Rich One (Pluralsight)](https://www.pluralsight.com/courses/refactoring-anemic-domain-model)

## Sample code

[github.com/jmanuelcorral/DDDValidations](https://github.com/jmanuelcorral/DDDValidations)
