---
description: Single entry point for hackathon execution — routes to the right phase automatically
argument-hint: "[phase] [args] — e.g., research <tool>, team, storm, scaffold, checkpoint, data, demo"
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Agent, Skill, AskUserQuestion, WebFetch, WebSearch, TaskCreate, TaskUpdate, TaskList
---

# /hack — Hackathon Execution Router

You are the hackathon execution engine. Parse the arguments, determine the correct phase, and route to the appropriate skill. Always announce what you are doing before invoking a skill.

## Step 1: Parse Arguments

The user invoked `/hack $ARGUMENTS`.

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
> Run `/hack` with no arguments to auto-detect the next action.

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

**If all prep phases are complete and work items exist:**

1. Detect the current user:
   - Run `git config user.email` to get the email
   - Run `gh api user --jq .login` to get the GitHub username
2. List open issues assigned to this user, sorted by priority:
   - Run `gh issue list --assignee <username> --state open --json number,title,labels`
3. Apply priority ordering: P0 before P1 before P2. P-lagniappe only if the latest checkpoint review says C4 is green.
4. Among same-priority issues, pick the one with the lowest issue number (oldest first).
5. Filter out blocked issues (any issue with a `blocked` label).
6. If no issues are assigned to the current user, look for unassigned issues and suggest assignment.

Once a target issue is selected:

7. Check if a plan exists for this issue:
   - Search `docs/plans/` for a file whose frontmatter references this issue number
   - Or check for a comment on the issue linking to a plan file
8. **If no plan exists:**
   - Announce: "Issue #N needs a plan before implementation."
   - Generate a plan file at `docs/plans/YYYY-MM-DD-HHMM-<description>.md` with frontmatter linking to the issue, assignee, and target checkpoint.
   - Commit the plan to main.
   - Tell the user the plan is ready for review. Stop and wait for approval.
9. **If a plan exists and is approved (merged to main):**
   - Announce: "Executing plan for issue #N: <title>"
   - Create a worktree for the issue branch
   - Execute the plan: implement, test, verify
   - Create a PR referencing the plan file
   - Announce completion and move to next issue

**If all issues are closed:**

1. Check the checkpoint timeline in the tracking issue.
2. If the current checkpoint suggests demo prep: invoke skill `hackathoner:demo-prep`.
3. If there is still time and C4 is green: suggest P-lagniappe items or polish work.
4. Otherwise: announce "All work items complete!" and suggest running `/hack checkpoint` to review status.

---

## Important Rules

These rules are non-negotiable. Follow them at all times.

1. **Never skip phases.** The checklist is sequential. Complete earlier phases before later ones.
2. **Plans before code.** Every work item needs a plan committed to `docs/plans/` before implementation begins. No exceptions.
3. **Timestamp plans.** Plan files are named `docs/plans/YYYY-MM-DD-HHMM-<description>.md` using the current time.
4. **Priority discipline.** P0 before P1 before P2. P-lagniappe only if the latest checkpoint says C4 is green.
5. **Always announce.** Before invoking any skill, tell the user which phase/skill you are about to run and why.
6. **One owner per issue.** Issues are assigned to exactly one person. Respect assignments.
7. **Checkpoint enforcement.** If a checkpoint is overdue, route to `hackathoner:checkpoint` before continuing build work.
