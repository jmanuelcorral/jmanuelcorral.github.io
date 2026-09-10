---
title: 'Vulkan or ROCm on Strix Halo: how I failed, measured, and chose a local inference backend'
description: 'A llama.cpp experiment on AMD Strix Halo: UMA memory, failed smoke tests, reproducible gates, and a short Vulkan versus HIP/ROCm comparison.'
lang: 'en'
translationKey: 'halostrix-vulkan-vs-rocm'
slug: 'vulkan-or-rocm-on-strix-halo'
pubDate: '2026-09-09T15:30:00+02:00'
tags: ['experiment', 'local-ai', 'amd', 'strix-halo', 'llama-cpp', 'vulkan', 'rocm', 'benchmarking']
draft: false
---

> **Experiment status.** This is a lab report, not a universal recommendation or a production guide. The figures come from a short run with one model and a specific software snapshot. I did not complete a sustained thermal soak, a quality evaluation, or a broad model matrix.

The original question sounded straightforward: on an AMD Strix Halo APU, should I run `llama.cpp` through Vulkan, or invest in a HIP/ROCm build?

I did not answer it with a generic compatibility table. The useful answer emerged from failed runs, tighter test boundaries, and a promotion rule written before HIP produced a number.

## Start with the real memory budget

The lab machine is a GMKtec EVO-X2 with a Ryzen AI Max+ 395, Radeon 8060S (`gfx1151`), 128 GiB of physical memory, and CachyOS. On a unified-memory APU, that headline capacity is not the same thing as memory available to every workload.

With the BIOS UMA setting on Auto, Linux could see roughly 62 GiB of RAM, while the driver exposed about 31.2 GiB of GTT. The collected evidence pointed to a firmware carve-out rather than a normal Linux CMA reservation.

I made one reversible change: `UMA_SPECIFIED` with a 2 GiB fixed frame buffer. After rebooting and repeating the inventory:

| Configuration | Visible RAM | Fixed VRAM | Approximate GTT limit |
|---|---:|---:|---:|
| UMA Auto | 62 GiB | 64 GiB reported by AMDGPU | 31.2 GiB |
| Specified UMA | 123.5 GiB | 2 GiB | 61.7 GiB |

This did not create memory. It returned firmware-reserved capacity to the operating system and left a larger dynamic GTT window. It also clarified the practical constraint for every later test: **physical memory, visible RAM, fixed VRAM, and GTT are related, but they are not interchangeable figures**.

## Define promotion before compiling

I wanted both backends to face the same workload, so I fixed:

- the `Qwen3-1.7B-Q8_0` model;
- quantization and offload settings;
- `PP512` for prompt processing;
- `TG128` for token generation;
- three repetitions;
- separate gates for device detection, loading, generation, system logs, and cleanup.

The promotion rule was also recorded in advance: HIP needed at least a 5% improvement in the target metric without an unacceptable generation regression. That is an operational threshold for this lab, not a general scientific constant.

Keeping PP and TG separate matters. A backend can ingest context faster while generating tokens more slowly. One blended score would conceal that trade-off.

## Vulkan: turning a runaway command into a baseline

The first failure was ordinary: the Vulkan development headers were missing. Installing them unblocked configuration, but the first generation smoke was still not trustworthy.

That attempt ran for more than ten minutes and produced a 6.4 GiB log. Samples from the beginning and end mixed model output with controller lines. Stdin contamination or an ineffective token limit was the leading hypothesis, but the evidence did **not** establish one definitive root cause.

Several less dramatic failures followed:

- uncertainty about which process could be terminated safely;
- a Bash syntax error in the preparation script;
- an overly fragile monitor-process check;
- attempts stopped before model execution because the harness itself failed validation.

The fix was not to keep rerunning the same command. I bounded each independent failure dimension. This shortened pattern, with generic paths, captures the resulting approach:

```bash
timeout --foreground --signal=TERM --kill-after=10s 120s \
  bash -c 'ulimit -f 131072; exec "$1" -m "$2" \
    -p "Reply with exactly: VULKAN_SMOKE_OK" \
    -ngl 999 -c 2048 -n 64 --temp 0 \
    --simple-io --no-display-prompt --no-warmup --log-disable' \
  _ "<LLAMA_CLI>" "<MODEL_PATH>" \
  </dev/null >"<LOG_DIR>/smoke.stdout" 2>"<LOG_DIR>/smoke.stderr"
```

