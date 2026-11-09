---
title: 'The Strix Halo grows up: vision, NPU offloading and safety-net maintenance'
description: 'From Halogen 0.11 to 0.20 on AMD Strix Halo: native vision, 8 slots at 128k context, offloading embeddings and decisions to the NPU, and weekly maintenance with Btrfs and ntfy.'
lang: 'en'
translationKey: 'halostrix-halogen-020-npu-mantenimiento'
slug: 'halogen-020-npu-maintenance-strix-halo'
pubDate: '2026-11-09T10:00:00+01:00'
tags: ['experiment', 'local-ai', 'amd', 'strix-halo', 'halogen', 'npu', 'llama-swap', 'docker', 'qwen', 'inference', 'btrfs']
category: 'ai'
kind: 'Experiment · Inference'
experimentCategory: 'inference'
draft: false
---

Back in September I wrote about [upgrading my local AI stack](/en/blog/less-waiting-more-agents-local-ai-stack/) from Lemonade Server to a combination of llama-swap, Docker, and Halogen. The speed boost was unmistakable: I went from waiting resignedly to watching Qwen3.8-Flash-Next respond with crisp agility for coding agent workflows.

Yet there is a clear distinction between getting a model to fly during a controlled weekend benchmark and **operating an inference server 24/7**, ready to handle tool calls, massive codebase ingestion, auxiliary model queries, and rolling-release operating system updates without breaking a sweat.

Over the past few weeks, my AMD Strix Halo server (a GMKtec EVO-X2 with 128 GiB unified memory running CachyOS) moved past the "exposed wiring" phase. We upgraded the inference engine to **Halogen 0.20.0**, enabled **native vision**, put the **integrated NPU** to work on agent plumbing, and locked down the machine with **automated weekly maintenance backed by Btrfs snapshots and phone push notifications**.

Here is the log of what we tested, the measured metrics, and the architectural decisions taken.

---

## 1. Halogen 0.20 and checkpoint v2: leaner footprint, smarter tricks

The jump from Halogen 0.11 to 0.20.0 brought a major update to the model weights:

- **From w4b to v2**: we replaced `qwen38-flash-next-w4b.hgn` (115.55 GiB) and its accompanying overlay with `qwen38-flash-next-v2.hgn` (62.11 GiB), featuring ngram and MTP (*Multi-Token Prediction* / speculative decoding). That cuts disk footprint nearly in half while matching or improving output quality.
- **Active vision**: we enabled the sidecar `qwen38-flash-next-vision.hgn` (857 MiB). The server is no longer text-and-code-only; when an agent sends a screenshot, architecture diagram, or visual UI bug, the model processes it natively.
- **Cold start times**: following a full system reboot, the engine is listening for requests within 34 seconds, and the first complete text response finishes in 17 seconds.

In terms of pure generation speed, an isolated long-context stream (128k) clocks **57.2 decode tokens per second**. Under batched concurrency with short prompts, aggregate throughput reaches **127 tok/s**.

---

## 2. 8-slot concurrency and 128k context

A recurring bottleneck for home AI servers is handling multiple agents issuing long requests concurrently. Under Halogen, we sized a **single 1,048,576-position KV cache pool** across **8 concurrent slots**, where each request can span up to 131,072 tokens (`context: 131072, output: 8192`).

To test the system against a worst-case scenario, we ran an aggressive synthetic load test: **8 simultaneous requests, each with a prompt of 128,949 tokens** (pushing right up against the slot ceiling).

The measured results:

| Metric | Measured outcome |
|---|---|
| **Completed requests** | 8 out of 8 succeeded (`finish_reason: stop`), zero crashes or HTTP 500 errors |
| **Total wall time** | 555.7 seconds (~9 minutes) |
| **Peak pool usage** | 922,112 out of 1,048,576 positions (88% pool capacity) |
| **Prefill speed per stream** | Between 1,840 and 1,976 tokens/second (~65-70 s per request) |
| **Parallel decode speed** | ~5-6 tok/s per stream during active prefills; ~77 tok/s on the final freed stream |

### The bottleneck reality check (anti-hype)
The stress test highlighted a reality rarely mentioned in social media benchmarks: **the bottleneck under concurrent long context was prefill compute, not RAM capacity**.

Because massive prompt prefills are serialized to protect engine coherency and latency, processing eight 128k prompts in parallel takes roughly 9 minutes to digest the incoming text (~1 million tokens total). The server did not crash or run out of memory (peaking at 88% pool usage), but it clearly demonstrates that in production, agents should share cached prompt prefixes whenever possible.

### Debunking the GTT myth
For weeks I held an inaccurate assumption: that the model's entire weight set had to fit inside Linux's GPU GTT boundary (`ttm.pages_limit`, set to 61.73 GiB on our setup). Upstream documentation clarified and our measurements confirmed that **model weights reside in registered host physical memory (`mlock`) and do not compete directly against GTT**. Throughout stress testing, real GTT consumption hovered between 17 and 41 GiB, leaving comfortable headroom.

