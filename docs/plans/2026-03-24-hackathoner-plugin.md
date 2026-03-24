# Hackathoner Plugin Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the `hackathoner` Claude Code plugin — a structured hackathon execution system with a single `/hack` command entry point, 8 skills, 1 agent, and a SessionStart hook.

**Architecture:** A Claude Code plugin using markdown-based skills (instructions Claude follows), a routing command (`/hack`), a research agent for deep-diving sponsor tools, and a SessionStart hook that loads hackathon state from GitHub Issues. All state lives in GitHub Issues (no local state files). Skills generate project-level artifacts (CLAUDE.md, CONTRIBUTING.md, project skills, Terraform fragments) in the target hackathon repo.

**Tech Stack:** Claude Code plugin system (markdown skills, YAML frontmatter, hooks.json, bash scripts). Target hackathon projects use Node.js/pnpm/TypeScript/Next.js/Terraform/Vitest/Playwright.

---

## Task 1: Plugin Infrastructure & Directory Scaffold

**Files:**
- Modify: `.claude-plugin/plugin.json`
- Create: `.claude-plugin/marketplace.json`
- Create: `commands/` (directory)
- Create: `skills/` (directory, with subdirectories for each skill)
- Create: `agents/` (directory)
- Create: `hooks/` (directory)
- Create: `scripts/` (directory)

**Step 1: Create all directories**

```bash
mkdir -p commands skills/{init,research-tool,team-inventory,hackathon-storming,scaffold,checkpoint,sample-data,demo-prep} agents hooks scripts
```

**Step 2: Update plugin.json with component paths**

Modify `.claude-plugin/plugin.json`:

```json
{
  "name": "hackathoner",
  "version": "0.1.0",
  "description": "Structured hackathon execution: research, scaffold, checkpoint, team routing, demo prep",
  "author": {
    "name": "Frank Shotwell",
    "url": "https://cruxcapacity.com"
  },
  "repository": "https://github.com/fshot/claude-plugin-hackathoner",
  "license": "MIT",
  "keywords": ["hackathon", "scaffolding", "team-routing", "checkpoints", "demo-prep"],
  "skills": "./skills/",
  "agents": "./agents/",
  "commands": "./commands/",
  "hooks": "./hooks/hooks.json"
}
```

**Step 3: Create marketplace.json for local dev testing**

Create `.claude-plugin/marketplace.json`:

```json
{
  "name": "hackathoner-dev",
  "description": "Development marketplace for hackathoner plugin",
  "owner": {
    "name": "Frank Shotwell"
  },
  "plugins": [
    {
      "name": "hackathoner",
      "description": "Structured hackathon execution: research, scaffold, checkpoint, team routing, demo prep",
      "version": "0.1.0",
      "source": "./",
      "author": {
        "name": "Frank Shotwell"
      }
    }
  ]
}
```

**Step 4: Verify plugin structure loads**

```bash
ls -R commands skills agents hooks scripts
```

Expected: All directories exist, no files yet except plugin.json and marketplace.json.

**Step 5: Commit**

```bash
git add .claude-plugin/plugin.json .claude-plugin/marketplace.json
git commit -m "feat: update plugin manifest with component paths and dev marketplace"
```

**Human verification:** Run `cat .claude-plugin/plugin.json` — should show skills/agents/commands/hooks paths.

---

## Task 2: SessionStart Hook & Session Init Script

**Files:**
- Create: `hooks/hooks.json`
- Create: `hooks/run-hook.cmd`
- Create: `scripts/session-init.sh`

**Step 1: Write the session-init script**

Create `scripts/session-init.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

# Hackathoner session-init: detect hackathon state and report status
# Called by SessionStart hook to provide context to Claude

CONTEXT=""

# Check if we're in a hackathon project (has tracking issue reference)
if [ -f ".claude/CLAUDE.md" ] && grep -q "hackathon" ".claude/CLAUDE.md" 2>/dev/null; then
  CONTEXT="Active hackathon project detected."

  # Check if gh CLI is available and authenticated
  if command -v gh &>/dev/null && gh auth status &>/dev/null 2>&1; then
    REPO=$(gh repo view --json nameWithOwner -q '.nameWithOwner' 2>/dev/null || echo "")
    if [ -n "$REPO" ]; then
      # Fetch tracking issue #1
      ISSUE_BODY=$(gh issue view 1 --json body,title,state -q '.title + "\nState: " + .state + "\n" + .body' 2>/dev/null || echo "")
      if [ -n "$ISSUE_BODY" ]; then
        CONTEXT="${CONTEXT}\n\nTracking Issue #1:\n${ISSUE_BODY}"
      else
        CONTEXT="${CONTEXT}\n\nNo tracking issue #1 found. Run /hack to initialize."
      fi
    fi
  else
    CONTEXT="${CONTEXT}\n\ngh CLI not available or not authenticated. Some features require gh."
  fi
else
  CONTEXT="No hackathon project detected in current directory. Run /hack in a hackathon project to get started."
fi

# Escape for JSON output
ESCAPED=$(printf '%s' "$CONTEXT" | python3 -c "import sys,json; print(json.dumps(sys.stdin.read()))")

cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": ${ESCAPED}
  }
}
EOF

exit 0
```

**Step 2: Make the script executable**

```bash
chmod +x scripts/session-init.sh
```

**Step 3: Write the cross-platform hook wrapper**

Create `hooks/run-hook.cmd`:

```cmd
: << 'CMDBLOCK'
@echo off
REM Polyglot wrapper: runs .sh scripts cross-platform
REM Usage: run-hook.cmd <script-name> [args...]
"C:\Program Files\Git\bin\bash.exe" -l "%~dp0..\scripts\%~1"
exit /b
CMDBLOCK

# Unix shell runs from here
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SCRIPT_NAME="$1"
shift
"${SCRIPT_DIR}/../scripts/${SCRIPT_NAME}" "$@"
```

**Step 4: Make the wrapper executable**

```bash
chmod +x hooks/run-hook.cmd
```

**Step 5: Write hooks.json**

Create `hooks/hooks.json`:

```json
{
  "description": "Hackathoner plugin hooks - loads hackathon state on session start",
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "\"${CLAUDE_PLUGIN_ROOT}/hooks/run-hook.cmd\" session-init.sh",
            "timeout": 15
          }
        ]
      }
    ]
  }
}
```

**Step 6: Test the hook script locally**

```bash
cd /tmp && bash /path/to/plugin/scripts/session-init.sh
```

Expected: JSON output with `hookSpecificOutput` containing "No hackathon project detected" message.

**Step 7: Commit**

```bash
git add hooks/ scripts/
git commit -m "feat: add SessionStart hook with session-init state loader"
```

