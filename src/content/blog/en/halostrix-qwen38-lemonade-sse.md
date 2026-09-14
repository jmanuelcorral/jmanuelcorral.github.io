---
title: 'Running Qwen3.8 27B locally: when the model works but the chat cuts out'
description: 'How we configured Qwen3.8-27B in HalostrixLab and why updating Lemonade fixed a streaming disconnect. Local models, context and SSE explained from the ground up.'
lang: 'en'
translationKey: 'halostrix-qwen38-lemonade-sse'
slug: 'running-qwen38-27b-locally-lemonade-sse'
pubDate: '2026-09-14T12:00:00+02:00'
tags: ['experiment', 'local-ai', 'inference', 'qwen', 'lemonade', 'llama-cpp', 'vulkan', 'streaming', 'beginner']
draft: false
---

You get a model running on your computer, send it a long conversation and wait. The GPU is busy. No answer appears. A couple of minutes later, the chat cuts out.

Your first guess is pretty reasonable: “This model is too big for my computer.”

That wasn't the issue here. In HalostrixLab, a Lemonade timeout was closing the connection while **Qwen3.8-27B was still reading the input**. We updated Lemonade, kept the model's profile and checked that the same kind of request could finish.

Let's take this one piece at a time. If you've never set up a local model, it helps to separate a few things first.

## A model, an engine and something to handle the chat

When you use a cloud AI service, most of this stays out of sight. Locally, you put it together yourself, although you don't have to write every piece:

- **The model** consists of files containing the parameters learned during training. We used Qwen3.8-27B. The `27B` means roughly 27 billion parameters, not 27 GB or the maximum conversation size.
- **llama.cpp** is the engine that loads those files and does the calculations needed to generate answers. Running an already-trained model is called *inference*. We aren't training it again.
- **Vulkan** is the backend we use to let that engine work with the AMD GPU.
- **Lemonade** manages the models and provides the API that the chat client connects to.

The simplified path looks like this:

<figure class="sketch-flow" aria-label="Path of a chat request to the local model">
  <ol role="list">
    <li><strong>Chat client</strong><span>Sends your question</span></li>
    <li><strong>Lemonade</strong><span>Receives and routes the request</span></li>
    <li><strong>llama.cpp</strong><span>Runs with Vulkan</span></li>
    <li><strong>Qwen3.8 · GPU</strong><span>Generates the answer</span></li>
  </ol>
  <figcaption>The question travels to the model; the answer follows the same path back to the chat.</figcaption>
</figure>

This matters because a chat failure doesn't necessarily mean the model has failed. There are connections, settings and timeout clocks in between.

## Our hardware and model variant

The lab runs on a GMKtec EVO-X2 with a Ryzen AI Max+ 395, Radeon 8060S, 128 GiB of physical memory and CachyOS. The CPU and GPU share memory. This isn't the same as having a discrete graphics card with 128 GiB of its own.

I've already covered [how we chose Vulkan over HIP/ROCm](/en/blog/vulkan-or-rocm-on-strix-halo/). For this story, the important point is that we started with a working Vulkan setup. We didn't switch backends to fix the disconnect.

The Lemonade identifier was `Qwen3.8-27B-GGUF-UD-Q4_K_XL`, from `unsloth/Qwen3.8-27B-GGUF`.

The name looks like a license plate, but we can break it down:

- **GGUF** is the file format used by this model distribution.
- **Quantization** means representing weights at lower precision to reduce their size and memory requirements. It isn't manually removing knowledge, and it isn't free: quality can be affected.
- **UD-Q4_K_XL** identifies the specific quantization variant. This is a dynamic variant, not a claim that absolutely everything is stored at four bits.

The lab inventory records roughly **16.35 GiB of weights**, plus **0.87 GiB for the vision component**. That's file size, not a promise about total memory use. Running the model also requires space for the conversation and computations. This incident was validated with text, not as an evaluation of its visual capabilities.

## Configuration: give it a desk, not the whole house

The documented profile after the September 10 maintenance looked like this:

| Setting | Value used | What it means in practice |
|---|---|---|
| Backend | Vulkan | The engine uses the GPU through Vulkan. |
| Context | 65,536 tokens | Space for input, history, instructions and generation. |
| Concurrent requests | 1 slot | One work slot for this model. |
| K/V cache | `q8_0` / `q8_0` | Precision of attention memory, separate from weight quantization. |
| Flash Attention | Enabled | An attention implementation aimed at using resources more efficiently. |
| Reasoning | Enabled, 4,096-token budget | Configured space for model reasoning, not 4,096 agent steps. |
| Speculative decoding | Disabled | We didn't add this acceleration mechanism during the fix. |

A **token** is a unit of text the model handles. It may be a word or just part of one. Don't assume a fixed conversion between tokens and words.

Think of context as a desk. Your question, conversation history, instructions and generated text all have to fit on it. A model's specification advertising a much larger desk doesn't mean you've reserved that space on your server. This profile used **64k**, not 262k.

Reasoning consumes a budget too. Being less visible in the interface doesn't put it outside the conversation's limits.

If you want to recognize the settings in Lemonade, these were the profile's additional arguments. Context is configured separately:

```text
--parallel 1 --flash-attn on --cache-type-k q8_0 --cache-type-v q8_0 --spec-type none --reasoning on --reasoning-budget 4096 --temp 1.0 --top-p 0.95 --top-k 20 --min-p 0.0 --repeat-penalty 1.0 --chat-template-kwargs '{"reasoning_effort":"medium","preserve_thinking":true}'
```

Temperature and sampling settings control how the next token is selected. **They weren't the timeout fix**, and this combination isn't a universal recipe. These are the settings we preserved to avoid mixing a repair with a tuning session.

