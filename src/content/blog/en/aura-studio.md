---
title: 'Aura Studio: a Sunday spent bringing color to my ASUS on Linux'
description: 'I used rogauracore to control my ASUS lighting, but wanted a nicer interface. That became Aura Studio: Tauri, Rust, Svelte and a small Sunday project.'
lang: 'en'
translationKey: 'aura-studio'
slug: 'aura-studio-a-sunday-of-rgb-on-linux'
pubDate: '2026-09-14T14:00:00+02:00'
tags: ['linux', 'open-source', 'tauri', 'rust', 'svelte', 'desktop', 'asus']
category: 'devops'
kind: 'Post · Linux'
draft: false
---

Last Sunday, I built an application to change my ASUS laptop's lighting on Linux. It's called **Aura Studio**, and its origin is much less epic than the name suggests: I could control the keyboard, but I didn't like the interface I was using.

I used `rogauracore`, which already did the important work of communicating with the hardware. However, `rogauracore-ui` wasn't quite what I wanted. I was looking for something more polished, easier to use and closer to the experience I could find on Windows.

I didn't need another controller. I wanted to open a window, see colors, try a combination and save it without having to think about commands.

So that became Sunday's project: **making something that was already possible pleasant to use**.

## Building doesn't have to mean starting from scratch

When a tool doesn't quite fit, it's tempting to think you need to rebuild everything. That wouldn't have made sense here.

[rogauracore](https://github.com/Syndelis/rogauracore) already controls lighting on compatible ASUS devices under Linux. Aura Studio builds on that work: it provides the interface and leaves device control where it already was.

Without the jargon: one part decides how to show you the options, and another knows how to send them to the keyboard.

This isn't a criticism of the original project or the people who built interfaces for it. Without that existing work, Sunday would have looked very different. It's one of my favorite things about open source: you can improve one part of an experience without having to solve every other part again.

## From choosing a command to choosing a mood

Instead of starting with a list of parameters, Aura Studio offers six moods: **Ocean, Focus, Sunset, ROG classic, Neon and Spectrum**.

They're starting points, not locked configurations. Pick one, change the colors and make it yours. The application provides:

- A visual color picker and hexadecimal input if you already know the exact shade you want.
- Brightness from 0 to 3 and speed from 1 to 3, matching the controller's levels.
- Four-zone controls in supported modes.
- An SVG keyboard preview with approximate animation.
- Local profiles you can save, rename, duplicate and delete.
- An English and Spanish interface that remembers your language choice.

The idea is that you shouldn't have to recreate your favorite combination every time. Adjust a mood, save it and return to it later. The library supports up to 100 profiles.

The READMEs in the [Aura Studio repository](https://github.com/jmanuelcorral/aura-studio) include screenshots of the studio and library in both languages. They're screenshots of the application in demo mode, not photographs of a physical keyboard.

## Previewing shouldn't change your keyboard

One important decision was to separate **trying an idea** from **applying it to hardware**.

Opening Aura Studio doesn't change the lights. Neither does previewing, switching languages or closing the window. Effects are sent only when you click **Apply to keyboard**.

It sounds like a small detail, but it makes a real difference. You can explore colors without the keyboard following every movement of the mouse. There's also no resident lighting service running in the background.

The preview has a deliberate limit too: it approximates what you want to send; **it doesn't read the physical keyboard's state**. A successful command confirms that it was sent, not that every effect looks the same on every ASUS.

The final check is still straightforward: look at the keyboard.

## Underneath: Tauri, Rust and Svelte

The application uses **Tauri 2, Rust, Svelte 5 and TypeScript**.

If these tools are new to you, the split is fairly intuitive:

- **Svelte and TypeScript** build the visual side: controls, colors, profiles and interface states.
- **Tauri** packages that interface as a desktop application and connects it to the native side.
- **Rust** handles the native part connecting the application to the system and controller.

On Linux, Tauri uses **WebKitGTK**, the web engine available as a system dependency. It isn't Electron and doesn't bundle a copy of Chromium. That doesn't mean it has no dependencies: it needs a graphical session, GTK 3 and WebKitGTK 4.1, among others.

There are also two ways to open the project during development. The browser version is a **demo** for exploring the interface, without hardware control. The native application is the one that can talk to `rogauracore`. Their profile libraries are separate, so trying the demo doesn't modify your real profiles.

## A nice interface doesn't need administrator privileges

Aura Studio runs as a regular user. **The interface doesn't run as root**.

Device access depends on rogauracore's permissions, through `udev` rules: Linux's mechanism for assigning permissions when it detects a device. If those permissions aren't right, the answer isn't to open the whole application as an administrator.

There are no accounts or cloud services either. Profiles stay on your computer, with atomic writes to reduce the risk of leaving a half-written file. If the library contains invalid data or an unknown version, it's preserved and saving is blocked rather than silently replacing it.

These choices aren't especially flashy, but to me they're part of the same goal as the colors: an application that's pleasant to use because you understand what it's doing and can trust it not to change things unexpectedly.

## Sunday also included an installable package

[Version 0.2.0](https://github.com/jmanuelcorral/aura-studio/releases/tag/v0.2.0) was published that Sunday. It includes a signed **Arch Linux and CachyOS** package, a bilingual guide and an optional pacman repository for updates.

The most direct way to try it is to open that release and follow its `GUIDE.md`. It covers requirements, signature verification and installation. You don't need Node.js or Rust to run the downloaded package, but you do need compatible `rogauracore` installed through the package manager. Aura Studio doesn't distribute it.

DEB and RPM files are also available, but the small print matters: **they were built on CachyOS/Arch and are experimental, not universal packages for every distribution**. Changing the package extension doesn't remove differences between system libraries.

You can also obtain the files through GitHub Packages. In that case, the GHCR image carries packages; it isn't intended to run the interface inside Docker.

## What's tested, and what I don't want to promise

The release records 10 Rust tests, 9 frontend unit tests, 8 Chromium flows and native WebKitGTK verification. Automated tests simulate effect application: **they don't write to the keyboard**.

That lets us check logic and interface behavior without turning every test run into a light show. It doesn't replace physical verification on each laptop model.

The current version supports one compatible device at a time. It doesn't offer individual per-key RGB, music synchronization, autostart, a system tray or a built-in updater. It doesn't extend the keyboard firmware's capabilities either.

If suspend changes the lighting, you may need to apply the profile again. It's also best not to have several RGB tools controlling the same device simultaneously.

## A small project, an improvement I actually wanted to use

Not every personal project has to solve a huge problem. Sometimes it's enough to take something you use often and think: “This could be a little more comfortable.”

That's where Aura Studio came from. Reusing an existing controller and putting the effort into choosing colors, saving combinations and having an interface I'd enjoy opening on Linux.

The code is on [GitHub](https://github.com/jmanuelcorral/aura-studio), under the MIT license. It's an independent project, unaffiliated with ASUS and built on the community's work.

A Sunday, some lights and a pretty good excuse to build something of my own.
