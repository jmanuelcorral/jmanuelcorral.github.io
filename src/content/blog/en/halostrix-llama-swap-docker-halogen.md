---
title: 'Less waiting, more agents: upgrading my local AI stack'
description: 'From Lemonade and Vulkan to llama-swap, Docker and Halogen: how I upgraded my local AI stack to put agents to work. Performance, decisions and results without the alphabet soup.'
lang: 'en'
translationKey: 'halostrix-llama-swap-docker-halogen'
slug: 'less-waiting-more-agents-local-ai-stack'
pubDate: '2026-09-18T10:00:00+02:00'
tags: ['experiment', 'local-ai', 'amd', 'strix-halo', 'llama-swap', 'docker', 'halogen', 'qwen', 'inference']
category: 'ai'
kind: 'Experiment · Inference'
experimentCategory: 'inference'
draft: false
---

There is a very specific moment when running AI at home loses some of its glamour: you ask it something, stare at the screen and start negotiating with yourself about whether there is time to make coffee.

That was roughly the mood around my Halo Strix. It worked, which is no small achievement. But I wanted it to help me write code, not practise mindfulness.

Over the past few days I have changed quite a few of the programs that make it work. I moved from **Lemonade Server and Vulkan** to **llama-swap, Docker and Halogen**. Apparently I have replaced two strange names with three. Debatable progress, put like that.

The interesting part is what each one does and what they now let me do.

## First: what am I actually running at home?

My machine is an **AMD Strix Halo with 128 GiB of memory**. A small computer with plenty of memory, shared between the processor and the graphics hardware. It is not a data centre, although some of my plans for it seem unaware of that.

I use it to run AI models on my own machine instead of sending questions to a service that does the calculations in the cloud.

One of the models I have been trying is **Qwen3.8-Flash-Next**. But the model alone does nothing: you need a **well-tuned runtime**, the program that loads it and runs the calculations to generate responses. Downloading the model is the starting point, not the finished job.

Chatting was never my goal. What I enjoy is cracking the whip and putting **coding agents** to work. And there, a single task means many successive requests, tool use, reading piles of files... Every wait counts.

## The old setup worked, but I wanted to ask more of it

Initially I used **Lemonade Server** to choose models, load them and connect my applications. Underneath it ran **llama.cpp**, the runtime, with **Vulkan**, the technology that let it use the computer's graphics hardware.

No need to memorise that. The short version is: Lemonade organised the service and llama.cpp did the calculations.

With Flash-Next, when I put **two requests to work at once**, I was getting around **12 decode tokens per second per request**: an average of 12.38 in the September 15 test. With a single request, the same series averaged 16.13. That was not an absolute ceiling for the model, but it was a fairly unexciting reference point for what I wanted to do.

Tokens, decode, prefill? Let's name the two kinds of waiting before filling the page with numbers.

I also tried asking for several responses at once. The computer produced more work overall, but each individual answer was generated more slowly. Like opening more supermarket checkouts and discovering they all share the same cashier.

**My goal stopped being just “get the model to start”. I wanted long conversations, multiple requests and the freedom to try other runtimes without dismantling everything else.**

## Tokens, prefill and decode: what are we timing?

A **token** is a small piece of text: a word, part of a word or a punctuation mark. The model's *tokenizer* splits the text and counts those pieces. I do not count words by eye: I use the counters and timings returned by the runtime. Two models can split the same text differently, so their counts do not always match.

| Phase | What the AI is doing | How we measure its speed |
|---|---|---|
| **Prefill** | Processing the input: instructions, history, files and tool results | Input tokens actually processed divided by the seconds spent on that phase |
| **Decode** | Generating new response tokens, including reasoning when present | Generated tokens divided by the seconds spent generating them |

Both speeds are expressed in **tokens per second**, shortened to t/s or tps. For example, generating 120 tokens in 10 seconds means 12 t/s of decode. That does not include time previously spent reading the input or waiting for a turn.

When comparing tests, I also check how many requests were running at once and whether the runtime could reuse text it had already processed. If one test benefits from that cache and another starts from scratch, they are not doing the same work.

Reading and writing do not cost the same. An agent that has just picked up lots of files may take a while to start answering even if it then writes quickly. That is why I care about **both speeds**, as well as how long I wait until content appears.

## Two Qwens with similar names, but very different designs

Before Flash-Next I played with **Qwen3.8-27B**, one of my first models. At the time I was seeing enormous community hype around it and, naturally, I had to try it. I was not about to miss my allotted afternoon of experiments.

That **27B** means roughly 27 billion parameters, the model's learned values. It is a **dense** model: broadly speaking, it uses its full set of layers at each generation step.

