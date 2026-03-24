---
description: "Organizer command for hackathon setup — routes through prep phases (init, research, team, storm, scaffold, data, demo)"
argument-hint: "[phase] [args] — e.g., research <tool>, team, storm, scaffold, data, demo"
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Agent, Skill, AskUserQuestion, WebFetch, WebSearch, TaskCreate, TaskUpdate, TaskList
---

> **Note:** This is the organizer's setup command. Contributors use `/hack` (generated in the project repo) to pick up work items.

# /hackprep — Hackathon Prep Router

You are the hackathon prep engine. Parse the arguments, determine the correct phase, and route to the appropriate skill. Always announce what you are doing before invoking a skill.

## Step 1: Parse Arguments

The user invoked `/hackprep $ARGUMENTS`.

Set `ARGS` = `$ARGUMENTS` (trimmed).

If `ARGS` is non-empty, go to **Step 2: Direct Routing**.
If `ARGS` is empty, go to **Step 3: Auto-Detect**.

---

## Step 2: Direct Routing

Match the first word of `ARGS` against the table below and invoke the corresponding skill using the `Skill` tool. Announce which phase you are routing to before invoking.

| First word   | Skill to invoke                  | Pass to skill                        |
|-------------|----------------------------------|--------------------------------------|
| `research`  | `hackathoner:research-tool`      | Everything after "research" (the tool name) |
| `team`      | `hackathoner:team-inventory`     | Remaining args (if any)              |
| `storm`     | `hackathoner:hackathon-storming` | Remaining args (if any)              |
| `scaffold`  | `hackathoner:scaffold`           | Remaining args (if any)              |
| `checkpoint`| `hackathoner:checkpoint`         | Remaining args (if any)              |
| `data`      | `hackathoner:sample-data`        | Remaining args (if any)              |
| `demo`      | `hackathoner:demo-prep`          | Remaining args (if any)              |

If the first word does not match any known phase, tell the user:

> Unknown phase: `<word>`. Available phases: research, team, storm, scaffold, checkpoint, data, demo.
> Run `/hackprep` with no arguments to auto-detect the next action.

Then stop.

---

## Step 3: Auto-Detect (no arguments)

When no arguments are provided, determine the current hackathon state and route to the next action automatically.

### 3a. Check for tracking issue

Run `gh issue view 1 --json body,title,state,comments` to check if tracking issue #1 exists.

**If the command fails (no issue #1 exists):** This is a fresh hackathon.

1. Announce: "No tracking issue found — starting a fresh hackathon."
2. Ask the user for the hackathon rules. Accept any of:
   - A URL to the rules page
   - A file path to a local rules document
   - Pasted text
3. Once rules are provided, invoke skill `hackathoner:init` with the rules content/location.
4. Stop.

**If issue #1 exists:** Continue to 3b.

### 3b. Parse phase checklist

Extract the phase checklist from the issue body. It looks like:

```
## Phase Checklist
- [x] Rules parsed
- [x] Init complete
- [ ] Research: ToolA
- [ ] Research: ToolB
- [x] Team inventory
- [ ] Hackathon-storming
- [ ] Scaffold
```

A checked item `- [x]` is complete. An unchecked item `- [ ]` is incomplete.

### 3c. Route based on state

Scan the checklist top-to-bottom. Find the **first incomplete item**.

**If there is an incomplete prep phase**, route to it:

| Checklist item pattern         | Action                                                        |
|-------------------------------|---------------------------------------------------------------|
| `Rules parsed`                | Ask for rules, invoke `hackathoner:init`                      |
| `Init complete`               | Invoke skill `hackathoner:init`                               |
| `Research: <tool>`            | **See parallel research below**                               |
| `Team inventory`              | Invoke skill `hackathoner:team-inventory`                     |
| `Hackathon-storming`          | Invoke skill `hackathoner:hackathon-storming`                 |
| `Scaffold`                    | Invoke skill `hackathoner:scaffold`                           |

Never skip phases. If an earlier phase is incomplete, do that one first even if a later phase seems more urgent.

### 3d. Parallel Tool Research

When the first incomplete item is a `Research: <tool>` entry, collect ALL incomplete research items from the checklist. Then:

1. **If 1 tool:** Research it directly by invoking `hackathoner:research-tool` with the tool name.

2. **If 2-5 tools:** Dispatch them in parallel using the Agent tool. Launch one `general-purpose` subagent per tool, all in a single message. Each agent should:
   - Research the tool using WebSearch and WebFetch (the 6 research dimensions: API surface, onboarding, IaC, Claude ecosystem, CLI tools, integration shortcuts)
   - Generate the project-level skill at `.claude/skills/<tool-name>/SKILL.md`
   - Generate the human README at `docs/tools/<tool-name>/README.md`
   - Generate Terraform fragments at `docs/tools/<tool-name>/main.tf` (if applicable)
   - Update CONTRIBUTING.md with config validation for the tool
   - Commit its changes to a branch named `research/<tool-name>`

   After all agents complete, merge each branch into main, update the tracking issue to check off all researched tools, and add a summary comment.

3. **If 6+ tools:** Batch into groups of 4-5 and run each batch in parallel. Wait for one batch to finish before starting the next. This avoids overwhelming the system.

**Example with 3 tools (Google ADK, Oracle, Twilio):**

```
Researching 3 sponsor tools in parallel: Google ADK, Oracle, Twilio

[Dispatch 3 agents simultaneously]

Agent 1: Research Google ADK → .claude/skills/google-adk/SKILL.md
Agent 2: Research Oracle → .claude/skills/oracle/SKILL.md
Agent 3: Research Twilio → .claude/skills/twilio/SKILL.md

[All complete]

✅ Research complete for all 3 tools. Proceeding to next phase.
```

**If all prep phases are complete:**

Announce: "All prep phases complete. Contributors can now use `/hack` to start building."

Then stop.

---

## Step 4: Auto-Advance Loop

After each skill completes successfully, DO NOT stop and wait for the user to type `/hackprep` again. Instead:

1. Briefly announce what just completed (one line)
2. Re-read the tracking issue to get the updated checklist: `gh issue view 1 --json body -q '.body'`
3. Find the next incomplete phase
4. Announce the next phase and invoke it immediately

Keep looping through phases until either:
- All prep phases are complete → announce and stop
- A phase requires user input that hasn't been provided → pause and ask
- A phase fails → report the error and stop

The goal is that the organizer types `/hackprep` once and the entire prep pipeline runs to completion with minimal manual intervention. The only natural pauses are phases that genuinely need user decisions (e.g., hackathon-storming calibration questions, team inventory interviews).

---

## Important Rules

These rules are non-negotiable. Follow them at all times.

1. **Never skip phases.** The checklist is sequential. Complete earlier phases before later ones.
2. **Always announce.** Before invoking any skill, tell the user which phase/skill you are about to run and why.
3. **Prep only.** This command handles prep phases (init through scaffold). Contributors use `/hack` for work items.
4. **Auto-advance.** After each phase completes, immediately proceed to the next one. Do not ask "shall I continue?" or tell the user to run `/hackprep` again. Just keep going.
