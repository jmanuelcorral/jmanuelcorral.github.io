---
title: 'Getting Kubernetes running on Windows 10'
description: 'Standing up a local Kubernetes cluster on Windows 10 with Docker Desktop was never a smooth ride. These are the fixes that actually unblocked me.'
lang: 'en'
translationKey: 'kubernetes-windows-10'
slug: 'setting-up-kubernetes-on-windows-10'
pubDate: '2019-03-18T10:31:56-05:00'
updatedDate: '2026-09-08'
tags: ['kubernetes', 'windows', 'docker', 'beginner']
draft: false
---

> **Editorial note (2026 revision).** This piece was written in 2019, back when Docker Desktop ran on the Hyper-V backend and sharing drives was a mandatory step. It has been revised to remove an unsafe recommendation from the original — turning off the firewall — and to refresh product terminology. It is still a historical article: Docker Desktop's menus, versions and default backend have all moved on, so read it as context rather than as a literal step-by-step guide.

Getting Kubernetes running on Windows 10 used to be genuinely fiddly. It cost me more time than I expected: all I wanted was a local cluster to experiment with, and I ended up fighting memory limits, disk permissions and network rules instead.

My starting recommendation hasn't changed: install the latest stable **Docker Desktop for Windows** and turn Kubernetes on from its settings (*Settings → Kubernetes → Enable Kubernetes*). Docker Desktop ships a built-in single-node cluster, which is plenty for local development.

Here's what got me unstuck.

## 1. Give Docker more memory

With the default allocation, plenty of images die without a useful error message. Back in 2019 I bumped memory to **4096 MB** and the problems went away; if you're running databases (SQL Server, Elasticsearch and friends) you'll likely want more.

The setting lives under *Settings → Resources*. On the WSL 2 backend, memory isn't configured there at all — it comes from `%UserProfile%\.wslconfig`:

```ini
[wsl2]
memory=6GB
processors=4
```

## 2. Don't disable the firewall — open only what you need

The original version of this post told you to switch off the Windows firewall because it was blocking `vpnkit`, the process Docker Desktop uses to publish ports. **Don't do that.** Disabling your whole firewall to fix a local development problem leaves the machine exposed and, just as importantly, hides what the real problem was.

Narrow it down instead:

- In *Windows Defender Firewall → Allow an app*, check that Docker Desktop's processes (`vpnkit.exe`, `com.docker.backend.exe`, `Docker Desktop.exe`) are allowed on the network profile you're actually on. If your network is classified as *Public*, a lot of rules simply don't apply — switch the network to *Private* rather than tearing the firewall down.
- If you run third-party antivirus or a third-party firewall, read **its** logs. In my experience most `vpnkit` blocks came from there, not from the Windows firewall.
- An active corporate VPN client can hijack Docker's networking too. Disconnect it briefly to rule it out.

If turning the firewall off makes things work, that only tells you *where* the block is — not that leaving it off is the fix. Turn it back on and add the specific rule.

## 3. Share your drive (Hyper-V backend only)

To mount volumes from Windows you had to explicitly share the drive with Docker (the `C:` drive in my case), under *Settings → Resources → File Sharing*.

That step, and the credential problems it dragged along on Azure AD accounts, **are history on the WSL 2 backend**: files are shared directly and there is nothing to authenticate. If you're still on Hyper-V, moving to WSL 2 will save you that particular headache.

## 4. Read the logs before improvising

Docker Desktop writes its logs to:

```text
%LOCALAPPDATA%\Docker\log
```

The active file is usually the one without a trailing number. That's where you'll actually see whether the failure is the VM, the cluster bootstrap, or the control-plane image pull — which takes a good while the first time and looks like a hang even though it isn't.

It's also worth checking your `kubectl` context, because pointing at the wrong cluster is a classic:

```bash
kubectl config get-contexts
kubectl config use-context docker-desktop
kubectl get nodes
```

Older versions named the context `docker-for-desktop`; today it's `docker-desktop`.

## 5. When all else fails, reset

When a step runs out of order, Docker Desktop can end up in a state it won't recover from. *Settings → Troubleshoot* gives you **Reset Kubernetes cluster** (wipes only the cluster) and **Reset to factory defaults** (wipes everything).

Always try the first one. Recreating the cluster fixes an astonishing number of problems and it won't take your already-pulled images down with it.
