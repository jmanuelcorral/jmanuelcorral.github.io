---
title: 'Applying RPI strategies to my coding agents'
description: 'How I built common-skills to stop repeating instructions to coding agents: from a vague idea to a reviewed change, with everyday examples and no magical autopilot.'
lang: 'en'
translationKey: 'common-skills-desarrollo-diario'
slug: 'my-skills-everyday-development-with-agents'
pubDate: '2026-09-30T10:00:00+02:00'
tags: ['ai', 'agents', 'skills', 'developer-experience', 'github']
category: 'ai'
kind: 'Post · Coding agents'
draft: false
---

There is a part of working with coding agents that feels suspiciously like giving the same onboarding talk every day.

“Read the project first. Do not change things I have not asked you to change. Check whether there are tests. Do not commit yet. And no, fixing a button does not include redesigning the application.”

Getting AI to write code is relatively easy. Getting it to work with a recognisable set of standards provides rather more entertainment. You ask it to change a button colour; it sees an opportunity to migrate the design system. Plenty of initiative. Someone just needs to take away the sledgehammer.

To avoid rebuilding that conversation every time, I have collected my way of working in [common-skills, the Fluzo skills collection](https://github.com/fluzo-labs/common-skills). **Fluzo is my own agentic programming environment, a project I am working on.** In a future post, I will show you what it is about and how I am building it; today I am focusing on one of its pieces: the skills I use to organise the software engineering process, from understanding a need to planning, implementing, reviewing and preparing a delivery.

This collection packages that part of the project as instructions I can also reuse outside Fluzo. These are not seven new agents or a framework you need to deploy. They are **reusable instructions for recurring development tasks**.

The idea is not to stop thinking. It is to stop repeating the same introduction before thinking about what matters.

## Right, but what is a skill?

In this context, a *skill* is a small guide an agent can load when it needs to perform a particular task. It explains when to use it, what information is needed, how to proceed and how to check that the job is done.

Think of a recipe. “Make something tasty” leaves plenty of room for creativity. “We are making an omelette, here are the ingredients, and this does not go in the pan” reduces a few surprises.

In the repository, each skill lives in its own folder with a main file called `SKILL.md`. It can include references, templates or scripts if needed. There is no requirement to create every possible folder just for the love of folders.

**I am not training the model or installing permanent knowledge into it.** I am giving it a procedure it can consult. Whether it discovers and uses that procedure depends on the tool running the agent and its configuration.

I separate things like this:

- **Project instructions**, such as `AGENTS.md`, explain the house rules: structure, commands, style and things that must not be touched.
- **The skill** explains how to approach a task: refine an issue, execute a phase or prepare a delivery.
- **My request** specifies what I want to do now and how far I authorise it to go.

The recipe does not come with permission to remodel the kitchen. Or install Kubernetes because the omelette “needs to scale”.

### Specialised agents and skills: who does the work and how

**These skills work across agent specialisations; they do not replace specialised agents.** I can have an agent focused on architecture, another on frontend and another on testing. That specialisation defines its focus, but does not by itself guarantee that it investigates before changing code, respects scope or checks the result.

The agent brings its specialisation; the skill provides **the procedure it should follow for the task at hand**. For example, a frontend agent can use `plan-execute` to implement a UI phase, while a backend agent follows the same skill for an API phase. The code and project checks change, but the need to read the context, stay within the approved scope and present evidence does not.

This does not mean every agent has to run every skill, or that the collection coordinates a team of agents on its own. Each uses the skills appropriate to its task and permissions. What they share is a way of working, not an invitation for three agents to edit the same file at once and call it collaboration.

In other words: **specialisation answers “who handles this?”; the skill answers “which steps should they follow?”** Putting “senior architect” in an agent's name does not make it read the repository. If only job titles came with that feature built in.

## The philosophy behind it: RPI, think before you type

These skills follow the **RPI philosophy: Research, Plan, Implement**. I did not invent it, and you do not need to buy a certification to understand it. It means not starting with step three, a proud computing tradition with plenty of followers. I cannot claim innocence myself.

The RPI cycle at a glance. Review is the checkpoint, not a fourth letter I forgot to include:

<figure class="sketch-flow" aria-label="RPI cycle: research, plan, implement and review to decide whether to move forward or go back">
  <ol role="list">
    <li><strong>R · Research</strong><span>Explore the project and resolve unknowns</span></li>
    <li><strong>P · Plan</strong><span>Agree on scope, phases and checks</span></li>
    <li><strong>I · Implement</strong><span>Execute and verify one authorised phase</span></li>
    <li><strong>Review</strong><span>Compare the result with what was agreed</span></li>
  </ol>
  <figcaption>If our understanding changes, return to Research or Plan. If the phase is accepted, select the next authorised phase or finish the work. Arrows show the order; they do not grant permissions.</figcaption>
</figure>

This is how it fits into my workflow:

| Stage | What I want to resolve | Where the skills fit |
|---|---|---|
| **Research** | Understand the existing code, project rules, problem and remaining unknowns | Reading the project and refining with `issue-refine-github`; also the initial analysis in `plan-create` |
| **Plan** | Decide what to change, what to leave alone and how to check the result | `plan-create`, or the approved plan in GitHub issues, with clear phases and criteria |
| **Implement** | Execute the agreed work and verify it without enthusiasm expanding the scope | `plan-execute`, one phase at a time, with checks and review |

Research here does not mean spending half the morning looking for articles. Often it means opening the file that already solves something similar. Not a particularly futuristic technique, but surprisingly compatible with artificial intelligence.

**These are not three boxes I tick once and forget.** If implementation reveals something that undermines the plan, it is time to investigate again and adjust what we agreed. Not keep digging because we have already rented the excavator.

Nor does every skill represent a letter in RPI. Commits, delivery, conventions and releases support that core: they record the work, help review it and preserve decisions. RPI sets the order; the other pieces help keep the result from living forever on a branch called `final-for-real-this-time`.

## Why I prefer my own plan to the built-in “Plan agent”

Copilot and OpenCode already offer ways to plan before touching code. So why make my own? A case of “I could build that in a weekend”? Some suspicion is fair, but I am not building another agent here: I am defining **what I expect from a plan**, regardless of who writes it.

Each tool's planning modes or agents are a useful starting point. Their capabilities and restrictions vary by version and configuration; I am not assuming they cannot do any of this. I simply prefer not to depend on their default instructions or explain my method again whenever I switch tools.

With `plan-create`, I make these expectations explicit:

- **Context before a pretty list:** inspect the project, existing work and open questions before proposing changes.
- **Reviewable phases:** scope, dependencies and acceptance criteria, not “implement the solution” with a checkbox beside it. I can write that myself without spending any tokens.
- **A result I can keep:** for a local plan, I review its content and destination before saving it. If the work lives in GitHub, its issues remain the authority on progress.
- **Continuity into execution:** give `plan-execute` a specific phase, its boundaries and its checks, rather than letting it freely interpret the previous conversation.
- **Separate plans from permissions:** approving how we will do something does not authorise a commit, push or publication.

**It is not “my plan is smarter”, but “my procedure is explicit, reviewable and portable”.** The skill lives in files I can version and adjust. That does not guarantee identical responses across models, but it does let me keep the same expectations regardless of what the planning button is called.

These options are not mutually exclusive, either: I can use a tool's planning mode and ask it to follow my skill, provided it can load it and its restrictions allow that. The tool provides the environment; I provide the script. I do not need two site managers arguing. I need someone to read the drawings before knocking down the wall.

## How I built them: small, specific and able to stop

I have organised the collection around work rather than characters. I do not need to name a “visionary architect” and a “release ninja”. I need something to clarify a task, prepare a plan and show me what it checked.

The starting template has a fairly down-to-earth structure:

1. **Name and description.** Above all, when it should activate. “Helps with GitHub” is too broad; “checks whether this issue needs clarification or splitting” actually says something.
2. **Requirements.** The necessary tools, access and information. Writing `gh` in an instruction does not install GitHub CLI or sign you in.
3. **Procedure.** What to read, which decisions to make and what result to deliver.
4. **Validation.** What to check and what to do when information is missing, a test fails or the project state has changed.
5. **Boundaries and continuation.** Where to stop and what a sensible next step would be, without taking it independently.

Longer details go in `references/`, inside the skill itself, and the main file explains when to consult them. That keeps each instruction from becoming an encyclopaedia the agent has to load every time.

I have also aimed to make **each folder portable to another project**. It should not depend on paths from my machine or files hidden in a neighbouring skill folder. When a step needs another skill, it looks for it by name among those installed; if it is missing, it says so. It does not wander off and download it as a surprise.

Alongside phased execution, the collection has grown to include documenting conventions, concrete recommendations for continuing and a bounded autonomous mode. The common thread is the same: **passing context to the next step does not mean handing it a blank cheque**.

## Seven pieces, without learning seven manuals

The names are in English because they are the skill identifiers. You do not have to address them in English: responses follow the project language and rules or, if none exist, those of the request.

| Skill | What I use it for |
|---|---|
| `issue-refine-github` | Clarifying a GitHub task and deciding whether it is ready, needs detail or should be split |
| `plan-create` | Turning a goal into a local plan with phases and criteria for knowing it is solved |
| `plan-execute` | Implementing one approved phase, checking it and showing the result |
| `git-conventional-commit` | Recording reviewed changes with a consistent commit message when I ask |
| `delivery-review-github` | Preparing a delivery and its pull request; checking what comes next after integration |
| `convention-document` | Writing down an agreed decision so we do not debate it again from scratch |
| `release-prepare-github` | Preparing change notes, a version proposal and release checks |

An **issue** is a task record. A **pull request**, or PR, is a proposal to review and integrate changes. A **commit** saves a revision of those changes in Git. These are separate moments, even if it is tempting to bundle them all into “go on, ship it”.

I do not run through all seven skills to fix a typo. The idea is to remove repetitive work, not set up a paperwork department for editing one line.

### The full skills lifecycle

This is the guided journey for a task going through GitHub. Read left to right, then continue on the second row; on mobile, read top to bottom. It is not a conveyor belt: I still have to turn up for the reviews. How inconvenient.

<figure class="sketch-flow" aria-label="Skills development lifecycle: refine, plan, implement, review, commit, deliver, verify the merge and decide what comes next">
  <ol role="list">
    <li><strong>1 · Clarify</strong><span>issue-<wbr>refine-<wbr>github</span><span>Investigate the issue and propose scope</span></li>
    <li><strong>2 · Plan</strong><span>plan-<wbr>create</span><span>Optional local draft; approve the local or GitHub plan</span></li>
    <li><strong>3 · Implement</strong><span>plan-<wbr>execute</span><span>One authorised phase, tests and progress</span></li>
    <li><strong>4 · Review</strong><span>Human review</span><span>Examine the diff and evidence; correct if needed</span></li>
  </ol>
  <p>After review, delivery continues only with the corresponding authorisations:</p>
  <ol role="list" start="5">
    <li><strong>5 · Record</strong><span>git-<wbr>conventional-<wbr>commit</span><span>Requested local commit; no push yet</span></li>
    <li><strong>6 · Deliver</strong><span>delivery-<wbr>review-<wbr>github</span><span>Propose push and PR; publish only what is authorised</span></li>
    <li><strong>7 · Integrate</strong><span>Separate review and merge</span><span>delivery-<wbr>review-<wbr>github then verifies the merge and actual state</span></li>
    <li><strong>8 · Continue or finish</strong><span>Next phase, finish or release-<wbr>prepare-<wbr>github when a version is needed</span><span>Publishing the release requires separate authorisation</span></li>
  </ol>
  <figcaption>The cycle returns to the next eligible phase in the plan; if clarification is needed, return to refinement. Recommending the next step does not execute it. At any stage, convention-document can record a confirmed agreement and return us to the pending step. For local-only work, skip push, PR and merge.</figcaption>
</figure>

## My everyday workflow, explained with a small task

To make their use concrete, I will follow a fictional example: **adding a tag filter to the article listing**. This is not an actual delivery or a productivity measurement; it is a way to walk through the workflow without showing a private backlog.

The following sentences are messages to the agent, not terminal commands. I send them separately, after reviewing the previous result.

### 1. Before writing code, work out what we are asking for

An issue saying “add filters” can hide five different interpretations. One tag or several? What happens with no results? Does it need to work on mobile too? Two words of requirements and we already have enough material for a trilogy.

> Use issue-refine-github to review this issue. Propose scope and acceptance criteria. Do not modify GitHub yet.

The useful part is not generating more text. It is exposing decisions that would otherwise surface halfway through the code.

If the task is already clear and small, I do not need to turn it into a twelve-issue saga. If it is large, the skill can propose splitting it. **Proposing does not mean automatically creating those tasks.**

### 2. Make a plan that can actually be reviewed

When I need a local draft, I turn to `plan-create`:

> Use plan-create to plan this filter. Include expected behaviour, affected files and checks. Show me the plan before saving it.

I want pieces of work that make sense on their own. “Do the frontend” does not help much. “Filter by one tag, allow clearing the filter and show the empty state” is something I can review.

If the work is managed in GitHub, issues remain the source of truth for progress. A local document can help with thinking, but I do not want two task lists telling different stories. My estimates and my calendar already provide all the parallel universes I need.

### 3. Execute one part, without fixing the entire world

With the plan reviewed and saved in the agreed location:

> Use plan-execute to implement only P1 of the approved plan. Run the project checks and show what you changed. Do not commit or publish anything.

The skill reads the context, checks dependencies, works on that phase and presents evidence. For an authorised local plan, it also updates that phase's progress.

For me, three states need to stay separate: **implemented, verified and accepted by a person**. An agent marking a task as done does not mean I have reviewed the behaviour. And “I could not run the tests” is not a creative version of “everything is green”.

Checking does not always mean running the same command, either. On this blog, the gates are `npm run check`, `npm run validate:content` and `npm run build`. In another project, they will be whatever that project defines. The skill should adapt rather than impose its favourite stack.

### 4. Review, record and prepare the delivery

After a phase with changes, the workflow offers three commit message proposals using the corresponding skill. I read the diff, review the checks and choose when I am happy:

> Commit with option 2 using git-conventional-commit, only for the reviewed changes. Do not push.

The commit is local. Publishing the branch is another decision. To prepare that next step:

> Use delivery-review-github to propose the push, PR and issue update. Show me the destination, content and evidence before publishing.

This lets me review both the code and the story we are telling about it. “Tests passed” needs to correspond to tests that actually ran, and an intermediate PR should not declare the entire project finished.

Publishing requires authorising the specific operations. Merging the PR remains a separate decision. Once it has been merged, I can ask the skill to verify the merge and recommend the next pending issue, prioritising phases from the current plan. **Recommending it does not mean starting its implementation.**

## The other two things I do not want to improvise

### Agreements that evaporate when the chat closes

A useful decision can emerge during a task: for example, that error messages should explain how to recover rather than merely announce that something failed.

Once we have agreed on it, I can ask:

> Use convention-document to document this agreement, with examples and exceptions, and update the index. Do not commit.

The important word is **agreement**. The skill should not turn an idea of its own into team law. It helps keep the next session from starting with the same discussion all over again. If we are going to debate a folder location three times, the third round should at least come with minutes.

### Releases when needed, not every Tuesday out of obligation

I do not prepare a release for every change. When it is time, `release-prepare-github` separates three jobs: drafting the changelog, preparing the version and evidence, and publishing what has been authorised.

> Use release-prepare-github to prepare the next version from the base tag and candidate SHA we agreed on. Include changes and checks; do not create tags or publish.

A **tag** names a Git revision; the **SHA** identifies the specific commit. Fixing those points avoids “the next version” ending up with something different from what we reviewed.

The skill can use Git and, optionally, an existing git-cliff installation for the notes. It does not need to install tools on its own. And approving the version PR does not automatically authorise publishing the release.

## What if I want it to continue without asking every time?

The usual mode is guided, but I have also added a **bounded, sequential autonomous mode**. The idea is to authorise specific work in advance, not write “do whatever you want” and cross my fingers. That is not delegation: it is turning the repository into an escape room for tomorrow's me.

That means defining tasks or phases, the repository, writable files, checks, limits and permitted operations. Permission to implement does not include committing, pushing or opening a PR.

The agent in the session connects the permitted steps. There is no new squad of agents, service watching GitHub or machinery running behind the curtain. It stops at blockers or mandatory reviews; publishing a PR is also a stopping point. This first autonomous version excludes merging, tags, release publication and deployment.

And an important qualification: **these are instructions, not a system-enforced security boundary**. They do not guarantee that the agent will never make a mistake. Actual permissions and hard time or cost limits need to be enforced by the tool running it.

## How to try them without adopting my whole ritual

The [common-skills repository](https://github.com/fluzo-labs/common-skills) includes a catalogue, usage guide and a template for building other skills. You can start with just one.

The documentation proposes these commands from your project root, with Node.js/npm, Git and network access:

```bash
npx skills add fluzo-labs/common-skills --list
npx skills add fluzo-labs/common-skills --skill '*' --agent universal --copy
```

The first lists the available skills; the second copies the collection into `.agents/skills/`. To install just one, replace `'*'` with its name. Afterwards, check that your agent discovers that folder. GitHub steps also need authenticated `gh` and the appropriate permissions.

**Be careful with copy and paste:** `npx` may download and execute an external installer, and these commands do not pin a revision. Review the installer and instructions before running them. `--copy` is not a safety certificate. The repository documentation also notes that an isolated installation of the collection has not yet been tested.

The alternative is to manually copy a complete folder from a reviewed revision, including its resources. That copy does not receive automatic updates: you need to review the differences when updating it. Sometimes that small inconvenience is exactly what you want.

## What I am really aiming for

I do not have a defensible “hours saved” figure or proof that every agent will always follow the procedure. The collection includes validation criteria and scenarios, but not an automated suite certifying its behaviour.

My goal is simpler: **spend less time asking for the obvious and more time reviewing what matters**.

Make the goal clear before coding. Show the checks afterwards. Keep an agreement from disappearing with the chat. And make sure “finished” does not mean “I touched thirty files and we will see what happens”.

In the [article about my local AI stack](/en/blog/less-waiting-more-agents-local-ai-stack/), I talked about reducing the wait to put agents to work. This is the other half: giving them a way of working that is useful to me.

The model provides capability. Tools let it act. Skills provide a procedure. And I still need to pay attention to what we are building.