**Human verification:** Run `bash scripts/session-init.sh` from a non-hackathon directory — should output JSON with "No hackathon project detected".

---

## Task 3: The /hack Command

**Files:**
- Create: `commands/hack.md`

**Step 1: Write the /hack command**

Create `commands/hack.md`:

```yaml
---
description: Single entry point for hackathon execution — routes to the right phase automatically
argument-hint: [phase] [args] — e.g., research <tool>, team, storm, scaffold, checkpoint, data, demo
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Agent, Skill, AskUserQuestion, WebFetch, WebSearch, TaskCreate, TaskUpdate, TaskList
---
```

Then the command body (markdown instructions for Claude):

````markdown
# /hack — Hackathon Execution Router

You are the hackathon execution engine. Route to the correct phase based on current state and arguments.

## Arguments

`$ARGUMENTS` may contain:
- (empty) — auto-detect next action
- `research <tool-name>` — research a specific sponsor tool
- `team` — run team inventory
- `storm` — run hackathon-storming
- `scaffold` — run scaffold phase
- `checkpoint` — view/run checkpoint review
- `data` — manage test data
- `demo` — demo preparation

## Routing Logic

### If arguments provided:
Route directly to the matching skill:
- `research <tool>` → invoke skill `hackathoner:research-tool` with the tool name
- `team` → invoke skill `hackathoner:team-inventory`
- `storm` → invoke skill `hackathoner:hackathon-storming`
- `scaffold` → invoke skill `hackathoner:scaffold`
- `checkpoint` → invoke skill `hackathoner:checkpoint`
- `data` → invoke skill `hackathoner:sample-data`
- `demo` → invoke skill `hackathoner:demo-prep`

### If no arguments (auto-detect):

1. **Check for tracking issue #1** using `gh issue view 1`
   - If no tracking issue exists → this is a fresh hackathon
   - Ask user for hackathon rules (URL, file path, or paste)
   - Parse the rules and invoke skill `hackathoner:init`

2. **If tracking issue exists, parse the phase checklist:**
   - Read issue body, find the phase checklist
   - Identify the first incomplete phase

3. **Route to the next incomplete phase:**
   - Init incomplete → invoke skill `hackathoner:init`
   - Tools not all researched → invoke skill `hackathoner:research-tool` for next unresearched tool
   - Team inventory not done → invoke skill `hackathoner:team-inventory`
   - Storming not done → invoke skill `hackathoner:hackathon-storming`
   - Scaffold not done → invoke skill `hackathoner:scaffold`
   - All prep done, no work items → invoke skill `hackathoner:hackathon-storming`

4. **If all prep phases complete and work items exist:**
   - Detect current user: `git config user.email` → match to GitHub username
   - Find highest-priority unblocked issue assigned to this user using `gh issue list`
   - Check if issue has an approved plan in `docs/plans/`
     - No plan → generate plan (invoke superpowers:writing-plans), commit to main, ask for approval
     - Plan exists but not approved → show plan, ask for approval
     - Plan approved → create worktree, execute plan (invoke superpowers:executing-plans)
   - After PR is created, loop: pick next issue

5. **If all issues are closed:**
   - Check checkpoint timeline
   - If demo prep time → invoke skill `hackathoner:demo-prep`
   - Otherwise → report status, suggest next action

## State Format in Tracking Issue #1

The issue body contains a checklist like:
```markdown
## Phase Checklist
- [x] Rules parsed
- [x] Init complete
- [ ] Research: ToolA
- [ ] Research: ToolB
- [x] Team inventory
- [ ] Hackathon-storming
- [ ] Scaffold
```

When a phase completes, update the issue body to check off that item using `gh issue edit`.

## Important Rules

- **Never skip phases.** Follow the checklist order.
- **Plans before code.** Every work item needs a plan committed to `docs/plans/` before implementation.
- **Timestamp plans** with minute precision: `docs/plans/YYYY-MM-DD-HHMM-<description>.md`
- **P0 before P1 before P2.** P-lagniappe only if C4 checkpoint is green.
- **Announce what you're doing.** Always tell the user which phase/skill you're invoking and why.
````

**Step 2: Verify the command file has valid frontmatter**

```bash
head -5 commands/hack.md
```

Expected: YAML frontmatter with `---` delimiters.

**Step 3: Commit**

```bash
git add commands/hack.md
git commit -m "feat: add /hack command with phase routing logic"
```

**Human verification:** Read `commands/hack.md` — should have valid YAML frontmatter and comprehensive routing instructions.

---

## Task 4: Init Skill

**Files:**
- Create: `skills/init/SKILL.md`

**Step 1: Write the init skill**

Create `skills/init/SKILL.md`:

````markdown
---
name: init
description: Use when initializing a new hackathon project — creates repo, tracking issue, CONTRIBUTING.md, CLAUDE.md, and project structure. Triggered by /hack when no tracking issue exists.
---

# Hackathon Init

Initialize a hackathon project with all scaffolding needed for structured execution.

**Announce:** "Using hackathoner:init to set up the hackathon project."

## Prerequisites

Before starting, you need from the user:
- Hackathon rules (already parsed, or URL/file/paste to parse now)
- Whether to create a new repo or use an existing one
- Team size estimate (for GitHub Project columns)

## Phase 1: Parse Hackathon Rules

If rules haven't been parsed yet:

1. Accept rules via URL (`WebFetch`), file path (`Read`), or pasted text
2. Extract and structure:
   - **Event basics:** Name, dates, location, organizer
   - **Challenge tracks:** Available tracks with descriptions
   - **Required tech:** Sponsor tools that must be used
   - **Scoring rubric:** Judging criteria with weights
   - **Timeline:** Key deadlines (hacking start, submissions, demos)
   - **Demo format:** Length, format (live/recorded), what to show
   - **Resources provided:** APIs, credits, starter kits
   - **Submission requirements:** What to submit, where, format
3. Flag anything unspecified that the team should ask organizers about
4. Present the parsed rules to the user for confirmation

## Phase 2: Repository Setup

1. **Create or confirm repo:**
   ```bash
   # New repo:
   gh repo create <name> --public --clone
   cd <name>
   # Or confirm existing repo:
   gh repo view --json nameWithOwner
   ```

2. **Create GitHub Project board:**
   ```bash
   gh project create --title "<Hackathon Name> Board" --owner @me
   ```
   Columns: Backlog, Ready, In Progress, Review, Done

