---
title: 'bond: how I got my coding agents working together'
description: 'How bond came to be: my CLI for configuring pi, Claude Code, Codex, Copilot, opencode, Crush or Gemini once per repo and putting them to work as a team with Herdr and git worktrees. From my personal setup to an installable tool in twelve days.'
lang: 'en'
translationKey: 'bond'
slug: 'bond-my-coding-agents-working-together'
pubDate: '2026-10-27T10:00:00+01:00'
tags: ['ai', 'agents', 'herdr', 'cli', 'developer-experience', 'open-source']
category: 'ai'
kind: 'Post · Coding agents'
draft: false
---

If you use more than one coding agent, you probably know this scene: five terminals open, three half-finished branches and no idea which one has spent the last ten minutes waiting for you to answer a question.

Add to that the fact that every agent has its quirks. Claude Code wants a `CLAUDE.md`. pi reads `AGENTS.md`. Copilot looks for MCP servers in one place, opencode in another and Codex in a third, because variety is the spice of life. Switching agents means writing the same configuration again with a different accent.

To stop acting as translator and receptionist at the same time, I built **[bond](https://josecorral.dev/bond/en/)**: a command-line tool that lets you declare once what you want in your repo and opens your agents in a workstation where you can see who is working, who has finished and who needs you.

Its tagline is *licence to code*. Yes, there is a 007 hidden in the logo. No, I do not regret it.

In this post I will tell you what it does, how it works under the hood and, above all, how I built it: in twelve days, with agents, following the same RPI method I described in the [post about my development skills](/en/blog/my-skills-everyday-development-with-agents/).

## Right, but what is bond?

The short version: **one configuration file per repo, translated into each agent's format, and a workstation to use them together**.

The slightly longer version boils down to three commands:

- **`bond setup`**, once per machine. It checks that you have Herdr, detects your models (Ollama, LM Studio, OpenAI or any gateway compatible with its API) and gets the agents you use ready.
- **`bond init`**, once per repo. You pick agents, MCP servers, skills and commands, and bond writes each agent's configuration from a single `.bond/bond.toml`.
- **`bond`**, the everyday one. It opens your repo in Herdr with your favourite agent. And if there is a lot of work, `bond team` splits it across several agents, each on its own branch.

On top of that there is a fourth piece for teams: **catalogs**, a repo with the team's skills, commands and MCP servers, pinned to a version. That way everyone works with the same things, whatever agent they use.

### And what is Herdr?

[Herdr](https://herdr.dev) is a terminal multiplexer designed for agents. If you have used `tmux`, the idea will sound familiar: several panes in one window that stay alive even if you close the terminal. The difference is that Herdr knows there are agents inside those panes and shows their state in a sidebar. It is the difference between having five tabs open and having a board where whoever needs you raises their hand.

bond does not replace Herdr or any agent. **It is the glue**: it makes sure everyone arrives at the meeting configured and sits in the right seat.

## See it in action

Before more words, the video. I open bond with Claude in its pane and ask it, in a single sentence, for a very simple website: make a plan, split it between two pi agents with `bond team` and act as the orchestrator.

The rest happens on its own: each agent writes its page, the live table shows how they are doing, Claude reviews, sends back two fixes, merges into `main` and tidies up the team. No cuts; it takes as long as it takes.

<video controls muted playsinline preload="metadata" width="1600" height="940" style="display: block; max-width: 100%; height: auto; margin: 0 auto 18px;" aria-describedby="bond-orchestrator-caption">
  <source src="/bond-orquestador.mp4" type="video/mp4" />
  Your browser cannot play this video. <a href="/bond-orquestador.mp4">Download the video of bond in action</a>.
</video>
<p id="bond-orchestrator-caption">Claude orchestrates two pi agents: plan, split, four panes at once, review with fixes, merge and cleanup. A real 2 minute 42 second recording, no audio. The CLI messages are in Spanish.</p>

The [bond website](https://josecorral.dev/bond/en/) has four more short videos, recorded on a real Rust project.

## It started as my pi configuration

bond was not born as a product. It was born as a folder called `piSetup` where I kept my [pi](https://pi.dev) configuration, a couple of bash scripts to open sessions in Herdr and a status line to know which pane each agent was in. The kind of thing you build for yourself and swear you will tidy up one day.

The first commit is from 15 October. Version 1.6.3 shipped on the 26th. Quite a lot happened in between:

<figure class="sketch-flow" aria-label="bond's evolution: from personal configuration to CLI, to installable product and to a team tool">
  <ol role="list">
    <li><strong>15 Oct · piSetup</strong><span>My pi config, Herdr scripts and a status line</span></li>
    <li><strong>16 Oct · CLI</strong><span>setup, init, sync and translation into seven agents</span></li>
    <li><strong>16 Oct · 1.0</strong><span>Single binary, installers, Homebrew and MIT licence</span></li>
    <li><strong>20–26 Oct · 1.6</strong><span>Windows, bond team, self-update and team catalogs</span></li>
  </ol>
  <figcaption>Twelve days, fourteen published versions and one conclusion: whatever works for you is usually a tool that wants to leave home.</figcaption>
</figure>

The turning point came at midday on 16 October. Until then pi was mandatory and the installation linked *my* personal configuration. It worked, but only for me. That day I renamed the project to bond, scrubbed everything that pointed at my infrastructure from the docs and wrote a plan with a very specific goal: **in 1.0 no agent is mandatory and nothing personal lives in the repo**.

That same afternoon 1.0 shipped with installers, a self-contained binary and a Homebrew formula. I know, it sounds like I did not sleep. I did. The agents did not.

## One file, seven dialects

The heart of bond is translation. This is the `.bond/bond.toml` from bond's own repo:

```toml
agents = ["pi", "claude"]
default_agent = "pi"
mcp = ["context7", "duckduckgo"]
skills = ["code-context", "git-conventional-commit", "plan-create", "plan-execute",
          "issue-refine-github", "delivery-review-github", "release-prepare-github",
          "convention-document", "plan-team"]
commands = ["commit", "handoff", "review"]
```

With that, `bond sync` generates what each agent expects. Instructions live in a single `AGENTS.md`, which pi, Copilot, Codex, opencode, Crush and Gemini already know how to read. For Claude Code it writes a `CLAUDE.md` with a block that imports `@AGENTS.md`. Skills live in `.agents/skills/` and Claude gets a link to each one in `.claude/skills/`.

Where things get creative is MCP servers and commands:

| Agent | MCP servers | Commands |
|---|---|---|
| pi | `.pi/mcp.json` | Via Bond Extensions and `.pi/prompts/` |
| Claude Code | `.mcp.json` | `.claude/commands/` |
| Copilot CLI | The same `.mcp.json` | Reads Claude's as skills |
| opencode | `opencode.json` | `.opencode/commands/` |
| Crush | `.crush.json` | No project commands |
| Codex | Block in `.codex/config.toml` | No project commands |
| Gemini | `.gemini/settings.json` | `.gemini/commands/*.toml` |

And commands, by the way, take arguments in four different syntaxes: `$ARGUMENTS`, `$1`, `$NAME` and `{{args}}`. If you have ever wondered why open standards matter, here is a whole table of reasons.

### Generating files without trampling yours

A configuration generator that wipes your changes stays installed for exactly as long as it takes you to notice. That is why bond keeps a fingerprint of every file it generates in `.bond/manifest.json`:

- **If you have edited a generated file by hand, it leaves it alone.** It flags it with `!` and lets you know. With `--force` it overwrites it, but keeps a `.bak` copy.
- **In shared JSON files it only rewrites its own keys.** Whatever you added stays.
- **Everything gets committed.** If someone clones the repo without bond, their agents still find their configuration.

Secrets are always written as `${VARIABLE}`. Neither bond nor the repo needs to know your token.

## bond team: worktrees, minions and a table that raises its hand

The part I enjoy using most is `bond team`:

```bash
bond team feat/header feat/footer:claude --base main
```

For each branch it creates a **git worktree**: a separate folder with its own working copy, linked to the same repository. That way each agent works on its branch without stepping on the others' files. It is the difference between giving each builder their own room and squeezing them all into the same bathroom.

Each agent opens in a pane below yours. You are `gru`, and the others are called kevin, stuart, bob… If I was going to have minions, they might as well have the right names. By default they use the repo's agent, but you can pick one per branch with the `:claude`, `:codex` or whatever suffix you like.

On the right, a table appears that refreshes every two seconds and groups branches by state:

- ⛔ **Needs you**, with its pending question.
- 🔄 **Working**.
- ✏️ **Uncommitted**.
- 📦 **To review**.
- ✅ **Integrated**.

Detecting "integrated" is trickier than it looks. A branch can reach `main` by fast-forward, merge, rebase or squash, and each leaves a different trail in git. Version 1.6.3 shipped precisely to fix one of those cases. When there is no pending work left, the table closes itself and `bond team clean` tidies up the integrated worktrees.

There is one decision I consider important: **bond never merges, rebases or pushes**. You do the integration, or the orchestrating agent does it if you ask, as in the video. The tool organises the team; it does not decide for you what goes into `main`.

If you do not want a team but a one-off consultation, the `bond-delegate` skill opens a sibling agent in another pane, hands it a specific task and brings back the result. "Ask Claude to review this" without switching windows. It does, however, never answer the other agent's questions on your behalf.

## Built with agents, but with a blueprint

Here comes the part I most wanted to tell you about. I built bond **working with agents**: it has been the sum of Claude, Copilot and Qwen3.8-Flash, the latter running locally on my [local AI stack](/en/blog/less-waiting-more-agents-local-ai-stack/), all coordinated with bond itself. In the later phases, a good share of the work was done by minions in worktrees… managed by the very tool they were building.

But it was not a matter of "build me a cool CLI" and waiting. I followed the same RPI cycle I described in the [previous post](/en/blog/my-skills-everyday-development-with-agents/): **research, plan, implement**, with my reviews in between.

Every big change has its plan in `docs/plans/`, with:

- **Verified context.** For example, which files each agent really reads, checked against the installed binaries. Not what I thought I remembered.
- **Dated decisions.** The catalogs plan has ten numbered decisions, approved before any code was written.
- **Phases with acceptance criteria.** What gets delivered, how it is checked and what is left out.
- **A progress table** where each phase goes through implemented, verified and accepted. And only I mark "accepted", with the commit and the tests as evidence.

The skills that make this possible (`plan-create`, `plan-execute`, the conventional commits one…) are the ones from [common-skills](https://github.com/fluzo-labs/common-skills), imported and adapted to ship with bond. And here the story bites its own tail in a rather satisfying way: once bond had `bond team`, I added `plan-team`, a skill that takes a plan's independent phases and splits them across minions. From then on, several phases of bond itself were implemented in parallel with bond.

There is a wonderfully unglamorous name for a tool used to build itself: *dogfooding*, eating your own dog food. But it is the best test I know. If something is awkward, you suffer it first. Several improvements to the team table came literally from watching it while working on another project and thinking "this does not tell me what I need to know".

## What I learned along the way

A few stumbles deserve to be written down, if only so I do not repeat them:

- **Windows has opinions.** Symlinks cannot always be created, executables are called `claude.cmd` or `codex.exe`, and the same folder can show up under its 8.3 short name (`RUNNER~1`) or its long one. I ended up copying instead of linking, storing manifest paths with forward slashes so a repo synced on Windows works on Linux, and with a CI that builds and tests the binary on Linux, macOS and Windows.
- **Small models prefer tools to instructions.** Testing with a local model, it ignored the skill explaining how to map the repo and started counting files with `git log`, badly. Turning it into a tool, `repo_map`, fixed it. A small model struggles to decide it should open a manual; a clearly named button it presses without trouble.
- **A trust dialog can eat your first task.** When an agent opened in a new worktree, pi asked whether to trust the folder. Herdr saw it as idle, sent it the task, and the task ended up answering that dialog. Now the worktree inherits the trust you had already given the main repo.
- **Names matter.** The web search server was called `web` until I found out OpenAI reserves that namespace. Now it is called `duckduckgo`, which also describes it better.

## What is tested and what I do not want to promise

I would rather be clear about the limits:

- **Codex and Gemini:** their configuration is generated from their documentation and validated, but I have not yet tested it thoroughly with those agents. pi, Claude Code and Copilot are the ones I use most.
- **Local models:** bond can bring your models to pi, opencode, Crush, Codex and Copilot. Claude Code and Gemini only speak their provider's API, so there is no magic there.
- **Language:** the CLI messages are in Spanish. The documentation has an English version and says so.
- **Distribution:** there are installers for Linux, macOS and Windows and a Homebrew formula. The npm and AUR packages are prepared but not published.
- **Integration:** as I said, bond does not integrate branches for you. That is a decision, not a gap.

## Install it

```bash
brew install jmanuelcorral/tap/bond                                                    # macOS and Linux
curl -fsSL https://raw.githubusercontent.com/jmanuelcorral/bond/main/install.sh | sh   # without Homebrew
```

On Windows:

```powershell
powershell -ExecutionPolicy Bypass -c "irm https://raw.githubusercontent.com/jmanuelcorral/bond/main/install.ps1 | iex"
```

Then `bond setup` and off you go. The installers check the SHA-256 sum of the binary they download, but the usual advice still stands: **before piping a script from the internet into your shell, take a look at it**. It is about sixty lines; one coffee's worth of reading.

The [getting started guide](https://josecorral.dev/bond/en/getting-started) walks you through it step by step, and the code lives at [github.com/jmanuelcorral/bond](https://github.com/jmanuelcorral/bond) under the MIT licence. If something breaks or you think of an improvement, open an issue: it is genuinely appreciated.

## Licence to code

When I wrote about my [local AI stack](/en/blog/less-waiting-more-agents-local-ai-stack/), the goal was to wait less so I could put agents to work. With the skills I wanted them to work with a method. bond is the third leg: letting them **work together** without me acting as the switchboard.

It is not an autopilot. I still plan, review and decide what goes into `main`. What has changed is everything around it: I no longer rewrite the same configuration in seven formats, or search through five terminals for whoever's turn it is to talk.

They write the code. I am still the one who signs the licence.