The run has three separate bounds: 120 seconds, 64 generated tokens, and a per-file size limit. The prompt is an argument, and the `/dev/null` redirection prevents inherited interactive input. Check the active shell's `ulimit -f` units, the exact values, and every flag against the build under test; they are not permanent API contracts.

I also split two questions that the earlier procedure had mixed together:

1. **Can the model load and offload to the GPU?** A no-generation run reported `29/29 layers` offloaded to the Radeon GPU.
2. **Can it produce a short, bounded, verifiable answer?** Only after that gate passed did I enable benchmarking.

The resulting Vulkan baseline was:

| Backend | PP512 | TG128 |
|---|---:|---:|
| Vulkan/RADV | 5263.79 ± 10.83 tok/s | 114.39 ± 0.24 tok/s |

The short sensor and journal window showed no relevant errors, but that is **not** a substitute for sustained thermal, power, or stability testing.

## HIP/ROCm: some backend “failures” belonged to the test

The HIP path advanced through a series of independent gates:

1. The compiler path could not initially be confirmed.
2. CMake then detected HIP but stopped because the `hipBLAS` development metadata was missing.
3. A package preflight blocked installation after matching the word “linux” inside a repository URL, rather than checking package names.
4. Once that parser was corrected and a coherent ROCm package set was installed, the build completed.
5. Early device and linkage gates rejected valid output because their predicates were too strict.
6. Reclassifying those checks from the actual evidence allowed load, smoke, and benchmark stages to run.

The lesson is not to weaken every inconvenient check. It is to make each gate test the property it claims to test. Searching arbitrary text is not package validation, and demanding one exact output shape is not the same as proving that the HIP runtime and libraries are loaded.

## The measured comparison

Using the same model and benchmark dimensions:

| Backend | PP512 | TG128 | Change from Vulkan |
|---|---:|---:|---:|
| Vulkan/RADV | 5263.79 ± 10.83 tok/s | 114.39 ± 0.24 tok/s | baseline |
| HIP/ROCm | 5448.84 ± 173.67 tok/s | 102.51 ± 0.17 tok/s | PP ≈ +3.5%; TG ≈ −10.4% |

HIP processed the prompt a little faster, but it missed the predefined 5% promotion threshold and generation slowed materially. For this small model and workload, I kept Vulkan as the baseline and retained HIP as an experimental build.

That does not prove Vulkan is always faster on AMD—or even always faster on this machine. Larger models, different quantizations, batch sizes, and later versions of `llama.cpp`, Mesa, or ROCm may change the outcome. This is a local, dated, reversible decision.

## The workflow I will reuse

For the next backend experiment, I will:

1. Inventory hardware, visible memory, GTT, and software versions.
2. Freeze the model, parameters, and promotion threshold before measuring.
3. Validate configuration and compilation.
4. Confirm device detection and linkage with focused predicates.
5. Run a load-only gate.
6. Run a smoke bounded by time, tokens, and output size.
7. Measure PP and TG separately.
8. Review sensors, system logs, and leftover processes.
9. Promote, retain as experimental, or roll back.

Not every failed gate is a failed backend. This sequence exposed missing dependencies, a faulty parser, and overly rigid checks. Small gates made it possible to distinguish infrastructure defects from actual performance results.

## What this experiment established—and what it did not

**Established by the recorded runs:**

- the UMA change measurably altered the RAM/GTT budget;
- both builds offloaded all 29 layers of the test model;
- Vulkan and HIP completed the same short benchmark;
- HIP gained a little PP throughput and lost more TG throughput;
- under the predeclared rule, Vulkan remained the baseline.

**Not established:**

- multi-hour stability;
- response quality;
- comparative energy efficiency;
- behavior with large models or concurrent requests;
- general Vulkan superiority over ROCm;
- production readiness.

One final evidence limitation: the HalostrixLab repository does not yet have commit history. Dates and sequence come from its authored lab notes and pinned references, not from a verifiable Git chronology. I therefore treat this as a provisional experiment result, not a permanent platform verdict.
