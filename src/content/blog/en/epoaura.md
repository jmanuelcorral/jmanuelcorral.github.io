---
title: 'EpoAura: a birthday keyboard that turned into a Linux app'
description: 'A birthday gift, an AK820 Pro I could only half enjoy on Linux, and an excuse to tinker with RGB, screens and reverse engineering with AI and GPT-Astra.'
lang: 'en'
translationKey: 'epoaura'
slug: 'epoaura-birthday-keyboard-linux'
pubDate: '2026-09-15T10:00:00+02:00'
tags: ['linux', 'open-source', 'tauri', 'rust', 'svelte', 'desktop', 'ai', 'reverse-engineering']
draft: false
---

I got a keyboard for my birthday. An **EPOMAKER Ajazz AK820 Pro**, complete with lights, a little screen and all the distraction potential of a shiny new gadget on your desk.

Great gift. The Linux experience... well, that was where the second part of the present began.

**Half the features weren't working for me.** Typing, sure. But I wanted to enjoy the lighting and screen too, rather than stare at the customization options like a shop window after closing time.

And of course, given the choice between accepting that and starting another personal project, I did the sensible thing: started another personal project.

That's how [**EpoAura**](https://github.com/jmanuelcorral/epoaura) happened.

## I just wanted to change some lights

I'd already built [Aura Studio](https://github.com/jmanuelcorral/aura-studio), an interface for controlling my ASUS laptop's lighting on Linux. The idea here was similar: open a pleasant app, pick some colors and save combinations without having to remember commands.

The community had already done a lot. [gohv's AK820 Pro controller](https://github.com/gohv/EPOMAKER-Ajazz-AK820-Pro) supported a USB variant of the keyboard, and EpoAura builds on that work for that model. We weren't starting from scratch, and it wouldn't be right to tell the story that way.

Then came the small print: **my ISO-ES variant didn't speak quite the same language**.

Two keyboards sharing a product name doesn't mean they share a protocol. And being able to connect them over a cable, receiver or Bluetooth doesn't mean you can configure them the same way through all three.

What looked like an interface with a few colorful buttons was turning into rather more hardware conversation than expected.

## AI, GPT-Astra and a look under the hood

On this project, **AI and GPT-Astra helped us do research and, at times, reverse engineering**. Less formally: following clues, reading code and trying to understand what the official configurator was telling the keyboard.

AI helped us work through that material, organize hypotheses and turn what we found into code and checks. It wasn't a case of pressing a “make me a driver” button and moving on. The keyboard doesn't care how convincing an answer sounds: either it responds as expected or it's time to revisit the idea.

The investigation covered the ISO-ES web configurator, its use of WebHID and the messages it uses to query and change lighting. We also had to distinguish the 2.4 GHz receiver from the Bluetooth device, even when some identifiers looked similar.

One of my favorite details involved brightness and speed: **the tested firmware accepts levels from 1 to 6 but returns them from 0 to 5**. Sending back exactly what you'd just read lowered both settings. You think you've changed nothing, and the keyboard gets a little dimmer.

Testing against the actual device caught that. We had to fix the conversion and verify that reading and reapplying the same state left the levels alone.

To me, that's the interesting part of working with AI: it really helps you move forward, but a well-written hypothesis is still a hypothesis. **You have to check it against what the actual gadget does.**

You also need to know when to stop. The Bluetooth investigation turned up a channel labeled OTA, associated with firmware updates. That wasn't an invitation to send colors down it and see what happened. We left it alone.

## Right, but what does EpoAura do?

The application uses **Tauri, Rust and Svelte**: a visual interface connected to a native layer that handles communication with the device. On Linux it uses WebKitGTK, without bundling Chromium as Electron would.

The less detective-like part, and the one I wanted to use in the first place, lets you:

- Start from six moods and customize colors, brightness, speed and the settings each mode supports.
- Choose among twenty lighting modes.
- See an approximate keyboard preview before applying anything.
- Save, rename, duplicate and delete up to 100 local profiles.
- Switch between English and Spanish.

Opening the app or loading a profile **doesn't change the lights**. You have to click **Apply to keyboard** to send them. It sounds minor, but I'd rather play with a color without turning my desk into a nightclub with every mouse movement.

There are no accounts, cloud synchronization or resident lighting service. The interface runs as a regular user; device access is handled through `udev` permissions, not by running the whole app as root.

## The little screen had to join in too

Because, honestly, having a screen on your keyboard and not trying to put something on it is leaving temptation far too close.

EpoAura has a **Screen** page with six designs, color and text adjustments, PNG, JPEG and GIF import, animated previews and GIF export.

Sending that content to the keyboard is a separate matter, and it's worth keeping the distinction clear. **Native USB uploads are limited to ISO-ES firmware 1.16** and require confirmation before replacing the current content. A diagnostic image and a simple animation have been physically verified; that doesn't individually certify every gallery design.

There's also no guaranteed recovery of the previous animation or safe cancellation during a transfer. Don't unplug the keyboard or close the app while it's uploading. The browser demo lets you explore the interface but cannot control hardware.

I'm excited that it works, but I'd rather be clear about the limits than label everything “fully tested.”

And so this isn't just talk, here's a video of the little screen working on the actual keyboard:

<video controls playsinline preload="metadata" width="480" height="848" style="display: block; max-width: 100%; height: auto; margin: 0 auto 18px;" aria-describedby="epoaura-screen-caption">
  <source src="/epoaura-pantalla.mp4" type="video/mp4" />
  Your browser doesn't support this video. <a href="/epoaura-pantalla.mp4">Download the video of the screen in action</a>.
</video>
<p id="epoaura-screen-caption">The AK820 Pro screen in action in a real 3.5-second recording, without audio. This isn't the app's preview.</p>

## Compatible doesn't mean “everything, over any connection”

At the time of writing, this is where the project stands:

| Connection or variant | What EpoAura supports |
| --- | --- |
| ISO-ES with a compatible 2.4 GHz receiver | RGB control, settings readback and verification after applying. |
| Previous wired USB variant | RGB, sleep timer and clock synchronization through its controller. |
| Wired ISO-ES, firmware 1.16 | Screen uploads; wired RGB isn't supported. |
| Bluetooth | Not supported. |

Sleep and clock controls aren't available through the ISO-ES receiver. There's no key remapping, individual per-key RGB or firmware updating either. The app works with one compatible device at a time.

The Bluetooth entry means **EpoAura doesn't support it**, not that we've proved it's impossible. It's a small distinction, but after spending time digging through the protocol, I'd rather make it explicit.

## The gift came with a project included

If you have an AK820 Pro, the [EpoAura repository](https://github.com/jmanuelcorral/epoaura) has the code, screenshots and compatibility and installation guide. [Version 0.4.1](https://github.com/jmanuelcorral/epoaura/releases/tag/v0.4.1) offers packages for Arch Linux/CachyOS and Ubuntu 24.04, plus an experimental RPM. They aren't universal binaries or GPG-signed packages; SHA-256 checksums are included.

It's an independent project under the MIT license, unaffiliated with EPOMAKER or AJAZZ. Underneath it there's community work, our own research and plenty of AI help connecting the pieces.

I wanted to enjoy the keyboard I'd been given. Along the way, I ended up learning about HID protocols, receivers and the little jokes firmware can play on you.

They gave me a keyboard. The project came unwrapped.