---

## 3. Bringing the NPU into play: offloading auxiliary tasks

The AMD Strix Halo APU includes an integrated Neural Processing Unit (NPU) powered by Ryzen AI / XDNA, exposed in Linux via `/dev/accel/accel0` through the in-kernel `amdxdna` driver.

Keeping a primary GPU tied up with complex reasoning while an agent constantly interrupts it to request vector embeddings or simple JSON classifications is wasteful.

With this update, we offloaded those auxiliary duties to the NPU:

1. **`decider-0.8b`**: rapid structured decisions using `json_schema` (tool selection, routing, and schema validation).
2. **`qwen3-embedding-0.6b`**: vector generation for local semantic search and retrieval (RAG).
3. **`qwen3-reranker-0.6b`**: reranking candidate search snippets before passing them to Flash's context window.

Halogen accesses the NPU by binding `/host/sys` and locks the GPU fabric clock at **2000 MHz** while the NPU runs. All three auxiliary models consume just ~4.2 GiB of pinned host RAM, leaving GPU compute completely dedicated to Flash-Next.

Via **llama-swap v271**, the NPU models appear as transparent peers (`halogen-npu/decider-0.8b`, etc.), enabling agents to access them through standard OpenAI endpoints (`/v1/embeddings`, `/v1/rerank`, `/v1/chat/completions`) without evicting Flash from GPU memory.

---

## 4. Pruning the control panel: less noise, more stability

With Halogen settled and the NPU handling auxiliary tasks, older side-by-side experiments were causing more friction than utility:

- We retired **Gufo (Qwen3.8-27B on GPU)** and **Laya (CPU-based model)** from llama-swap. Keeping them in the GPU pool created an ongoing risk of an errant request evicting Flash from VRAM.
- We updated the Cockpit web extension (**Halo Control**): removed Gufo and Laya cards and selectors, presenting only Halogen and its NPU peers.
- We re-enabled the telemetry collector (`halo-metrics.service`), allowing real-time monitoring of temperatures, clocks, and KV pool occupancy.

The guiding design principle: **in daily operation, prioritize stability for the core workhorse over keeping experimental toys on hot standby**.

---

## 5. Stress-free weekly maintenance: Btrfs, snapshots and ntfy

Running a home server on a rolling-release distribution like CachyOS (based on Arch Linux) has clear perks: immediate access to cutting-edge AMD drivers, fresh XRT builds, and optimized kernels. But it carries an obvious risk: an unmonitored update on a Tuesday afternoon could bring down your coding environment mid-task.

To solve this sustainably, we automated a weekly maintenance cycle with a strict safety net:

```
Sundays 20:00 (systemd timer)
  │
  ├─ 1. Is inference currently active?
  │      ├─ Yes → Wait up to 30 min. If still active, abort and notify.
  │      └─ No → Proceed.
  │
  ├─ 2. Create prior Btrfs snapshot (snapper: 'weekly-maintenance')
  │
  ├─ 3. Run pacman -Syu --noconfirm (snap-pac adds pre/post snapshots)
  │
  ├─ 4. Orderly shutdown notification via ntfy (halo-shutdown-notify.service)
  │
  └─ 5. System reboot and gateway health check
         └─ Post-boot ready notification via ntfy
```

### The golden rule for Docker
**Inference Docker images are never auto-updated during this routine.** Halogen and auxiliary runtimes are strictly pinned by immutable SHA256 digests. The weekly run updates only OS packages, the Linux kernel, and underlying system libraries. Updating a model or inference container remains a deliberate, documented action.

### Push alerts via ntfy
To maintain complete visibility without opening an SSH terminal:
- **Saturdays at 12:00**: an automated check reports how many system packages are pending for Sunday's cycle.
- **Sundays upon shutdown**: a systemd system unit (`halo-shutdown-notify.service`, ordered before `shutdown.target` while network connectivity remains active) dispatches a shutdown alert.
- **Upon reboot**: the service verifies that llama-swap answers with HTTP 200 and confirms the server is ready for work.

If any system update introduces a driver regression, the rollback path is tested and documented: roll back to the Snapper snapshot and reboot in under two minutes.

---

## 6. Takeaways

Operating a local inference server does not stop at pulling a model checkpoint and getting tokens in a terminal window. The real milestone arrives when:

1. You have **8 slots with 128k context** that withstand massive concurrent prompts without falling over.
2. A **silent NPU** handles embeddings and tool routing without stealing GPU compute.
3. The host OS **updates itself weekly**, captures a pre-flight snapshot before touching a single package, and pings your phone while you are having dinner on Sunday.

The Halo Strix has graduated from an experimental playground into a dependable, predictable piece of local engineering infrastructure.