3. **Create tracking issue #1:**
   Use `gh issue create` with this template body:

   ```markdown
   # <Hackathon Name> — Tracking Issue

   ## Event Details
   - **Event:** <name>
   - **Dates:** <dates>
   - **Hacking starts:** <datetime>
   - **Submission deadline:** <datetime>
   - **Demo format:** <format>

   ## Phase Checklist
   - [x] Rules parsed
   - [x] Init complete
   - [ ] Research: <tool1>
   - [ ] Research: <tool2>
   - [ ] Team inventory
   - [ ] Hackathon-storming
   - [ ] Scaffold

   ## Scoring Rubric
   | Criterion | Weight | Notes |
   |-----------|--------|-------|
   | <criterion> | <weight> | <notes> |

   ## Sponsor Tools
   | Tool | Status | Skill Generated | Notes |
   |------|--------|----------------|-------|
   | <tool> | Not started | No | |

   ## Team Roster
   | GitHub | Name | Strengths | Available Hours | Comms |
   |--------|------|-----------|----------------|-------|
   | (run /hack team to populate) | | | | |

   ## Checkpoint Timeline
   | Checkpoint | Target Time | Status |
   |-----------|------------|--------|
   | C0 | <hacking_start> | ⬜ |
   | C1 | +3h | ⬜ |
   | C2 | +7h | ⬜ |
   | C3 | +11h | ⬜ |
   | C4 | +19h | ⬜ |
   | C5 | +23h | ⬜ |
   | C6 | +24.5h | ⬜ |
   | C7 | +25.5h | ⬜ |

   ## Test Data Coverage
   | Dataset | Clips | Ground Truth | Coverage |
   |---------|-------|-------------|----------|
   | (run /hack data to populate) | | | |
   ```

4. **Enable GitHub Discussions** (ask user if they want this):
   ```bash
   gh repo edit --enable-discussions
   ```

## Phase 3: Credential Setup

Walk the user through creating scoped credentials. Do NOT store credentials — just guide and verify.

1. **GitHub PAT** (if not using `gh auth`):
   - Guide: Settings → Developer Settings → Personal Access Tokens → Fine-grained
   - Scope: repo, issues, projects — 7-day expiry
   - Verify: `gh auth status`

2. **AWS credentials** (if AWS tools are in the stack):
   - Guide: IAM → Create user → Attach scoped policy
   - Verify: `aws sts get-caller-identity`

3. **Other sponsor tool credentials** as needed
   - List what's needed based on parsed rules
   - Guide through each one
   - Add verification commands

4. Create `.env.example` with all required env vars (no values):
   ```bash
   # GitHub
   GITHUB_TOKEN=
   # AWS (if applicable)
   AWS_ACCESS_KEY_ID=
   AWS_SECRET_ACCESS_KEY=
   AWS_REGION=
   # Sponsor tools
   <TOOL>_API_KEY=
   ```

## Phase 4: Project Files

1. **Generate `.claude/CLAUDE.md`:**
   Include: project name, tech stack, hackathon rules summary, coding conventions, link to tracking issue, reference to project skills directory.

2. **Generate `CONTRIBUTING.md`:**
   Include: prerequisites, environment setup, workflow (plan → worktree → build → PR), credential setup steps, config validation checklist.

3. **Generate `.gitignore`:**
   Node.js defaults + `.env`, `.env.local`, `node_modules/`, `.next/`, `*.local`, `.DS_Store`, `.terraform/`, `*.tfstate*`

4. **Create directory structure:**
   ```bash
   mkdir -p .claude/skills docs/plans docs/tools infra test/e2e test/fixtures/expected-violations src
   ```

5. **Generate `docs/plans/.gitkeep`** (empty placeholder)

6. **Generate hackathon-rules project skill:**
   Create `.claude/skills/hackathon-rules/SKILL.md` with parsed rules, rubric, timeline.

7. **Generate hackathon-sdlc project skill:**
   Create `.claude/skills/hackathon-sdlc/SKILL.md` with the spec-driven dev process.

## Phase 5: Initial Commit

```bash
git add -A
git commit -m "feat: initialize hackathon project — <hackathon-name>"
git push -u origin main
```

## Phase 6: Update Tracking Issue

Edit issue #1 to check off "Init complete":
```bash
# Update the issue body — replace "- [ ] Init complete" with "- [x] Init complete"
```

Add a comment:
```bash
gh issue comment 1 --body "✅ Init complete. Repo scaffolded, tracking issue created, credentials verified."
```

## Completion

Tell the user:
- What was created (list key files)
- What credentials still need setup (if any)
- Next step: "Run `/hack` to continue — next phase is tool research."
````

**Step 2: Verify frontmatter**

```bash
head -4 skills/init/SKILL.md
```

Expected: Valid YAML with name and description.

**Step 3: Commit**

```bash
git add skills/init/
git commit -m "feat: add init skill — repo setup, tracking issue, credentials, project files"
```

**Human verification:** Read `skills/init/SKILL.md` — should have phases for rules parsing, repo setup, credentials, project files, and tracking issue updates.

---

## Task 5: Tool Researcher Agent & Research-Tool Skill

**Files:**
- Create: `agents/tool-researcher.md`
- Create: `skills/research-tool/SKILL.md`

**Step 1: Write the tool-researcher agent**

Create `agents/tool-researcher.md`:

```yaml
---
name: tool-researcher
description: |
  Use this agent when deep-diving into a sponsor tool's API, SDKs, IaC, and Claude ecosystem integrations. Produces a structured research report.

  <example>
  Context: User needs to research a hackathon sponsor tool
  user: "/hack research pinecone"
  assistant: "I'll spawn the tool-researcher agent to deep-dive into Pinecone's API, SDKs, and integrations."
  <commentary>The research-tool skill dispatches this agent for each sponsor tool.</commentary>
  </example>

  <example>
  Context: Researching AWS Bedrock for the hackathon
  user: "We need to use AWS Bedrock — research it"
  assistant: "I'll use the tool-researcher agent to investigate Bedrock's API surface, IaC, and Claude ecosystem."
  <commentary>Any sponsor tool research triggers this agent.</commentary>
  </example>
model: sonnet
tools: ["Read", "Write", "Bash", "Glob", "Grep", "WebFetch", "WebSearch"]
---

You are a Tool Researcher for a hackathon team. Your job is to deeply investigate a sponsor tool and produce a comprehensive, actionable research report.

## Research Dimensions

For the given tool, investigate all six dimensions:

### 1. API Surface
- Endpoints, SDKs (official + community), authentication methods
- Rate limits, quotas, free tier limits
- Known gotchas, breaking changes, deprecations
- API versioning and stability

### 2. Onboarding
- Signup flow (self-serve vs approval gate)
- Time from signup to first API call
- Required approvals or waitlists
- Sandbox/test environments available

### 3. Infrastructure as Code
- Official Terraform provider (if any)
- Key resources and data sources
- Example configurations
- CloudFormation/Pulumi alternatives if no Terraform

### 4. Claude Ecosystem
- Official or community MCP servers
- Claude Code skills/plugins available
- Anthropic cookbook examples
- Claude-specific tutorials or integrations

### 5. CLI Tools
- Official CLI (install, auth, key commands)
- OpenAPI spec availability (for CLI generation)
- Useful CLI workflows for development

### 6. Integration Shortcuts
- Pre-built connectors (Zapier, n8n, etc.)
- Example apps or starter templates to fork
- Community projects worth examining

## Output Format

Produce your research as a structured markdown document with:
1. **TL;DR** — 3-sentence summary: what it does, how to auth, biggest gotcha
2. **Each dimension** as a section with findings
3. **Hackathon Quick Start** — fastest path from zero to working integration
4. **Red Flags** — anything that could block or delay the team
5. **Recommended Approach** — suggested integration strategy for a 26-hour hackathon
```