**Qwen3.8-Flash-Next is not the 27B with a fast mode switched on.** It is another model, with a *mixture-of-experts* (MoE) architecture: for part of its calculations it selects which groups of parameters to use for each token instead of activating every expert. It can have many parameters overall without using all of them at once. That changes its memory and execution needs; it does not guarantee it will fly with any runtime. Unfortunately, having Flash in the name is no substitute for tuning.

It was the **27B**, not Flash-Next, that had a connection cut out while still processing the input. [Updating Lemonade fixed that](/en/blog/running-qwen38-27b-locally-lemonade-sse/). The problem was how long the server would wait, not a sign that the computer needed to go through the window.

That fault and this week's changes are separate issues. **I did not leave Lemonade because everything was broken; I changed the setup so I could experiment with other pieces.**

## The new arrangement: who receives, who calculates and where it lives

To understand the setup, imagine a restaurant kitchen:

| Piece | Its job, without the instruction manual |
|---|---|
| **llama-swap** | Receives orders from my applications and directs them to the configured runtime. It runs the front of house |
| **Halogen** | Runs the model and prepares the responses. It does the cooking |
| **Docker** | Keeps the runtime and its dependencies in a separate environment. It is the equipped kitchen, not another cook |

A request now follows this path:

**My application → llama-swap → Halogen inside Docker → response.**

**llama-swap acts as a proxy**: it receives the request and passes it to the configured runtime, hosted in a Docker container. Why Docker? To try runtimes and models with different architectures without mixing incompatible library versions. Each environment carries its dependencies and, as a bonus, I do not leave the machine looking like a landfill. That does not make an incompatible model compatible: the runtime still has to support it.

The advantage of llama-swap is having **one front door for the applications**, even if I change the runtime behind it. That does not mean every model understands the same tools or accepts the same conversation sizes: those differences still need configuration and testing.

My concern about moving to Docker was performance: I was already waiting long enough without adding another layer to eat up the gains. The new setup's results have pleasantly surprised me. For my lab, the argument about whether containers are worth using is pretty much settled.

## Docker without the fear of a performance toll

There is an important distinction here: **on this native Linux system, Docker is not emulating another computer**. Container processes share the operating system kernel and access the GPU through the devices I expose to them. The execution environment is separated; the graphics card is not simulated.

That does not mean every configuration has zero overhead. Nor have I compared the same runtime, version and workload inside and outside Docker to measure that overhead separately. My conclusion is practical: the overall performance works for me, and so does the convenience. I am not crediting Docker with improvements that come from changing the runtime.

With that initial concern addressed, these are the benefits that make me want to stay:

| What I want to do | What Docker contributes in this setup |
|---|---|
| Try another runtime | Prepare its environment without mixing its libraries with those of the previous one |
| Keep a working version | Pin the exact image used instead of fetching “the latest” every time |
| Change the program without downloading the model again | Keep the model files outside the container, separate from the software |
| Stop an experiment | Stop its container without doing a general cleanup of the whole lab |
| Return to a known configuration | Keep the image, files and settings I have already tested |

The **image** is the package the container comes from. In my configuration it is pinned by its digital fingerprint: a way to identify the exact contents, not just a name that could point to another version tomorrow.

The model files are also mounted **read-only**: the runtime can use them but cannot modify them through that mount. This has a certain appeal when you have just downloaded nearly 118 GiB and would rather not repeat the excursion.

The small print? Every container still shares the same machine. **Docker does not create memory, duplicate the GPU or magically update the computer's driver.** Nor does it make any program safe: membership of the Docker group gives enormous control over the machine.

It helps me organise the workshop. It does not buy me another workshop.

## Halogen: this really does change who performs the calculations

Halogen is a runtime specialised for this hardware and the model family I was exploring. To try it, I downloaded its **W4B Quality** bundle, containing the model files and the components it needs. Renaming the file I had been using with Vulkan was not going to cut it.

There is a trade-off too: **Halogen is a closed-source runtime with its own licence**, not open-source software I can freely inspect and rebuild. That is part of the decision, not a detail that disappears because I like the timings.

One particularly useful test involved giving it a very long, repetitive text and asking it to retrieve a key placed at the beginning:

| Configuration tested | Input text, in tokens | Wait until the first visible content |
|---|---:|---:|
| Halogen with W4B Quality | 105,074 | About **78 seconds** |
| Qwen3-Coder with Vulkan | 120,033 | About **24 minutes** |

Both returned the key and completed the response. That difference in waiting time led me to remove Coder from the active catalog, keeping its files in case I wanted to go back.

**Important: this is not Flash-Next at 12 t/s versus Halogen.** The model and the way text is divided into tokens also differ here. This measures the wait until content appears, not pure reading speed or writing speed. It does not establish that “Halogen is so many times faster”.

What it does describe is one concrete experience: for that long request, one configuration kept me waiting much less. And when you are the person in front of the screen, that matters quite a bit.

## More room for a conversation does not mean more intelligence

I now have a **128K context window** configured: 131,072 tokens.

