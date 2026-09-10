---
title: 'From a ROCm smoke test to a fine-tuning lab: what Docker proves—and what it does not'
description: 'How I am building a local AMD training lab: one real backward pass, one configured workspace, one partly validated integration, and explicit limits.'
lang: 'en'
translationKey: 'halostrix-rocm-training-lab'
slug: 'from-rocm-smoke-test-to-fine-tuning-lab'
pubDate: '2026-09-09T15:29:00+02:00'
tags: ['experiment', 'local-ai', 'amd', 'rocm', 'docker', 'pytorch', 'fine-tuning', 'llama-factory', 'unsloth']
draft: false
---

> **Experiment status.** I have validated basic GPU compute and autograd. The LLaMA-Factory workspace is configured and planned only: there has been no LlamaBoard GPU smoke and no fine-tuning run. Unsloth Studio passed build, imports, GPU detection, health, and UI checks, but no model was trained there either. A healthy web UI or a successful `backward()` does not prove that LoRA, QLoRA, checkpoints, and resume work end to end.

Once local inference was stable enough to use, I started exploring training on the same AMD Strix Halo machine. The tempting route was to install a complete framework and click “Train.” I chose the opposite: a validation ladder where every rung answers one small question.

The central lesson is simple: **Docker can control dependencies and operations, but configuration is not evidence of training**.

## Inference and training are separate systems

They share the GPU, GTT, RAM, and storage, but their software stacks have different requirements. Inference was already running through Lemonade and a managed `llama.cpp` backend. For training, I first validated an AMD PyTorch container, configured a LLaMA-Factory workspace, and partially validated the Unsloth Studio integration.

Those workspace scripts deliberately do not stop Lemonade or manage unrelated services. That is good separation of responsibility, but it leaves an operational decision for every real run: which resident models should be unloaded, and how much memory headroom should training receive? Process isolation does not remove hardware contention.

## First gate: the smallest useful PyTorch smoke

Before adding tokenizers, datasets, or training frameworks, I used an AMD PyTorch image pinned by digest in an ephemeral container. That smoke exposed `/dev/kfd` and `/dev/dri`; it used no `--privileged`, host network, host IPC, Docker socket, or host ROCm mounts. The later workspace configurations narrow access to `/dev/kfd` and one render node.

The core test was deliberately small:

```python
import torch

assert torch.version.hip
assert torch.cuda.is_available()

for dtype in (torch.float16, torch.bfloat16):
    a = torch.randn((2048, 2048), device="cuda", dtype=dtype, requires_grad=True)
    b = torch.randn((2048, 2048), device="cuda", dtype=dtype, requires_grad=True)
    loss = (a @ b).float().square().mean()
    loss.backward()
    torch.cuda.synchronize()
    assert torch.isfinite(loss)
    assert torch.isfinite(a.grad).all() and torch.isfinite(b.grad).all()
```

PyTorch detected `gfx1151` and the Radeon 8060S. Both FP16 and BF16 2048×2048 matrix operations completed with finite loss and gradients after `backward()`. The ephemeral container was removed afterwards.

### What passed

- the pinned image started on the expected runtime;
- PyTorch detected an AMD GPU;
- FP16 and BF16 matrix compute ran;
- autograd produced finite gradients;
- no smoke-test container remained.

### What remains unproven

- loading a model or tokenizer;
- consuming a dataset;
- an optimizer step;
- training for multiple iterations;
- checkpoint creation and restore;
- quality evaluation;
- sustained thermal or memory-pressure behavior.

This gate rules out several basic runtime failures. It does not certify LLM training.

## Second rung: a LLaMA-Factory workspace

The LLaMA-Factory workspace pins two important inputs:

```dockerfile
ARG BASE_IMAGE=rocm/pytorch@sha256:<AMD_IMAGE_DIGEST>
ARG LLAMAFACTORY_COMMIT=<PINNED_COMMIT>
FROM ${BASE_IMAGE}
```

The base image is selected by digest and the source by commit. That limits accidental movement and makes a build attributable, but it does **not** guarantee byte-for-byte reproducibility: transitive APT and Python dependencies may still change.

Compose exposes only the required AMD devices, binds the web interface to loopback by default, defines a health check, and explicitly persists models, datasets, outputs, and caches:

```yaml
devices:
  - /dev/kfd:/dev/kfd
  - ${RENDER_DEVICE}:${RENDER_DEVICE}
ports:
  - 127.0.0.1:7860:7860
volumes:
  - ./data/models:/workspace/models
  - ./data/datasets:/workspace/data
  - ./data/outputs:/workspace/saves
healthcheck:
  test: ["CMD", "python3", "-c", "<LOOPBACK_HEALTH_PROBE>"]
```

The configuration separates build, start, status, logs, stop, and cleanup. Its startup script is designed to use an existing image, validate the render node, and wait for health instead of rebuilding implicitly. A healthy LlamaBoard startup and framework-level GPU access have not been demonstrated.