**Step 2: Write the research-tool skill**

Create `skills/research-tool/SKILL.md`:

````markdown
---
name: research-tool
description: Use when researching a hackathon sponsor tool — spawns tool-researcher agent, generates project skill, README, and Terraform fragments. Triggered by /hack research <tool>.
---

# Research Tool

Deep-dive into a sponsor tool and produce all integration artifacts.

**Announce:** "Using hackathoner:research-tool to research <tool-name>."

## Input

The tool name to research. This comes from `/hack research <tool-name>` or from the tracking issue's sponsor tools table.

## Process

### Step 1: Spawn the tool-researcher agent

Use the Agent tool to dispatch the `tool-researcher` agent with this prompt:

```
Research the tool "<tool-name>" for our hackathon project. Investigate all six dimensions (API surface, onboarding, IaC, Claude ecosystem, CLI tools, integration shortcuts). Our hackathon constraints: 26-hour build window, team of <N> people, tech stack is Node.js/TypeScript/Next.js/Terraform.
```

### Step 2: Generate project-level skill

From the research, create `.claude/skills/<tool-name>/SKILL.md`:

```yaml
---
name: <tool-name>
description: Use when working with <tool-name> integration — covers API patterns, auth, gotchas, and recommended approaches for this hackathon.
---
```

Include in the skill body:
- Authentication setup (exact steps)
- Key API patterns with TypeScript code examples
- Rate limit awareness
- Error handling patterns
- Common gotchas specific to hackathon timeline

### Step 3: Generate human-audience README

Create `docs/tools/<tool-name>/README.md`:
- What it is and why we're using it
- Setup instructions (account, credentials, local dev)
- Quick start examples
- Links to official docs

### Step 4: Generate Terraform fragments (if applicable)

Create `docs/tools/<tool-name>/main.tf` and `variables.tf`:
- Resource definitions for the tool's infrastructure
- Variable declarations with descriptions and defaults
- Output values needed by the application

### Step 5: Update CONTRIBUTING.md

Add a config validation check for the new tool:
```markdown
### <Tool Name>
- [ ] Account created at <url>
- [ ] API key in `.env` as `<TOOL>_API_KEY`
- [ ] Verify: `curl -H "Authorization: Bearer $<TOOL>_API_KEY" <test-endpoint>`
```

### Step 6: Update tracking issue

```bash
# Mark tool as researched in the sponsor tools table
gh issue edit 1 --body "$(updated body with tool status = Researched, skill = Yes)"

# Add comment
gh issue comment 1 --body "✅ Research complete: <tool-name>. Skill generated at .claude/skills/<tool-name>/SKILL.md"
```

### Step 7: Commit

```bash
git add .claude/skills/<tool-name>/ docs/tools/<tool-name>/ CONTRIBUTING.md
git commit -m "feat: research <tool-name> — skill, docs, and terraform fragments"
git push
```

## Completion

Tell the user:
- Summary of findings (TL;DR from research)
- Red flags or blockers found
- Files generated
- Next step: "Run `/hack` to continue — next phase depends on remaining tools to research."
````

**Step 3: Commit**

```bash
git add agents/tool-researcher.md skills/research-tool/
git commit -m "feat: add tool-researcher agent and research-tool skill"
```

**Human verification:** Check that `agents/tool-researcher.md` has valid frontmatter with model, tools, description with examples. Check that `skills/research-tool/SKILL.md` references the agent and produces all expected artifacts.

---

## Task 6: Team Inventory Skill

**Files:**
- Create: `skills/team-inventory/SKILL.md`

**Step 1: Write the team-inventory skill**

Create `skills/team-inventory/SKILL.md`:

````markdown
---
name: team-inventory
description: Use when collecting team member profiles and generating routing rules — gathers strengths, availability, and preferences for task assignment. Triggered by /hack team.
---

# Team Inventory

Collect team member information and generate the team-routing project skill.

**Announce:** "Using hackathoner:team-inventory to build the team roster and routing rules."

## Process

### Step 1: Collect team members

For each team member, ask the user (use AskUserQuestion) to provide:

| Field | Description | Example |
|-------|-------------|---------|
| GitHub username | Their GitHub handle | `@alice` |
| Display name | How they want to be called | `Alice` |
| Strengths | Technical strengths (ranked) | `React, TypeScript, CSS` |
| Gaps | Areas they're less confident in | `Infrastructure, databases` |
| Known tools | Sponsor tools they have experience with | `AWS, Pinecone` |
| Available hours | Hours they can commit | `Full 26h` or `15h (leaving at midnight)` |
| Comms handle | How to reach them | `Slack: @alice` |
| Environment | Their dev setup | `MacBook, VS Code, Node 20` |

Collect one member at a time. After each, ask "Add another team member? (y/n)"

### Step 2: Update tracking issue roster

Edit issue #1 to fill in the Team Roster table:

```bash
# Update the issue body with team roster data
gh issue edit 1 --body "$(updated body)"
```

### Step 3: Generate team-routing project skill

Create `.claude/skills/team-routing/SKILL.md`:

```yaml
---
name: team-routing
description: Use when assigning work items to team members — contains roster, strengths, and routing heuristics for this hackathon team.
---
```

Include in the skill body:

```markdown
# Team Routing

## Roster
| Member | GitHub | Strengths | Gaps | Available | Tools |
|--------|--------|-----------|------|-----------|-------|
| <name> | <gh> | <strengths> | <gaps> | <hours> | <tools> |

## Assignment Heuristics

1. **Match by strength:** Assign issues to the person whose top strengths match the issue's requirements.
2. **Spread tool ownership:** Each sponsor tool integration should have one primary owner who did or reviewed the research.
3. **Respect availability:** Don't assign work beyond available hours. Front-load work for people leaving early.
4. **Pair on gaps:** If an issue requires skills in someone's gap area, pair them with someone strong in that area.
5. **Single owner:** Every issue has exactly one assignee. No shared ownership.

## Current User Detection

To detect who is running `/hack`:
```bash
GIT_EMAIL=$(git config user.email)
# Match email to GitHub username from roster
```
```

### Step 4: Update CONTRIBUTING.md

Add a team section with member list and comms info.

### Step 5: Mark phase complete

```bash
# Update tracking issue checklist
gh issue edit 1 --body "$(updated body with team inventory checked)"
gh issue comment 1 --body "✅ Team inventory complete. <N> members registered. Routing skill generated."
```

### Step 6: Commit

```bash
git add .claude/skills/team-routing/ CONTRIBUTING.md
git commit -m "feat: team inventory — roster and routing rules for <N> members"
git push
```

## Completion

Tell the user:
- Team roster summary
- Routing strategy highlights
- Next step: "Run `/hack` to continue to hackathon-storming."
````

**Step 2: Commit**

```bash
git add skills/team-inventory/
git commit -m "feat: add team-inventory skill — roster collection and routing rules"
```

**Human verification:** Read the skill — should collect per-member data, generate a routing skill, and update the tracking issue.

---

## Task 7: Hackathon-Storming Skill

**Files:**
- Create: `skills/hackathon-storming/SKILL.md`

**Step 1: Write the hackathon-storming skill**

Create `skills/hackathon-storming/SKILL.md`:

````markdown
---
name: hackathon-storming
description: Use when brainstorming and planning hackathon work items — calibrates judging criteria, runs constrained brainstorming, generates prioritized GitHub Issues. Triggered by /hack storm.
---

# Hackathon-Storming

Structured brainstorming session that produces prioritized, assigned work items.

**Announce:** "Using hackathoner:hackathon-storming to plan the work."

## Prerequisites

These must be complete before storming:
- Hackathon rules parsed (hackathon-rules skill exists)
- At least one sponsor tool researched
- Team inventory done (team-routing skill exists)

Check tracking issue #1 to verify. If prerequisites are missing, tell the user and stop.

## Process

### Phase 1: Calibrate Judging Criteria

Read the hackathon-rules project skill. Present the scoring rubric to the user:

```
Based on the rules, here's how projects will be judged:
1. <criterion> — <weight>% — <description>
2. ...

Questions:
- Which criterion should we optimize hardest for?
- Any insider knowledge about what judges care about?
- What's the minimum bar for each criterion?
```

Get user confirmation on priorities.

### Phase 2: Calibrate Build Priorities

Present trade-off questions:

```
Let's calibrate our build priorities:

1. Creativity vs Polish: Should we aim for a creative moonshot or a polished known-good approach?
2. Breadth vs Depth: More features at surface level, or fewer features deeply built?
3. Demo-ability: What makes the best demo? (Live interaction? Data visualization? Before/after?)
4. NFRs: Which non-functional requirements matter? (Performance? Accessibility? Mobile?)
5. Risk tolerance: Are we comfortable with a risky P0 that might not work, or play it safe?
```

### Phase 3: Brainstorm with Constraints

Now invoke the brainstorming skill (superpowers:brainstorming) with all constraints pre-loaded:

- Scoring rubric and weights
- Team size and strengths
- Available tools and their capabilities (from research skills)
- Timeline (26 hours minus setup time already spent)
- Demo format requirements
- User's calibration answers from phases 1-2

The brainstorming should produce:
- Project concept and architecture
- Feature list with priority assignments
- Technical approach for each feature
- Integration plan for sponsor tools
- Demo strategy

### Phase 4: Generate Work Items

Convert brainstorming output into GitHub Issues:

For each work item:
```bash
gh issue create \
  --title "<type>: <description>" \
  --body "$(cat <<'EOF'
## Description
<what to build>

## Acceptance Criteria
- [ ] <criterion 1>
- [ ] <criterion 2>

## Technical Notes
<approach, relevant skills, dependencies>

## Priority: <P0|P1|P2|P-lagniappe>
## Checkpoint: <C1-C5>
## Estimated effort: <hours>
EOF
)" \
  --assignee "<github-username>" \
  --label "<priority>,<type>,<component>"
```

**Priority rules:**
- **P0:** Demo breaks without this. Must be done before C4.
- **P1:** Bonus points or significant wow factor. Do if P0s on track.
- **P2:** Nice-to-have polish. Only if time after P1s.
- **P-lagniappe:** Above and beyond. Only if C4 green, 2-3hrs max, zero guilt if cut.

**Ordering:**
- Feature Zero (test data manager) is always the first P0 issue
- P0s ordered by dependency chain
- P1s ordered by judge-impact
- P2s ordered by effort (quick wins first)

### Phase 4.5: Lagniappe Discussion

Present P-lagniappe ideas to the user:

```
These are stretch goals — only if we're ahead of schedule at C4:
1. <idea> — <why it would wow judges>
2. <idea> — <why it would wow judges>

Rules: 2-3 hour max investment, zero guilt if cut. Discuss now, decide at C4.
```

### Phase 5: Commit Architecture Plan

Write `docs/plans/YYYY-MM-DD-HHMM-architecture.md`:

```markdown
---
issue: #1
phase: hackathon-storming
---

# Architecture Plan

## Concept
<1-paragraph project description>

## Architecture
<system diagram or description>

## Feature Map
| Feature | Priority | Assignee | Checkpoint | Issue |
|---------|----------|----------|------------|-------|
| <feature> | <P0> | <@user> | <C1> | #<N> |

## Integration Plan
<how sponsor tools connect>

## Demo Strategy
<what the demo shows, in what order>
```

```bash
git add docs/plans/
git commit -m "feat: architecture plan from hackathon-storming"
git push
```

### Phase 6: Update Tracking Issue

```bash
gh issue edit 1 --body "$(updated body with storming checked)"
gh issue comment 1 --body "✅ Hackathon-storming complete. Created <N> issues: <P0-count> P0, <P1-count> P1, <P2-count> P2, <lagniappe-count> lagniappe."
```

## Completion

Tell the user:
- Project concept summary
- Issue breakdown by priority
- Who's assigned to what
- Next step: "Run `/hack` to continue to scaffold, or `/hack scaffold` directly."
````

**Step 2: Commit**

```bash
git add skills/hackathon-storming/
git commit -m "feat: add hackathon-storming skill — constrained brainstorming and work item generation"
```