A Coder model was also resident. Lemonade allowed two resident models, and both were pinned to protect them from normal eviction. Pinning creates no memory and doesn't guarantee that running everything at once will perform well.

## Before writing, the model has to read

A request has two phases that aren't always obvious from the chat window:

1. **Prefill:** the engine processes the input and prepares the information it needs to answer.
2. **Generation:** it starts producing output tokens.

If you send a lot of history or a large document, the first phase can take a while. Your GPU can be busy without a single word appearing.

That wait until the first token is often called **TTFT**, or time to first token. It isn't the same as the speed at which words appear once the answer gets going.

Here's the catch: **not receiving text yet doesn't mean the server has stopped working**.

## SSE: the channel that delivers the answer in chunks

*SSE* stands for *Server-Sent Events*. It keeps an HTTP response open so the server can send events to the client. In a chat, this lets you see an answer as it's generated instead of waiting for the complete text.

It isn't related to the processor instructions also called SSE.

In our setup, Lemonade received llama.cpp's response and forwarded it to the client. In version **11.8.1**, that internal streaming connection had a fixed condition: transferring less than **1 byte per second for 120 seconds** would cause cancellation.

During a long prefill, llama.cpp could be working without sending any tokens yet. To the connection's clock, that looked like silence.

The report records four disconnects around **126 seconds**, while input processing was still progressing. The last samples showed 74%, 85% or 91% completion. Then this appeared:

```text
CURL error: Timeout was reached
```

This wasn't an exact 120-second total request deadline. It was a low-transfer policy. The 64k context hadn't been exhausted either: the logs showed `truncated = 0`, and the model processes remained available.

There had been another failure involving an exhausted 32k window. That was a different issue. Increasing context and fixing a timeout aren't the same operation.

## Why increasing the timeout wasn't enough

We already had `global_timeout = 1200`, or 20 minutes. The natural assumption was that Lemonade would wait that long.

But in 11.8.1, **the streaming branch didn't use that setting for its low-transfer limit**. You could raise the global value and still hit the two-minute barrier.

Lemonade sending a ping to the client wasn't enough either. There are two legs: client → Lemonade and Lemonade → llama.cpp. Keeping the first alive doesn't necessarily reset the second one's clock.

The [official Lemonade 11.9.0 release](https://github.com/lemonade-sdk/lemonade/releases/tag/v11.9.0) corrected that behavior: the interval now respects the configured timeout. The release advertises a 600-second default; the lab kept **1200 seconds**.

The maintenance report records Lemonade **11.9.0-1** and Vulkan backend **b10723-010be9683**. On CachyOS, this used a local package built from official sources, not a project-signed Arch binary.

The idea was to change what was needed, keep a way back and restore the profiles. Not to turn a timeout fix into a driver upgrade, enable experimental acceleration or increase context.

## “Hello” wasn't the right test

A short answer proves that the chat works. It doesn't prove it survives the silence that caused the failure.

The test therefore had to be deliberately slow **before the first content**, but ask for a very simple final answer: `READY`.

It sent 2,221 synthetic records, roughly **44,500 input tokens**, and required the first actual content to arrive after 130 seconds. HTTP 200, a ping or an event announcing only the assistant role didn't count.

To isolate streaming behavior, the request disabled reasoning and limited output to 16 tokens. That change applied only to the test; the normal profile kept reasoning enabled. Without the override, the model could actually spend its small budget on reasoning and never write `READY`.

The recorded results were:

| Trial | Input | First content | Completion |
|---|---:|---:|---|
| On the host | 44,500 tokens | 214.735 s | `READY`, `stop`, `[DONE]` |
| From Windows | 44,497 tokens | 214.866 s | `READY`, `stop`, `[DONE]` |

A little over three and a half minutes without initial content. Exactly the kind of wait that previously got cut short.

`stop` indicates that generation ended normally; `[DONE]` closes the stream. Checking both prevented us from treating an incomplete response as a success. The logs also helped distinguish actual input processing from time spent waiting in a queue.

**The update didn't make Qwen read faster. It stopped interrupting it while it was reading.**

## What I'm taking away

If you're getting started with local models, you don't need to memorize all these options. These questions are worth keeping, though:

- **Is it loading, reading or generating?** Those are different kinds of waiting.
- **Does it cut out at almost the same time every time?** Check timeouts before blaming the GPU.
- **Did context run out, or did a connection close?** The symptom can look similar; the fix isn't.
- **Did you test the case that failed?** “Hello” doesn't validate a huge conversation.
- **Who else might stop waiting?** The client and any proxy have their own limits. Updating Lemonade doesn't change those.

You don't need to make the wait infinite either. Bounds and cancellation are still useful. And if every conversation carries tens of thousands of tokens, trimming unnecessary history may improve the experience more than extending the clock again.

Running local AI isn't just about making the model fit. It's about making sure all the pieces agree on how much work we're asking it to do.

## Notes and sources

This account follows the **September 10, 2026** maintenance report in the [HalostrixLab repository](https://github.com/jmanuelcorral/halostrixlab). It contains `docs/incidente-sse-lemonade.md`, the expanded English report and `scripts/test-lemonade-sse.py` for reviewing the configuration and tests.

The repository retains a caveat: an earlier record has the update prepared but not installed; the later report records installation and both trials. This article describes that documented result, not a fresh audit of the machine or a measurement of its current state.

The timeout correction can independently be checked in the [official Lemonade 11.9.0 release](https://github.com/lemonade-sdk/lemonade/releases/tag/v11.9.0) and its [code change](https://github.com/lemonade-sdk/lemonade/commit/bb39eafc22aa7e57fc7aeb8b7d384d70b44a4531). The two trials check this streaming failure; they aren't a model quality evaluation or a stability guarantee for every workload.