There is also a small BF16 LoRA recipe with batch size 1, gradient accumulation, one epoch, and at most 100 samples. It contains placeholders for the model and dataset and is not run automatically. It records **planned validation**, not an outcome.

### What is configured

- pinned AMD base and LLaMA-Factory source;
- minimal device exposure;
- separated persistent storage;
- health and lifecycle scripts;
- a proposed BF16 LoRA proof of concept.

### What is not demonstrated

- a framework-level GPU smoke inside LlamaBoard;
- a LoRA or QLoRA run;
- training loss;
- checkpoint and resume;
- adapter quality.

## Third rung: integrating Unsloth Studio without replacing the AMD stack

Unsloth Studio needed a different approach because its dependency constraints differed. The image uses another PyTorch base, builds the frontend in a separate Node stage, and applies resolver constraints to preserve the AMD Torch and Triton versions. The build also rejects CUDA/NVIDIA substitutions.

The recorded validation passed:

- image build and `pip check`;
- Torch, Triton, and Unsloth imports;
- Radeon 8060S and `gfx1151` detection;
- the health endpoint;
- the web application.

The container runs as a non-root user, binds to loopback, receives only KFD and one render node, and persists Studio state, projects, caches, and temporary data separately. A password is mandatory and stays in private local configuration; no credential is reproduced here.

Two limitations matter:

- `bitsandbytes` is absent, so four-bit QLoRA is unavailable in the recorded stack;
- one FLA path warned that it would fall back to CPU because it did not consider that Triton configuration supported.

The accurate result is therefore “Studio, imports, GPU detection, health, and UI passed,” not “Unsloth trains on Strix Halo.”

## Operational safety is part of the experiment

A repeatable lab is more than a Dockerfile. These workspaces reduce their blast radius through:

- no privileged mode;
- no host network or IPC;
- no Docker socket inside the container;
- no wholesale `/dev/dri` exposure;
- loopback-bound ports by default;
- explicit identity and device-group handling where required;
- credentials kept in local configuration;
- separate bind mounts for code, cache, inputs, and results.

This does not make the environment a hardened production platform. It makes the trade-offs visible and avoids granting host access that an experiment cannot justify.

## Rollback: the image is not the whole state

The scripts are designed to record the real ID of a built image and start from a retained ID. That configures a binary rollback mechanism more reliable than trusting a mutable tag alone, but this article does not claim that a complete rollback was executed.

Returning to an older image does **not** revert:

- datasets;
- downloaded models;
- adapters and checkpoints;
- authentication databases or application state;
- migrations applied to persistent data.

An upgrade therefore needs two plans: image rollback and data backup/compatibility. Pins and digests improve input repeatability, but they do not make the entire package graph hermetic.

## Destructive cleanup is an architectural decision

Both workspaces put cleanup behind explicit gates:

```bash
./cleanup.sh --dry-run   # inventory only
./cleanup.sh --all       # requires explicit confirmation
```

Dry-run wins even when combined with destructive flags. Before deletion, the scripts revalidate contained paths and exact project labels; they use no partial matches, wildcards, or `docker system prune`. Tests run with fake Docker and synthetic data, covering foreign resources, symlinks, and partial failures.

It is easy to dismiss this as plumbing unrelated to ML. I see it as part of the experiment: if an iteration cannot be stopped, inspected, preserved, or cleaned safely, the lab is not repeatable.

## The next honest experiment

The next useful gate is not a large training job. It is a small, bounded BF16 LoRA run that proves, in order:

1. an explicit, reviewed model and dataset;
2. GPU attribution for the workload;
3. finite loss across multiple iterations;
4. time, memory, and temperature bounds;
5. checkpoint creation;
6. stop and successful resume from that checkpoint;
7. output and license review;
8. cleanup without affecting unrelated services or data.

Only after those checks would it be meaningful to discuss practical viability, performance, or framework comparisons.

## Results matrix

| Area | Proven | Configured | Not proven |
|---|---|---|---|
| PyTorch ROCm | GPU, FP16/BF16, `backward()`, finite gradients | bounded ephemeral container | model, dataset, optimizer, checkpoint |
| LLaMA-Factory | — | workspace, operational controls, persistence, health check, and BF16 LoRA recipe | LlamaBoard build/start, GPU smoke, and any fine-tuning |
| Unsloth Studio | build, imports, GPU, health, and UI | isolation, authentication, persistence | training; 4-bit QLoRA unavailable |
| Operations | dry-run and cleanup tests | rollback by image ID | automatic data rollback |

The provisional conclusion is less dramatic but more useful: I now have a foundation for experiments that does not confuse GPU detection with validated training. The lab is evolving; it is not yet a sustained-use fine-tuning platform.

There is one additional evidence limitation: HalostrixLab does not yet have commit history. The sequence comes from dated documentation, pinned artifacts, and recorded results rather than a Git timeline that can reconstruct every change.