**Human verification:** Read the skill — should have 5 phases (calibrate judging, calibrate priorities, brainstorm, generate issues, commit plan).

---

## Task 8: Scaffold Skill

**Files:**
- Create: `skills/scaffold/SKILL.md`

**Step 1: Write the scaffold skill**

Create `skills/scaffold/SKILL.md`:

````markdown
---
name: scaffold
description: Use when generating the hackathon project's code structure — stubs, mocks, dependency injection, Terraform, LocalStack, dev scripts, and Feature Zero. Triggered by /hack scaffold.
---

# Scaffold

Generate the project's technical foundation so the team can start building immediately.

**Announce:** "Using hackathoner:scaffold to generate the project skeleton."

## Prerequisites

- Init complete (repo exists, tracking issue exists)
- At least one tool researched (so we know what to scaffold for)
- Hackathon-storming complete (so we know the architecture)

Read the architecture plan from `docs/plans/` and the tool research skills.

## Process

### Step 1: Project Structure

Generate the Next.js project with pnpm:

```bash
pnpm create next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

Then add dependencies:
```bash
pnpm add <dependencies from architecture plan>
pnpm add -D vitest @vitejs/plugin-react @playwright/test
```

### Step 2: Stubs and Mocks

For each sponsor tool integration, create:

- `src/lib/<tool>/client.ts` — real client implementation (stub that throws "not yet implemented")
- `src/lib/<tool>/mock.ts` — mock implementation with realistic fake data
- `src/lib/<tool>/index.ts` — barrel export that switches based on `USE_MOCKS` env var

```typescript
// src/lib/<tool>/index.ts
import { MockToolClient } from './mock'
import { ToolClient } from './client'

export const toolClient = process.env.USE_MOCKS === 'true'
  ? new MockToolClient()
  : new ToolClient()
```

### Step 3: Dependency Injection Container

Create `src/lib/container.ts`:

```typescript
// Central DI container for all integrations
// USE_MOCKS=true in .env.local for local development

export const container = {
  <tool>: () => import('./<tool>').then(m => m.toolClient),
  // ... one per tool
}
```

### Step 4: Terraform Root Module

Compose from research fragments:

```bash
mkdir -p infra
```

Create `infra/main.tf`:
```hcl
terraform {
  required_providers {
    # From research fragments
  }
}

# Import and compose from docs/tools/*/main.tf
```

Create `infra/variables.tf`, `infra/outputs.tf`

### Step 5: LocalStack Docker Compose

Create `docker-compose.yml` (if AWS services are used):

```yaml
services:
  localstack:
    image: localstack/localstack
    ports:
      - "4566:4566"
    environment:
      - SERVICES=s3,sqs,lambda  # based on what's needed
      - DEFAULT_REGION=us-east-1
    volumes:
      - "./scripts/localstack-init:/etc/localstack/init/ready.d"
