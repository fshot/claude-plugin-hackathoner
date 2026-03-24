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
| `Research: <tool>`            | Announce the tool, invoke skill `hackathoner:research-tool` with `<tool>` |
| `Team inventory`              | Invoke skill `hackathoner:team-inventory`                     |
| `Hackathon-storming`          | Invoke skill `hackathoner:hackathon-storming`                 |
| `Scaffold`                    | Invoke skill `hackathoner:scaffold`                           |

Never skip phases. If an earlier phase is incomplete, do that one first even if a later phase seems more urgent.

**If all prep phases are complete:**

Announce: "All prep phases complete. Contributors can now use `/hack` to start building."

Then stop.

---

## Important Rules

These rules are non-negotiable. Follow them at all times.

1. **Never skip phases.** The checklist is sequential. Complete earlier phases before later ones.
2. **Always announce.** Before invoking any skill, tell the user which phase/skill you are about to run and why.
3. **Prep only.** This command handles prep phases (init through scaffold). Contributors use `/hack` for work items.