*Context* is the text the model can take into account within a request: instructions, conversation, files, tool results and room for its answer. Think of it as a work desk. A bigger desk lets you spread out more papers; it does not automatically make the person sitting at it a better programmer.

In my configuration the output is capped at 8,192 tokens, which **also takes up part of that desk**. It is not 128K of input plus a free answer.

Is that useful? For coding, including more material before trimming the history helps. Does it prove the model will find every detail in an enormous conversation? No. The key-retrieval test is a small check, not a universal reading-comprehension exam.

## Then came four requests at once

The next step was enabling four simultaneous workspaces, called *slots*. To check them, I launched four requests together and repeated the round. Each had roughly 7,800 input tokens and produced 512 output tokens, counting reasoning.

| Test with four requests | Wait until each one's first content | Time until all four finished |
|---|---:|---:|
| First round | About **28 seconds** | About **55 seconds** |
| Repeat, reusing the text already processed | Between **1.3 and 1.5 seconds** | About **27 seconds** |

All eight responses completed successfully.

The second round benefited from the **cache**: the runtime had saved work done while processing the beginning of the requests and could reuse it. It was not learning something new or remembering forever; it simply did not have to redo that whole part.

It is the difference between rereading a case file from the cover and picking it up with the page markers already in place.

This proves four simultaneous requests of that size, **not four agents coding for hours or four full 128K conversations**. There is still homework to do.

## Before and after, without opening a terminal

| Need | Before | Now |
|---|---|---|
| Connect my applications to the AI | Lemonade Server | llama-swap as a common entrypoint |
| Run the model | llama.cpp with Vulkan | Halogen inside Docker |
| Try alternatives | I started from the runtime managed by Lemonade | I can prepare runtimes in separate environments and connect them to the same entrypoint |
| Keep the service running after closing my session | I already used a Lemonade service | I configured one for llama-swap, with program restart if it stops |
| Undo the migration | This was the starting configuration | Lemonade is still installed but disabled; I kept the configuration and files |

I also used **Cockpit**, a terminal interface for exploring and launching tests. The rule now is simple: either I run tests from there or I let the service manage the runtime. I do not put two managers in charge of switching the same kitchen on and off.

## What remains before I get too pleased with myself

The documented tests are from the last few days; I still need to put the setup through its paces and tune the settings. They are not a guarantee of permanent reliability. I still need to:

- Keep it working for hours and watch memory, temperatures and errors.
- Compare one, two and four requests with the same workload to choose settings more carefully.
- Try four genuinely long conversations at once and evaluate the quality of the answers.

And an important warning: the private lab deployment has a local-network access exception **without encryption or a password**. Machines admitted by that rule can query and administer the service. It is not a setup to copy blindly; the repository's public examples start with authenticated local access and provide for an encrypted front end for remote access.

## Links and references

### The pieces of the stack

- [AI Toolbox Cockpit](https://github.com/kyuz0/ai-toolbox-cockpit): the terminal interface I used to explore models and launch runtimes in containers. This is the Cockpit I mean, not the server administration dashboard with the same name.
- [Halogen](https://github.com/peonist-ai/halogen-flash-server): the specialised runtime I use now. Its documentation, configuration and licence are here; having a public repository does not make the runtime open source.
- [llama-swap](https://github.com/mostlygeek/llama-swap): the proxy that receives requests and manages starting and switching runtimes according to its configuration.
- [AMD Strix Halo Toolboxes](https://github.com/kyuz0/amd-strix-halo-toolboxes): images and recipes for running llama.cpp with Vulkan and ROCm on Strix Halo without assembling everything by hand.
- [llama.cpp](https://github.com/ggml-org/llama.cpp): the open-source runtime I started with, and still a useful reference for running models locally.
- [Lemonade Server](https://github.com/lemonade-sdk/lemonade): the server I used to build the first version of the lab, before this migration.

### My tests and configurations

The full story and measurements are in [HalostrixLab](https://github.com/jmanuelcorral/halostrixlab). This post summarises tests from September 14 to 17, with the latest changes published on the 18th:

- [Qwen3.8-Flash-Next trials](https://github.com/jmanuelcorral/halostrixlab/blob/master/docs/ensayos-qwen38-flash-next.md): per-request decode in the series on the 15th and overall throughput in the test on the 16th, two different measurements.
- [Docker and runtime research](https://github.com/jmanuelcorral/halostrixlab/blob/master/docs/investigacion-docker-toolboxes-halogen.md): the alternatives and their limits.
- [Halogen deployment and follow-up tests](https://github.com/jmanuelcorral/halostrixlab/blob/master/docs/despliegue-halogen-128k.md): long context, four requests, memory and outstanding checks.
- [Lab tools](https://github.com/jmanuelcorral/halostrixlab/tree/master/workspaces/inference): programs and configuration examples for anyone who wants the details.