```

### Step 6: Dev Scripts

Create `scripts/` directory with:

- `scripts/env-from-terraform.sh` — pulls outputs from Terraform into .env format
- `scripts/env-local.sh` — sets up .env.local for local dev (USE_MOCKS=true, LocalStack endpoints)
- `scripts/dev.sh` — starts all services (LocalStack, Next.js dev server)
- `scripts/seed.sh` — seeds test data for development

Make all executable: `chmod +x scripts/*.sh`

### Step 7: Smoke Test

Create `test/smoke.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'

describe('Smoke Test', () => {
  it('should have USE_MOCKS configured', () => {
    // Verify DI container works in mock mode
    expect(process.env.USE_MOCKS).toBeDefined()
  })

  it('should import all tool clients without error', async () => {
    const { container } = await import('../src/lib/container')
    for (const [name, factory] of Object.entries(container)) {
      const client = await factory()
      expect(client).toBeDefined()
    }
  })
})
```

### Step 8: Feature Zero — Test Data Manager

The first real feature. Create the test data manager page:

- `src/app/data/page.tsx` — Upload, preview, and tag test data
- `src/app/api/data/route.ts` — API routes for data management
- `src/lib/data/manager.ts` — Core data management logic (uses mock S3 locally)

This is a P0 issue — it should already exist from hackathon-storming. Create the initial stub with:
- File upload component (drag and drop)
- Preview grid (thumbnails for video clips)
- Tag editor
- Mock S3 integration via container

### Step 9: Vitest Config

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
  },
})
```

Create `test/setup.ts`:
```typescript
process.env.USE_MOCKS = 'true'
```

### Step 10: Run Smoke Test

```bash
USE_MOCKS=true pnpm vitest run test/smoke.test.ts
```

Expected: PASS

### Step 11: Commit and Push

```bash
git add -A
git commit -m "feat: project scaffold — stubs, mocks, DI, dev scripts, Feature Zero stub"
git push
```

### Step 12: Update Tracking Issue

```bash
gh issue edit 1 --body "$(updated body with scaffold checked)"
gh issue comment 1 --body "✅ Scaffold complete. Project structure, mock integrations, dev scripts, and Feature Zero stub committed."
```

## Completion

Tell the user:
- What was scaffolded (list key directories and files)
- How to run locally: `pnpm dev` with `USE_MOCKS=true`
- Next step: "Run `/hack` to start building. Feature Zero is the first P0 issue."
````

**Step 2: Commit**

```bash
git add skills/scaffold/
git commit -m "feat: add scaffold skill — project structure, mocks, DI, dev scripts, Feature Zero"
```

**Human verification:** Read the skill — should cover Next.js setup, stubs/mocks, DI container, Terraform, LocalStack, dev scripts, smoke test, and Feature Zero.

---

## Task 9: Sample Data Skill

**Files:**
- Create: `skills/sample-data/SKILL.md`

**Step 1: Write the sample-data skill**

Create `skills/sample-data/SKILL.md`:

````markdown
---
name: sample-data
description: Use when managing hackathon test data — analyzes requirements, suggests sourcing strategy, tracks coverage, and validates ground truth. Triggered by /hack data.
---

# Sample Data Management

Curate and manage test data for the hackathon project.

**Announce:** "Using hackathoner:sample-data to manage test data."

## Process

### Step 1: Analyze Requirements

Read the hackathon-rules and architecture plan to determine:
- What types of test data are needed (video clips, documents, images, etc.)
- What properties matter (duration, format, content type)
- What ground truth annotations are needed for validation
- How many samples are needed for a convincing demo

### Step 2: Sourcing Strategy

Present a sourcing strategy to the user:

```
Based on the challenge requirements, here's what we need:

| Data Type | Count | Source Strategy | Purpose |
|-----------|-------|----------------|---------|
| <type> | <N> | <strategy> | <demo/test/both> |

Sourcing options:
1. Public datasets: <specific suggestions>
2. Generated/synthetic: <what we can generate>
3. Team-created: <what team members should record/create>
4. Provided by organizers: <what the hackathon provides>
```

### Step 3: Manifest Management

Create or update `test/fixtures/manifest.json`:

```json
{
  "version": 1,
  "datasets": [
    {
      "id": "<unique-id>",
      "name": "<descriptive-name>",
      "type": "<video|image|document|audio>",
      "source": "<s3-key or url>",
      "metadata": {
        "duration": "<if applicable>",
        "format": "<file format>",
        "tags": ["<tag1>", "<tag2>"]
      },
      "groundTruth": {
        "expectedViolations": ["<violation-type>"],
        "annotations": "<path to ground truth file>"
      },
      "purpose": "<demo|test|both>"
    }
  ]
}
```

### Step 4: Ground Truth Files

For each test sample that needs validation, create ground truth in `test/fixtures/expected-violations/`:

```json
{
  "datasetId": "<id>",
  "violations": [
    {
      "type": "<violation-type>",
      "timestamp": "<if applicable>",
      "confidence": "<expected confidence range>",
      "description": "<what should be detected>"
    }
  ]
}
```

### Step 5: Coverage Tracking

Update the tracking issue's Test Data Coverage table:

```bash
gh issue edit 1 --body "$(updated body with coverage matrix)"
gh issue comment 1 --body "📊 Test data update: <N> samples, <coverage>% of required scenarios covered."
```

### Step 6: Validation Script

Create `scripts/validate-data.sh`:

```bash
#!/usr/bin/env bash
# Validate test data against ground truth
# Computes precision, recall, F1 for each violation type
```

## Completion

Report:
- Current coverage status
- Gaps that need filling
- Next step for data collection
````

**Step 2: Commit**

```bash
git add skills/sample-data/
git commit -m "feat: add sample-data skill — test data curation and ground truth management"
```

**Human verification:** Read the skill — should cover requirements analysis, sourcing, manifest, ground truth, and coverage tracking.

---

## Task 10: Checkpoint Skill

**Files:**
- Create: `skills/checkpoint/SKILL.md`

**Step 1: Write the checkpoint skill**

Create `skills/checkpoint/SKILL.md`:

````markdown
---
name: checkpoint
description: Use when reviewing hackathon progress against the timeline — enforces checkpoints, triggers scope cuts, and tracks status. Triggered by /hack checkpoint.
---

# Checkpoint Review

Enforce timeline discipline and make scope decisions.

**Announce:** "Using hackathoner:checkpoint to review progress."

## Checkpoint Timeline

| Checkpoint | Offset | Target |
|-----------|--------|--------|
| C0 | Hacking starts | Scaffold committed, Feature Zero assigned |
| C1 | +3 hours | Feature Zero working, mock pipeline wired |
| C2 | +7 hours | One real integration live, demo-able with one clip |
| C3 | +11 hours | Core pipeline end-to-end, 3+ clips processed |
| C4 | +19 hours | All P0 closed, full test data processed |
| C5 | +23 hours | P1 done or cut, polish pass, tests green |
| C6 | +24.5 hours | Demo recording done, backup slides ready |
| C7 | +25.5 hours | Submission. Code frozen. |

## Process

### Step 1: Determine Current Checkpoint

Read the tracking issue to find:
- Hacking start time
- Current time
- Which checkpoint we should be at

```bash
# Get current checkpoint status
gh issue view 1 --json body -q '.body'
```

### Step 2: Status Assessment

For the current checkpoint, assess:

1. **Issues status:** `gh issue list --state open --label P0` — count open P0s
2. **PR status:** `gh pr list --state open` — count pending reviews
3. **Test status:** Are tests passing? (check latest CI or run locally)
4. **Demo readiness:** Can we demo what we have right now?

Present a dashboard:

```
## Checkpoint C<N> Review — <target description>

### Status: 🟢 On Track | 🟡 At Risk | 🔴 Behind

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Open P0s | <target> | <actual> | 🟢/🟡/🔴 |
| Open P1s | <target> | <actual> | 🟢/🟡/🔴 |
| Tests passing | Yes | <yes/no> | 🟢/🔴 |
| Can demo now | Yes | <yes/no> | 🟢/🔴 |
```

### Step 3: Scope Cut Protocol

If behind schedule (🔴):

1. **Identify blockers:** What's preventing progress?
2. **Propose cuts:** Which P1s/P2s should be cut? Which P0s can be simplified?
3. **Reassignment:** Should any issues be reassigned based on who's available?
4. **Present to user:** Get approval for scope cuts before making changes

Scope cut rules:
- P-lagniappe is cut first (zero guilt)
- P2 is cut next
- P1 is cut if P0s are at risk
- P0 scope can be reduced (simpler implementation) but never cut entirely
- After C5: NO NEW FEATURES. Only bug fixes and polish.

### Step 4: Update Tracking Issue

```bash
# Update checkpoint status in issue body
gh issue edit 1 --body "$(updated body with checkpoint status)"

# Add checkpoint comment
gh issue comment 1 --body "## Checkpoint C<N> Review
Status: <status>
<summary of assessment>
<scope cuts if any>"
```

## Completion

Tell the user:
- Current status (green/yellow/red)
- Key risks
- Recommended actions
- Next checkpoint target and time remaining
````

**Step 2: Commit**

```bash
git add skills/checkpoint/
git commit -m "feat: add checkpoint skill — timeline enforcement and scope cut protocol"
```

**Human verification:** Read the skill — should have checkpoint timeline, status assessment, scope cut protocol, and tracking issue updates.

---

## Task 11: Demo Prep Skill

**Files:**
- Create: `skills/demo-prep/SKILL.md`

**Step 1: Write the demo-prep skill**

Create `skills/demo-prep/SKILL.md`:

````markdown
---
name: demo-prep
description: Use when preparing the hackathon demo — audits readiness, generates demo script, captures screenshots, records backup video, and packages submission. Triggered by /hack demo.
---

# Demo Prep

Prepare a winning demo and package the submission.

**Announce:** "Using hackathoner:demo-prep to prepare the demo and submission."

## Process

### Step 1: Demo Readiness Audit

Check all requirements:

```
## Demo Readiness Audit

### Critical (must fix before demo)
- [ ] All P0 features working end-to-end
- [ ] No console errors on demo path
- [ ] Test data loaded and indexed
- [ ] Demo account/credentials ready (not personal accounts)
- [ ] App accessible at demo URL (or localhost ready)

### Important (should fix)
- [ ] Loading states look good (no blank screens)
- [ ] Error states handled gracefully
- [ ] Performance acceptable (no long waits during demo)

### Nice to have
- [ ] Polish pass on UI (alignment, spacing, colors)
- [ ] Favicon and page titles set
- [ ] Mobile responsive (if applicable)
```

Run automated checks where possible:
```bash
pnpm build  # Build succeeds
pnpm test   # Tests pass
```

### Step 2: Generate Demo Script

Read the scoring rubric and features built. Generate a 3-minute demo script:

```markdown
# Demo Script — <Project Name>

## Opening (15 seconds)
"<hook — what problem we solve>"

## Problem Statement (20 seconds)
<the challenge, why it matters>

## Solution Walkthrough (2 minutes)
1. <Feature A — show this screen, click this, show result> (30s)
2. <Feature B — show this flow, highlight wow moment> (30s)
3. <Integration with <tool> — show real data flowing through> (30s)
4. <Results/Impact — show metrics, before/after, processed data> (30s)

## Technical Highlights (20 seconds)
- Architecture: <one sentence>
- Tools used: <sponsor tools and how>
- Scale: <if applicable>

## Closing (15 seconds)
"<vision — where this goes next>"

## Notes for Demo
- Pre-load this data: <specific data>
- Have this tab open: <specific page>
- Backup plan if <X> fails: <fallback>
```

### Step 3: Pre-load Demo State

Create `scripts/seed-demo.sh`:
- Index all test clips
- Run analysis pipeline
- Populate any caches
- Set demo user account state

```bash
chmod +x scripts/seed-demo.sh
```

### Step 4: Capture Screenshots

Use Playwright to capture key screens:

```bash
pnpm exec playwright test test/e2e/screenshots.spec.ts
```

Create `test/e2e/screenshots.spec.ts`:
```typescript
import { test } from '@playwright/test'

test('capture demo screenshots', async ({ page }) => {
  // Navigate to each key screen and screenshot
  await page.goto('/')
  await page.screenshot({ path: 'docs/demo/screenshot-home.png', fullPage: true })

  // ... additional screens from demo script
})
```

### Step 5: Record Backup Video

Guide the user through recording:

```
## Backup Video Recording

1. Seed demo state: `bash scripts/seed-demo.sh`
2. Start recording (QuickTime / OBS / Loom)
3. Follow the demo script above
4. Keep under 3 minutes
5. Save to `docs/demo/backup-video.mp4`

If using Playwright for recording:
```bash
pnpm exec playwright test test/e2e/demo-recording.spec.ts --headed
```

### Step 6: Generate Backup Slide Deck

From screenshots, generate a simple slide deck:

```markdown
# docs/demo/slides.md

## Slide 1: Title
<Project Name> — <Tagline>
Team: <names>

## Slide 2: Problem
<Screenshot: problem-illustration>
<2 bullet points>

## Slide 3-5: Solution
<Screenshot per key feature>
<1-2 bullets each>

## Slide 6: Architecture
<Diagram or text description>

## Slide 7: Impact
<Metrics, processed data count, etc.>
```

### Step 7: Submission Checklist

```markdown
## Submission Checklist

- [ ] Code pushed to GitHub (public or shared with judges)
- [ ] README.md updated with: project description, setup instructions, demo link
- [ ] Demo video uploaded (if required)
- [ ] Slide deck ready (if required)
- [ ] Devpost/submission platform entry complete
- [ ] All team members listed
- [ ] Challenge track selected
- [ ] Sponsor tools documented in submission
- [ ] Screenshots attached
- [ ] Any required API keys/credentials for judges documented
```

### Step 8: Final Tracking Issue Comment

```bash
gh issue comment 1 --body "## 🏁 Submission Complete

### Deliverables
- Demo video: <link>
- Slide deck: <link>
- Live app: <link>
- Submission: <link>

### Stats
- P0 completed: <N>/<total>
- P1 completed: <N>/<total>
- P2 completed: <N>/<total>
- Total commits: $(git rev-list --count HEAD)
- Total PRs merged: $(gh pr list --state merged | wc -l)

### Team
<roster>
"
```

```bash
gh issue close 1
```

## Completion

Tell the user:
- Demo is ready
- All deliverables listed with links
- Submission checklist status
- "Good luck! 🎉"
````

**Step 2: Commit**

```bash
git add skills/demo-prep/
git commit -m "feat: add demo-prep skill — readiness audit, demo script, screenshots, submission packaging"
```

**Human verification:** Read the skill — should cover readiness audit, demo script generation, screenshots, backup video, slides, submission checklist, and final tracking issue update.

---

## Task 12: Final Validation & Plugin Installation Test

**Files:**
- No new files — validation only

**Step 1: Verify all files exist**

```bash
ls -la commands/hack.md
ls -la skills/*/SKILL.md
ls -la agents/tool-researcher.md
ls -la hooks/hooks.json
ls -la scripts/session-init.sh
```

Expected: All 8 skills, 1 command, 1 agent, hooks.json, and session-init script exist.

**Step 2: Verify all SKILL.md files have valid frontmatter**

For each skill, check the first 4 lines:
```bash
for f in skills/*/SKILL.md; do echo "=== $f ===" && head -4 "$f"; done
```

Expected: Each file starts with `---`, has `name:` and `description:` fields, closes with `---`.

**Step 3: Verify command frontmatter**

```bash
head -6 commands/hack.md
```

Expected: YAML frontmatter with description and allowed-tools.

**Step 4: Verify agent frontmatter**

```bash
head -5 agents/tool-researcher.md
```

Expected: YAML frontmatter with name, description, model, tools.

**Step 5: Verify hooks.json is valid JSON**

```bash
python3 -c "import json; json.load(open('hooks/hooks.json')); print('Valid JSON')"
```

Expected: "Valid JSON"

**Step 6: Verify session-init.sh is executable**

```bash
test -x scripts/session-init.sh && echo "Executable" || echo "Not executable"
```

Expected: "Executable"

**Step 7: Test local installation**

```bash
# Add dev marketplace
# /plugin marketplace add /path/to/claude-plugin-hackathoner
# /plugin install hackathoner@hackathoner-dev
```

Note: This step requires Claude Code restart. Document the commands for the user to run.

**Step 8: Final commit**

```bash
git add -A
git commit -m "feat: hackathoner plugin v0.1.0 — complete with all skills, command, agent, and hooks"
git push
```

**Human verification:**
- Run `find . -name "*.md" -not -path "./.git/*" | sort` — should list all 11 markdown files (8 skills, 1 command, 1 agent, 1 design doc)
- Run `cat .claude-plugin/plugin.json | python3 -m json.tool` — should be valid JSON with all paths
- Try installing the plugin locally and running `/hack` in a test directory
