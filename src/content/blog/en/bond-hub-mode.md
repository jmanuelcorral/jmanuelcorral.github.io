---
title: 'A hub for coordinating coding agents across repositories with bond'
description: 'How bond’s hub mode works: a project spread across repos, one vertical branch and one agent per repository, coordinated from a single place.'
lang: 'en'
translationKey: 'bond-modo-hub'
slug: 'bond-hub-mode-multiple-repositories'
pubDate: '2026-11-04T10:00:00+01:00'
tags: ['ai', 'agents', 'herdr', 'cli', 'developer-experience', 'open-source']
category: 'ai'
kind: 'Post · Development agents'
draft: false
---

In the [previous article about bond](/en/blog/bond-my-coding-agents-working-together/), I showed you how to split work between agents inside one repository. For me, that would be level 1 for any project I face day to day; most of my work involves multi-repo solutions. The frontend is in one repo, the API in another and the shared library in a third. Then comes an apparently innocent task: “add this field to the profile”. Turns out the field has to show up in three places, talk to two services and, for some reason, survive a migration.

I could open a team in each repo, create branches by hand and copy the task into every terminal. Or I could trust each agent to guess what the other is doing. The first makes me a secretary; the second, a spiritualist. Neither was the workflow I wanted.

That is why I added **bond’s hub mode**: an operations repository that brings several repos together and lets you coordinate one agent per repo from a [Herdr](https://herdr.dev) session. It does not turn the project into a monorepo or make you move your code. There are enough migrations in any project without organising another one for the sake of it. The hub adds a shared description and a way to work across those repos as one unit.

## What is a hub?

A **hub is a shared git repository that describes a session made up of several repositories**. Its root contains `hub.toml`, where I declare the project’s repos, their base branches and the agent each one uses. Repositories can be mounted as submodules if I want to share the setup with my team, or as symlinks to clones already on my machine.

Each repo keeps its history, remote and independent life. I do not glue them into a monorepo with duct tape. The hub is the map: it describes the pieces and how to work with them while each repo stays in its own home.

<figure style="margin: 28px 0;">
  <svg viewBox="0 0 700 325" role="img" aria-labelledby="hub-tree-title-en hub-tree-desc-en" style="display: block; width: 100%; height: auto;">
    <title id="hub-tree-title-en">Folder structure of a bond hub</title>
    <desc id="hub-tree-desc-en">The hub contains hub.toml, AGENTS.md, a repos folder with frontend and backend, and a docs folder with plans.</desc>
    <g fill="none" stroke="var(--muted)" stroke-width="2">
      <path d="M350 74v34M90 108h510M90 108v24M260 108v24M430 108v24M600 108v24" />
      <path d="M430 188v28M370 216h120M370 216v30M490 216v30M600 188v28h25v30" />
    </g>
    <g font-family="var(--font-mono, monospace)" text-anchor="middle">
      <g>
        <rect x="240" y="16" width="220" height="58" rx="13" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="2" />
        <text x="350" y="40" fill="var(--muted)" font-size="11" letter-spacing="1.5">HUB</text>
        <text x="350" y="60" fill="var(--fg)" font-size="17" font-weight="700">my-hub/</text>
      </g>
      <g>
        <rect x="18" y="132" width="144" height="56" rx="11" fill="var(--surface)" stroke="var(--indigo)" stroke-width="2" />
        <text x="90" y="154" fill="var(--muted)" font-size="10" letter-spacing="1">CONFIG</text>
        <text x="90" y="176" fill="var(--fg)" font-size="15" font-weight="700">hub.toml</text>
      </g>
      <g>
        <rect x="188" y="132" width="144" height="56" rx="11" fill="var(--surface)" stroke="var(--indigo)" stroke-width="2" />
        <text x="260" y="154" fill="var(--muted)" font-size="10" letter-spacing="1">INSTRUCTIONS</text>
        <text x="260" y="176" fill="var(--fg)" font-size="14" font-weight="700">AGENTS.md</text>
      </g>
      <g>
        <rect x="358" y="132" width="144" height="56" rx="11" fill="var(--surface)" stroke="var(--accent)" stroke-width="2" />
        <text x="430" y="154" fill="var(--muted)" font-size="10" letter-spacing="1">REPOSITORIES</text>
        <text x="430" y="176" fill="var(--fg)" font-size="15" font-weight="700">repos/</text>
      </g>
      <g>
        <rect x="528" y="132" width="144" height="56" rx="11" fill="var(--surface)" stroke="var(--accent)" stroke-width="2" />
        <text x="600" y="154" fill="var(--muted)" font-size="10" letter-spacing="1">DOCUMENTATION</text>
        <text x="600" y="176" fill="var(--fg)" font-size="15" font-weight="700">docs/</text>
      </g>
      <g>
        <rect x="310" y="246" width="120" height="58" rx="11" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="2" />
        <text x="370" y="268" fill="var(--muted)" font-size="10" letter-spacing="1">FRONTEND</text>
        <text x="370" y="290" fill="var(--fg)" font-size="14" font-weight="700">frontend/</text>
      </g>
      <g>
        <rect x="430" y="246" width="120" height="58" rx="11" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="2" />
        <text x="490" y="268" fill="var(--muted)" font-size="10" letter-spacing="1">BACKEND</text>
        <text x="490" y="290" fill="var(--fg)" font-size="14" font-weight="700">backend/</text>
      </g>
      <g>
        <rect x="555" y="246" width="140" height="58" rx="11" fill="var(--indigo-soft)" stroke="var(--indigo)" stroke-width="2" />
        <text x="625" y="268" fill="var(--muted)" font-size="10" letter-spacing="1">PLANS</text>
        <text x="625" y="290" fill="var(--fg)" font-size="14" font-weight="700">plans/</text>
      </g>
    </g>
  </svg>
  <figcaption style="margin-top: 12px; color: var(--muted); text-align: center; font-size: 12px;">The hub brings together the shared configuration, instructions, repositories and documentation.</figcaption>
</figure>

Bond writes a block to the hub’s `AGENTS.md` with the repo list and rules for the orchestrator. The agent has a map before it wanders off asking where the API is. The rest of the file stays mine: bond leaves anything outside its block alone, a courtesy I try to return.

## A vertical branch: one change across several repos

In regular mode, `bond team` creates a branch and worktree for each agent: every minion gets an independent task. In a hub, the unit of work changes: **one vertical branch represents a task that crosses several repositories**. The same change, the same branch, different parts of the system. “Vertical” makes more sense with an example; explaining branches with another metaphor usually ends in napkins.

Once the hub is ready, I can give the orchestrator **one instruction** to open the team, split a task from start to finish and review the result: one request, one agent per repo, and me following how they coordinate.

In the way I use a hub, **there is always an agent active in the hub repo itself**: that agent handles orchestration. In each repo, an implementation agent handles development and testing; in my setup, another agent reviews the result. One agent per repo is the minimum the hub supports, not a required team size.

In a project I am developing at work right now, Claude Opus stays in charge of orchestration. Each repo has either Claude Sonnet or an Antigravity agent implementing and testing changes; a pi agent running local models reviews the result too. The structure repeats in each repo:

Bond provides the map and the minimum team needed to work across repos; from there I can assign roles and models to fit the task. They do not all need to wear the same uniform. Sharing a `git status` is enough common ground.

<figure class="sketch-flow" aria-label="Agent layers in a hub: Claude Opus orchestrates from the hub; in each repo, Sonnet or Antigravity develops and tests, and pi with local models reviews">
  <ol role="list">
    <li><strong>Hub · Claude Opus</strong><span>One agent orchestrates the whole task</span></li>
    <li><strong>The same branch in each repo</strong><span>Bond creates a worktree in each participating repository</span></li>
    <li><strong>Sonnet or Antigravity</strong><span>In each repo: development and tests</span></li>
    <li><strong>pi · local model</strong><span>In each repo: review the result</span></li>
  </ol>
  <figcaption>The first card lives in the hub repo. The last two repeat in every repo in the task: Opus coordinates, implementation agents build and test, and pi reviews.</figcaption>
</figure>

The task reaches the agents on that branch with context about their repo and teammates. That way, the frontend agent knows the backend is working on it too, and they can agree on the endpoint and response shape. It is not telepathy: a little context is cheaper than debugging two very creative interpretations of “the same contract”.

Herdr opens one status pane for the whole session. I do not have to make a pilgrimage through every terminal to find out who has finished and who has spent five minutes waiting for me to confirm that yes, it can read the file. At the end, `bond team collect` gathers reports and commits from each repo; `bond team clean` removes the worktrees. The commits stay. The minions go back in their drawer; the work stays put.

There is one deliberate rule: a hub can have only **one active vertical branch at a time**. Changes across repos often depend on each other; opening several vertical branches at once can turn the board into a coordination meeting nobody asked to attend. You can still choose which repos take part in that one branch.

## Get it ready without learning another tool

There is no need to set everything up by hand. `bond hub init` interactively guides you through creating the hub, adding repos by URL or from local clones, and setting up repos that do not use bond yet. You can also pass all the details at once with `--yes`, as you would in a script. Then `bond hub check` reviews links, base branches and agent configuration. With `--fix`, it can fix the safe things. It tells you about the rest; we should leave a few decisions to a person.

`bond hub pull` updates base branches with *fast-forward*: it fetches remote changes and advances when it can, but does not resolve divergences. If a repo has local changes or its branch has split, it leaves it alone and tells me. Integrating work branches, updating submodule pointers and pushing remain my call. The tool coordinates; it does not sign on my behalf.

Once created, I can version and share the hub. The paths to linked local clones go in `.bond/hub.local.toml`, which is not pushed to the remote. We share the map; everyone supplies the address of their own house. Computing can be reasonable, when it puts its mind to it.

## The first problem I ran into at work

Hubs were one of the first things I ran into when I started using agents in my day-to-day work. The problem was not “how do I launch another agent?” but how to organise a task when the product lives across several repos. bond’s hub mode grew out of that practical need, not from a whiteboard full of arrows begging to become a product.

And these days I use hubs to coordinate more than code changes. I also use them to order deployments. For example, if several components need to reach development in a particular sequence, I can ask an agent to follow that order from the hub. One of my skills runs the GitHub deployment pipelines and automates the steps needed between them. That way the sequence lives in a procedure instead of depending on me remembering which button to press first after coffee.

The skill knows how to run those pipelines; the hub provides the project context and the place from which I coordinate the task. There is no secret deployment system hidden inside `bond team`: it is the usual set of pieces—repos, instructions and a skill—working together.

## What about GitHub Copilot Projects, Codex and Claude?

Coordinating agents is no longer unique to one tool. GitHub Copilot in its app lets you create a project and have Copilot coordinate work; Codex offers parallel chats and worktrees, and Claude Code has subagents and agent teams. Google Jules also lets you launch parallel tasks, though Google has announced it will shut the service down on December 31, 2026. Each product keeps evolving, and its exact options depend on the version and environment. ([GitHub Copilot](https://docs.github.com/en/copilot/how-tos/github-copilot-app/working-with-projects), [Codex](https://learn.chatgpt.com/docs/environments/git-worktrees), [Claude Code](https://code.claude.com/docs/en/agent-teams), [Google Jules](https://jules.google/docs/changelog/2026-10-29))

The distinction I care about in bond is more concrete: **a hub describes independent repos and can split one task across agents from different providers**. GitHub Projects organises work from GitHub; Codex and Claude provide coordination in their own environments. Bond starts from a local Herdr session and uses the agent configured for each repo. I am not saying the other tools cannot work across repos, or that bond invented teamwork. The useful bit is connecting different agents and repos in one workflow without building a home-grown terminal switchboard.

For example, the frontend can use pi and the backend Claude Code, or both can use pi if I want to keep the workflow uniform. I choose an agent per repo in the configuration or change it when starting the team. These are regular processes and worktrees; git is still underneath, wearing its hard hat.

## When it makes sense

I would use a hub if a task often touches connected pieces that live in separate repos: a frontend and API, services with a shared contract, an app and a library. It can also help a team keep repos independent while sharing a map and cross-repo plans. That is my situation: I did not want to change the project architecture just to coordinate the work.

If you have one repo, you do not need a hub. `bond init`, `bond` and `bond team` still do the job. And if a task crosses repos but cannot be split clearly, putting one agent in each does not make it parallel by magic. Sometimes you have to define the contract first and carry on afterwards. Git still has no “make it simultaneous and make it work” button; I am afraid that bit is still part of the job.

## The agents work; you integrate

Hub mode makes it easier to start and supervise a change across repositories, but the important decisions are still mine. Bond does not merge, rebase or push. Worktrees isolate changes and the status pane makes them visible; checking that the pieces fit is still engineering work. The minions help a lot. Technical judgement still does not fit in a Herdr pane, as far as I know.

The code is at [github.com/jmanuelcorral/bond](https://github.com/jmanuelcorral/bond), under the MIT license. The [hub mode guide](https://josecorral.dev/bond/en/workstation#a-vertical-branch-in-a-hub) covers the commands and options. For the details, there is also the [reference](https://josecorral.dev/bond/en/reference#bond-hub).
