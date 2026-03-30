---
name: init
description: This skill should be used when the user asks to "set up a hackathon", "start a hackathon project", "initialize hackathon", "kick off the hack", "parse hackathon rules", "create hackathon repo", mentions Devpost rules, or wants to prepare for an upcoming hackathon event. Sets up GitHub repo, tracking issue, project board, credentials, CLAUDE.md, and CONTRIBUTING.md from parsed hackathon rules. DO NOT use for general project setup, React/Next.js scaffolding, or non-hackathon repositories.
---

# Init Skill

You are initializing a new hackathon project. Follow these phases in order. After each phase, confirm success before proceeding.

**Important:** All files are created in the TARGET hackathon project repo, not in the plugin repo. The user should already be in (or have named) the target project directory.

---

## Phase 1: Parse Hackathon Rules

### 1.1 Acquire Rules

Ask the user how they want to provide hackathon rules:

> How would you like to provide the hackathon rules?
> 1. **URL** — I'll fetch the page
> 2. **File path** — I'll read a local file
> 3. **Paste** — Paste the rules text here

- **URL:** Use `WebFetch` to retrieve the page content. If the page is JavaScript-heavy, try fetching the raw URL first; fall back to a rendered fetch if content is empty.
- **File path:** Use `Read` to load the file contents.
- **Paste:** Accept the pasted text directly.

### 1.2 Extract Structured Data

Parse the rules and extract the following into a structured summary:

| Field | Description |
|-------|-------------|
| **Event name** | Official hackathon name |
| **Organizer** | Who is running it |
| **Dates** | Start/end times with timezone |
| **Duration** | Total hacking hours |
| **Location** | Venue or "virtual" |
| **Challenge tracks** | Each track with its description and specific judging criteria |
| **Required tech** | Mandatory APIs, platforms, services |
| **Scoring rubric** | Criteria and weights (e.g., Innovation 25%, Technical 25%, Impact 25%, Presentation 25%) |
| **Timeline** | Key milestones (kickoff, submissions, demos, judging) |
| **Demo format** | Live demo? Video? Duration? Screen share? |
| **Resources provided** | Free credits, sandbox accounts, starter repos, datasets |
| **Submission requirements** | What to submit (repo link, video, slides, devpost, etc.) |
| **Team constraints** | Min/max team size, registration requirements |
| **Prizes** | Prize breakdown by track/category |

### 1.3 Flag Unknowns

Identify and list anything that is unspecified or ambiguous:

> **Items to clarify with organizers:**
> - [ ] Is the demo live or pre-recorded?
> - [ ] What is the exact submission deadline?
> - [ ] Are there specific API versions required?
> (etc.)

### 1.4 Confirm with User

Present the parsed summary and ask:

> Does this look correct? Any corrections or additions before I proceed?

Store the confirmed rules data — you will use it throughout the remaining phases.

---

## Phase 2: Repository Setup

### 2.1 Create or Confirm GitHub Repo

Check if a GitHub repo already exists for the current directory:

```bash
gh repo view --json name,owner,url 2>/dev/null
```

If no repo exists, create one:

```bash
# Ask the user for the repo name (suggest based on event name)
gh repo create {{OWNER}}/{{REPO_NAME}} --private --clone
cd {{REPO_NAME}}
git checkout -b main
```

If a repo already exists, confirm with the user that this is the right one.

Store the repo owner/name for later: `{{OWNER}}/{{REPO_NAME}}`

### 2.2 Create GitHub Project Board

```bash
# Create the project
gh project create --owner {{OWNER}} --title "{{EVENT_NAME}}" --format json

# Note the project number from the output for later use
# The project comes with a default "Status" field. Update it to have these options:
# Backlog, Ready, In Progress, Review, Done
```

After creation, instruct the user:

> I created the GitHub Project. You may want to manually configure the Status field options in the GitHub UI at:
> https://github.com/orgs/{{OWNER}}/projects/{{PROJECT_NUMBER}}/settings
>
> Set status options to: **Backlog, Ready, In Progress, Review, Done**

### 2.3 Create Tracking Issue #1

Create the tracking issue with a structured body. This issue is the single source of truth for project state.

```bash
gh issue create --title "🏁 Hackathon Tracker: {{EVENT_NAME}}" --body "$(cat <<'ISSUE_BODY'
## Event Details

| Field | Value |
|-------|-------|
| **Event** | {{EVENT_NAME}} |
| **Organizer** | {{ORGANIZER}} |
| **Dates** | {{DATES}} |
| **Duration** | {{DURATION}} hours |
| **Location** | {{LOCATION}} |
| **Demo format** | {{DEMO_FORMAT}} |
| **Submission** | {{SUBMISSION_REQUIREMENTS}} |
| **Comms** | {{COMMS_PLATFORM}}: {{COMMS_URL}} |

## Phase Checklist

- [x] Rules parsed
- [ ] Init complete
- [ ] Comms channel set up
- [ ] Team inventory done
- [ ] Tools researched
- [ ] Domain researched
- [ ] Hackathon-brainstorming done
- [ ] Scaffold committed
- [ ] Feature Zero working
- [ ] Build phase (checkpoint-driven)
- [ ] Demo prep done
- [ ] Submitted

## Scoring Rubric

| Criterion | Weight | Our Strategy |
|-----------|--------|-------------|
| {{CRITERION_1}} | {{WEIGHT_1}} | _TBD after brainstorming_ |
| {{CRITERION_2}} | {{WEIGHT_2}} | _TBD after brainstorming_ |
| {{CRITERION_3}} | {{WEIGHT_3}} | _TBD after brainstorming_ |
| {{CRITERION_4}} | {{WEIGHT_4}} | _TBD after brainstorming_ |

## Sponsor Tools

| Tool | Status | Skill | Credentials |
|------|--------|-------|-------------|
| {{TOOL_1}} | ⬜ Not started | — | ⬜ Not configured |
| {{TOOL_2}} | ⬜ Not started | — | ⬜ Not configured |

## Team Roster

| GitHub | Role | Strengths | Hours Available | Status |
|--------|------|-----------|-----------------|--------|
| _Run `/hack team` to populate_ | | | | |

## Checkpoint Timeline

| Checkpoint | Offset | Target Time | Status |
|-----------|--------|-------------|--------|
| C0 | Hacking starts | {{C0_TIME}} | ⬜ |
| C1 | +3 hours | {{C1_TIME}} | ⬜ |
| C2 | +7 hours | {{C2_TIME}} | ⬜ |
| C3 | +11 hours | {{C3_TIME}} | ⬜ |
| C4 | +19 hours | {{C4_TIME}} | ⬜ |
| C5 | +23 hours | {{C5_TIME}} | ⬜ |
| C6 | +24.5 hours | {{C6_TIME}} | ⬜ |
| C7 | +25.5 hours | {{C7_TIME}} | ⬜ |

## Test Data Coverage

| Dataset | Clips | Ground Truth | Indexed | Purpose |
|---------|-------|-------------|---------|---------|
| _Run `/hack data` to populate_ | | | | |

ISSUE_BODY
)"
```

Replace all `{{PLACEHOLDER}}` values with the actual parsed data from Phase 1. For checkpoint times, calculate offsets from the hackathon start time. If the start time is unknown, leave as relative offsets (e.g., "Start + 3h").

**Expanding research checklist items:**

- Replace `- [ ] Tools researched` with one `- [ ] Research: <tool>` line per sponsor tool identified in the rules (e.g., `- [ ] Research: TwelveLabs`, `- [ ] Research: AWS Bedrock`).
- Replace `- [ ] Domain researched` with one `- [ ] Domain research: <topic>` line per domain topic identified from the challenge. Analyze the challenge track and judging criteria to detect regulated domains, compliance frameworks, classification systems, or industry standards the team must understand (e.g., `- [ ] Domain research: broadcast-compliance`, `- [ ] Domain research: content-rating-systems`). If no domain topics are obvious, keep the single `- [ ] Domain researched` line — the research-domain skill will analyze the challenge and identify topics at runtime.

### 2.4 Team Communication Channel

Hackathon teams need a real-time comms channel. Discord is the default recommendation because setup is faster (~2 min vs ~15 min for Slack), it's fully scriptable via bot API, teammates join with one click (no email verification), and the server can be deleted after the hackathon.

Ask the user:

> **Team communication setup**
>
> Did the hackathon organizers provide a Discord server or Slack workspace?
>
> 1. **Yes** — I have an invite/workspace link (paste it)
> 2. **No** — Set one up for me
>
> If no channel was provided, I'll create a Discord server with hackathon channels — takes about 2 minutes.

**If organizers provided a channel:** Record the link and skip to Phase 3. The link will be added to the tracking issue and CONTRIBUTING.md during Phase 4.

**If no channel was provided:** Invoke skill `hackathoner:discord-setup` to create a Discord server with channels, roles, and a never-expiring invite link. The skill handles bot token setup, server creation, and recording the result in the tracking issue.

Store the comms platform and invite URL for use in Phase 4 templates: `{{COMMS_PLATFORM}}` and `{{COMMS_URL}}`.

---

## Phase 3: Credential Setup

Guide the user through credential setup. **Never store actual credential values.** Only create templates and verify that credentials work.

### 3.1 GitHub PAT

Walk the user through creating a fine-grained PAT:

> **GitHub Personal Access Token Setup**
>
> 1. Go to: https://github.com/settings/tokens?type=beta
> 2. Click "Generate new token"
> 3. Settings:
>    - **Token name:** `hackathon-{{EVENT_NAME_SLUG}}`
>    - **Expiration:** 7 days
>    - **Repository access:** Only select repositories → select `{{REPO_NAME}}`
>    - **Permissions:**
>      - Repository: Contents (Read/Write), Issues (Read/Write), Pull requests (Read/Write), Projects (Read/Write)
>      - (If Discussions enabled) Discussions (Read/Write)
> 4. Click "Generate token" and copy the value
> 5. Create a `.env` file in the project root and add:
>    ```
>    GITHUB_TOKEN=ghp_your_token_here
>    ```

Verify the PAT works:

```bash
# Source .env and verify
set -a && source .env && set +a
gh auth status
gh api repos/{{OWNER}}/{{REPO_NAME}} --jq '.full_name'
```

### 3.2 AWS Credentials (if needed)

Only run this section if the hackathon requires AWS services (detected from parsed rules).

> **AWS Credentials Setup**
>
> 1. Create a dedicated IAM user for the hackathon:
>    ```bash
>    aws iam create-user --user-name hackathon-{{EVENT_NAME_SLUG}}
>    ```
> 2. Attach a scoped policy (adjust services based on what you need):
>    ```bash
>    aws iam attach-user-policy --user-name hackathon-{{EVENT_NAME_SLUG}} \
>      --policy-arn arn:aws:iam::policy/PowerUserAccess
>    ```
> 3. Create access keys:
>    ```bash
>    aws iam create-access-key --user-name hackathon-{{EVENT_NAME_SLUG}}
>    ```
> 4. Add to `.env`:
>    ```
>    AWS_ACCESS_KEY_ID=AKIA...
>    AWS_SECRET_ACCESS_KEY=...
>    AWS_DEFAULT_REGION=us-east-1
>    ```

Verify:

```bash
set -a && source .env && set +a
aws sts get-caller-identity
```

### 3.3 Sponsor Tool Credentials

For each sponsor tool identified in the rules, walk the user through credential setup. Tailor the instructions to the specific tool. General pattern:

> **{{TOOL_NAME}} Credentials**
>
> 1. Sign up / get access at: {{TOOL_SIGNUP_URL}}
> 2. Generate an API key at: {{TOOL_API_KEY_URL}}
> 3. Add to `.env`:
>    ```
>    {{TOOL_ENV_VAR}}=your_key_here
>    ```

### 3.4 Create .env.example

Generate a `.env.example` file listing all required environment variables with descriptions but no values:

```bash
cat > .env.example << 'EOF'
# GitHub
GITHUB_TOKEN=           # Fine-grained PAT (repo, issues, projects scope)

# AWS (if applicable)
AWS_ACCESS_KEY_ID=      # IAM user access key
AWS_SECRET_ACCESS_KEY=  # IAM user secret key
AWS_DEFAULT_REGION=     # e.g., us-east-1

# Sponsor Tools
# {{TOOL_1_ENV_VAR}}=   # {{TOOL_1_DESCRIPTION}}
# {{TOOL_2_ENV_VAR}}=   # {{TOOL_2_DESCRIPTION}}

# Feature flags
USE_MOCKS=true          # Set to false when real credentials are configured
EOF
```

Adjust the template to include only the credentials actually needed for this hackathon.

### 3.5 Verify All Credentials

After the user has set up credentials, verify each one:

```bash
echo "=== Credential Verification ==="

# GitHub
echo -n "GitHub PAT: "
set -a && source .env && set +a
gh api user --jq '.login' && echo "✓" || echo "✗ FAILED"

# AWS (if applicable)
echo -n "AWS: "
aws sts get-caller-identity --query 'Account' --output text && echo "✓" || echo "✗ FAILED"

# Add verification for each sponsor tool
```

Report results and note any that still need setup.

---

## Phase 4: Project Files

### 4.1 Generate .claude/CLAUDE.md

Create the project-level Claude instructions file:

```markdown
# {{EVENT_NAME}} — Project Instructions

## Project Overview

This is a hackathon project for **{{EVENT_NAME}}** ({{DATES}}).
Hackathon duration: {{DURATION}} hours.
Challenge track: {{CHALLENGE_TRACK}}
Team members: {{TEAM_MEMBERS_LIST}}
Comms: {{COMMS_PLATFORM}} — {{COMMS_URL}}

## Session Start

At the start of every session, run `gh issue view 1 --json title,state,body -q '.title + "\nState: " + .state + "\n\n" + .body'` to load the current hackathon state from the tracking issue. This gives you the phase checklist, checkpoint timeline, team roster, and sponsor tools status. Do this before any other work.

## Commands

- `/hack` — Pick up your next task. Detects your identity, finds your highest-priority unblocked issue, ensures there's an approved plan, then executes it in a worktree.
- `/checkpoint` — Review progress against the timeline. Shows status dashboard, identifies risks, suggests scope cuts.
- `/hack-bug` — Quickly file a bug as a GitHub Issue with hackathon labels and priority.
- `/hack-feat` — Quickly file a feature idea as a GitHub Issue with hackathon labels and priority.
- `/hack-retro` — Run a post-hackathon retrospective. Captures results, metrics, reflections, and learnings.

## Project Skills

These skills are loaded automatically and provide context about the hackathon:
- `hackathon-rules` — Parsed rules, scoring rubric, timeline, submission requirements
- `team-routing` — Team roster and task assignment heuristics
- `hackathon-sdlc` — Spec-driven development process for this hackathon
{{SPONSOR_TOOL_SKILLS}}

## Workflow

1. Run `/hack` to get your next assigned issue
2. A plan will be generated (or loaded) from docs/plans/
3. Implementation happens in a worktree branched from main
4. Follow TDD: write tests first, then implement
5. Create a PR when done — reference the plan file
6. Run `/hack` again for your next issue
7. Run `/checkpoint` periodically to check team progress

## Tech Stack

- Runtime: Node.js
- Package manager: pnpm
- Language: TypeScript (strict)
- Frontend: Next.js on Vercel, Tailwind CSS, shadcn/ui
- UI components: shadcn/ui
- IaC: Terraform
- Local cloud: LocalStack for AWS services
- Testing: Vitest (unit), Playwright (E2E)
- State: GitHub Issues + Projects

## Important Rules

- **Plans before code.** No code without an approved plan in `docs/plans/`.
- **P0 before P1 before P2.** Always work on the highest-priority unblocked issue.
- **No new features after C5.** Final checkpoint is for polish, bug fixes, and submission only.
- **Commit frequently** with descriptive messages. Small, focused commits.
- **Plan format:** `docs/plans/YYYY-MM-DD-HHMM-<description>.md`
- **Branching:** Worktrees from main. PR back to main.
- **Tracking issue:** #1 is the single source of truth.

## Credentials

All credentials are in `.env` (gitignored). See `.env.example` for required vars.
Set `USE_MOCKS=true` for local development without real API keys.

## Key Commands

- `pnpm dev` — Start development server
- `pnpm test` — Run unit tests
- `pnpm test:e2e` — Run E2E tests
- `pnpm lint` — Lint and type-check

## Scoring Rubric

{{SCORING_RUBRIC_TABLE}}

## Sponsor Tools

{{SPONSOR_TOOLS_LIST}}

## Quality Gates

- All PRs must reference a plan file and the tracking issue.
- Run `pnpm lint && pnpm test` before marking any task complete.
- Verification before completion: test the feature manually, check for edge cases.
```

Replace all placeholders with actual values from the parsed rules. For `{{SPONSOR_TOOL_SKILLS}}`, generate one line per researched sponsor tool in the format `- \`<tool-name>\` — Integration guide for <tool display name>`. For `{{TEAM_MEMBERS_LIST}}`, use a comma-separated list of team member names.

### 4.2 Generate CONTRIBUTING.md

```markdown
# Contributing to {{EVENT_NAME}}

> **You do NOT need any special Claude Code plugins installed** — all commands and skills are included in this repo's `.claude/` directory.

## Getting Started

Clone the repo, run `claude` in the project root, then type `/hack` to pick up your first task.

```bash
gh repo clone {{OWNER}}/{{REPO_NAME}}
cd {{REPO_NAME}}
pnpm install
cp .env.example .env
# Fill in credential values — see "Credential Setup" below
claude
# Then type: /hack
```

## Prerequisites

- [ ] Node.js 20+
- [ ] pnpm 9+
- [ ] GitHub CLI (`gh`) authenticated
- [ ] Terraform 1.5+ (if using IaC)
- [ ] Docker (for LocalStack)
- [ ] Claude Code CLI

## Workflow

1. Check the tracking issue (#1) for current phase and priorities.
2. Run `/hack` in Claude Code to pick up your next task.
3. Claude generates a plan file in `docs/plans/` — review and approve it.
4. Claude implements in a worktree, creates a PR.
5. Review the PR, merge to main.

## Credential Setup

### GitHub PAT

1. Go to https://github.com/settings/tokens?type=beta
2. Generate token with: Contents, Issues, Pull requests, Projects (Read/Write)
3. Scope to this repository only
4. Set 7-day expiry
5. Add to `.env` as `GITHUB_TOKEN`

{{AWS_CREDENTIAL_SECTION}}

{{SPONSOR_TOOL_CREDENTIAL_SECTIONS}}

## Config Validation

Run this to verify all credentials are working:

```bash
source .env

echo "--- GitHub ---"
gh api user --jq '.login'

echo "--- AWS ---"
aws sts get-caller-identity 2>/dev/null || echo "Not configured (may not be needed)"

# Add per-tool checks here as tools are researched
```

## Project Structure

```
├── .claude/
│   ├── CLAUDE.md              # Project instructions for Claude
│   └── skills/                # Project-specific skills
├── docs/
│   ├── plans/                 # Timestamped plan files
│   └── tools/                 # Per-tool integration docs
├── infra/                     # Terraform root module
├── src/                       # Application source code
├── test/
│   ├── e2e/                   # Playwright E2E tests
│   └── fixtures/
│       └── expected-violations/  # Ground truth for validation
├── .env.example               # Required environment variables
├── .gitignore
└── CONTRIBUTING.md
```
```

Replace all placeholders. Include AWS and sponsor tool sections only if applicable. For each sponsor tool, add a credential setup subsection with specific instructions.

### 4.3 Generate .gitignore

```gitignore
# Dependencies
node_modules/

# Environment
.env
.env.local
.env.*.local

# Terraform
.terraform/
*.tfstate
*.tfstate.backup
*.tfvars
!*.tfvars.example

# Build
.next/
out/
dist/
build/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Test
coverage/
playwright-report/
test-results/

# Misc
*.log

# Hackathoner identity (per-user, not shared)
.hackathoner.local.md
```

### 4.4 Create Directory Structure

```bash
mkdir -p .claude/skills
mkdir -p .claude/commands
mkdir -p .claude/agents
mkdir -p docs/plans
mkdir -p docs/tools
mkdir -p infra
mkdir -p test/e2e
mkdir -p test/fixtures/expected-violations
mkdir -p src
```

### 4.5 Generate hackathon-rules Project Skill

Create `.claude/skills/hackathon-rules/SKILL.md`:

```markdown
---
name: hackathon-rules
description: Reference for parsed hackathon rules, scoring rubric, timeline, and submission requirements for {{EVENT_NAME}}.
---

# Hackathon Rules: {{EVENT_NAME}}

## Event Overview

- **Event:** {{EVENT_NAME}}
- **Organizer:** {{ORGANIZER}}
- **Dates:** {{DATES}}
- **Duration:** {{DURATION}} hours
- **Location:** {{LOCATION}}

## Challenge Tracks

{{CHALLENGE_TRACKS_DETAILS}}

## Scoring Rubric

| Criterion | Weight | Notes |
|-----------|--------|-------|
{{RUBRIC_ROWS}}

## Timeline

| Milestone | Time |
|-----------|------|
{{TIMELINE_ROWS}}

## Demo Format

{{DEMO_FORMAT_DETAILS}}

## Submission Requirements

{{SUBMISSION_DETAILS}}

## Resources Provided

{{RESOURCES_LIST}}

## Constraints & Rules

{{CONSTRAINTS_AND_RULES}}

## Items Pending Clarification

{{PENDING_ITEMS}}
```

Fill in all placeholders with actual data from Phase 1.

### 4.6 Generate hackathon-sdlc Project Skill

Create `.claude/skills/hackathon-sdlc/SKILL.md`:

```markdown
---
name: hackathon-sdlc
description: Spec-driven development process for hackathon projects. Covers plan format, branching strategy, priority enforcement, and quality gates.
---

# Hackathon SDLC

## Core Principle

No code without an approved plan. Plans committed before implementation.

## Plan Format

Every work item requires a plan file before implementation begins.

**Path:** `docs/plans/YYYY-MM-DD-HHMM-<description>.md`

**Template:**

```markdown
---
issue: "#{{ISSUE_NUMBER}}"
assignee: "{{GITHUB_USERNAME}}"
checkpoint: "{{CHECKPOINT}}"
priority: "{{PRIORITY}}"
---

# Plan: {{TITLE}}

## Goal

What this work item achieves and why it matters for the demo.

## Approach

Step-by-step implementation plan.

## Files to Create/Modify

- `path/to/file.ts` — description of changes

## Test Plan

- [ ] Unit tests for ...
- [ ] E2E test for ...
- [ ] Manual verification: ...

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2
```

## Branching Strategy

1. Plan file is committed and pushed to `main`.
2. Create a worktree for implementation:
   ```bash
   git worktree add ../{{REPO_NAME}}-{{ISSUE_NUMBER}} -b feat/{{ISSUE_NUMBER}}-{{SLUG}}
   ```
3. Implement in the worktree.
4. Create PR referencing the plan file and issue.
5. Merge to main after review.
6. Clean up worktree:
   ```bash
   git worktree remove ../{{REPO_NAME}}-{{ISSUE_NUMBER}}
   ```

## Priority Enforcement

| Priority | Rule |
|----------|------|
| P0 | Must be done before C4. Demo breaks without this. |
| P1 | Do if P0s are on track. Bonus points or wow factor. |
| P2 | Only if time after P1s. Nice-to-have polish. |
| P-lagniappe | Only if C4 is green, 2-3hr max, zero guilt if cut. |

**Strict ordering:** P0 → P1 → P2 → P-lagniappe. Never start a lower priority while a higher priority is incomplete, unless blocked.

## Quality Gates

Before marking any task complete:

1. **Lint:** `pnpm lint` passes
2. **Type check:** `pnpm tsc --noEmit` passes
3. **Unit tests:** `pnpm test` passes
4. **E2E tests:** `pnpm test:e2e` passes (if applicable)
5. **Manual verification:** Feature works as described in the plan
6. **Edge cases:** Checked and handled

## Checkpoint Reviews

At each checkpoint (C0-C7), review:

- Are all tasks for this checkpoint complete?
- Are we on track for the next checkpoint?
- Do we need to cut scope?

**Scope cut protocol:**
1. List all incomplete P1+ items.
2. For each, ask: "Does the demo work without this?"
3. If yes, cut it. Move to P2 or close.
4. Update tracking issue with scope cut decisions.
5. Add comment to tracking issue explaining cuts.

## Commit Messages

Format: `type(scope): description (#issue)`

Types: `feat`, `fix`, `docs`, `test`, `infra`, `chore`
```

Fill in any project-specific values.

---

## Phase 5: Contributor Commands & Agents

Generate project-level commands and agents so that contributors can use `/hack` and `/checkpoint` without needing the hackathoner plugin installed.

### 5.1 Create `.claude/commands/hack.md`

```bash
mkdir -p .claude/commands .claude/agents
```

Write the following file to `.claude/commands/hack.md`:

````markdown
---
description: Pick up your next hackathon task — detects your identity, finds your highest-priority issue, checks for a plan, and executes in a worktree
argument-hint: "[issue-number] — optionally specify an issue to work on"
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Agent, Skill, AskUserQuestion, WebFetch, WebSearch, TaskCreate, TaskUpdate, TaskList
---

# /hack — Contributor Workflow

You are a hackathon contributor. Follow this workflow to pick up and execute your next task.

## Rules

- **Plans before code** — every issue needs a committed plan in `docs/plans/` before any implementation begins.
- **P0 before P1 before P2** — strict priority ordering. Never start a lower-priority issue while a higher one is unblocked and assigned to you.
- **Bugs before features** — at the same priority level, bugs come first.
- **Skip in-progress issues** — if an issue is labeled `in-progress`, another session is already working on it. Pick the next one.
- **One owner per issue** — do not take work already assigned to someone else.
- **Commit frequently** — small, incremental commits. Do not accumulate large uncommitted changes.
- **Reference the hackathon-sdlc project skill** for plan format, branching strategy, and quality gates.

## Step 1: Identify Yourself

```bash
MY_EMAIL=$(git config user.email)
echo "Current user: $MY_EMAIL"
```

Read tracking issue #1 to find the Team Roster table. Match your email or GitHub username to determine your identity and role.

## Step 2: Pick an Issue

If `$ARGUMENTS` contains an issue number, use that issue directly (skip the search):

```bash
gh issue view $ARGUMENTS --json number,title,assignees,labels,body
```

Otherwise, find your highest-priority unblocked issue that is NOT already in-progress. **Bugs come first at every priority level.**

```bash
# Get all your open issues, excluding in-progress ones
# P0 bugs first, then P0 non-bugs
gh issue list --assignee @me --state open --label P0,bug --json number,title,labels -q '[.[] | select(all(.labels[].name; . != "in-progress"))]'
gh issue list --assignee @me --state open --label P0 --json number,title,labels -q '[.[] | select(all(.labels[].name; . != "in-progress"))]'

# Then P1 bugs, then P1 non-bugs
gh issue list --assignee @me --state open --label P1,bug --json number,title,labels -q '[.[] | select(all(.labels[].name; . != "in-progress"))]'
gh issue list --assignee @me --state open --label P1 --json number,title,labels -q '[.[] | select(all(.labels[].name; . != "in-progress"))]'

# Then P2 bugs, then P2 non-bugs
gh issue list --assignee @me --state open --label P2,bug --json number,title,labels -q '[.[] | select(all(.labels[].name; . != "in-progress"))]'
gh issue list --assignee @me --state open --label P2 --json number,title,labels -q '[.[] | select(all(.labels[].name; . != "in-progress"))]'
```

Pick the first issue from the highest available priority level, bugs before features. If no issues are assigned to you, check for unassigned issues and offer to pick one up.

Also check for existing worktrees — if a worktree exists for a branch matching `feat/ISSUE_NUMBER-*`, that issue is in-progress in another session:

```bash
git worktree list
```

## Step 3: Claim the Issue

Before starting work, mark the issue as in-progress so other sessions skip it:

```bash
gh issue edit ISSUE_NUMBER --add-label "in-progress"
gh issue comment ISSUE_NUMBER --body "🔨 Picked up by @$(gh api user -q '.login') — working in worktree"
```

## Step 4: Check for an Approved Plan

Look for a plan file referencing this issue:

```bash
grep -rl "issue.*#ISSUE_NUMBER\|#ISSUE_NUMBER" docs/plans/ 2>/dev/null
```

Also list recent plan files to check manually:

```bash
ls -la docs/plans/
```

### If no plan exists:

1. Use the hackathon-sdlc skill's plan template to generate a plan.
2. Save it to `docs/plans/YYYY-MM-DD-HHMM-<description>.md` using the current timestamp.
3. Commit the plan to main:
   ```bash
   git add docs/plans/
   git commit -m "docs(plan): plan for #ISSUE_NUMBER — DESCRIPTION"
   git push
   ```
4. Present the plan to the user and ask for approval before proceeding.

### If a plan exists:

Read the plan file and proceed to implementation.

## Step 5: Create Worktree and Implement

Create an isolated worktree for this issue:

```bash
PROJECT_DIR=$(basename $(pwd))
BRANCH_NAME="feat/ISSUE_NUMBER-SLUG"
WORKTREE_PATH="../${PROJECT_DIR}-issue-ISSUE_NUMBER"

git pull
git worktree add "$WORKTREE_PATH" -b "$BRANCH_NAME"
cd "$WORKTREE_PATH"
```

Now implement in the worktree:

1. Follow the plan step by step
2. Commit frequently: `git commit -m "feat(#ISSUE_NUMBER): description"`
3. Run quality gates before finishing: lint, type-check, tests
4. Push the branch: `git push -u origin $BRANCH_NAME`

## Step 6: Create PR and Clean Up

```bash
gh pr create --title "DESCRIPTION (#ISSUE_NUMBER)" \
  --body "$(cat <<'EOF'
## Plan

See `docs/plans/PLAN_FILENAME`

## Changes

[Brief summary of what was implemented]

Closes #ISSUE_NUMBER
EOF
)"

# Return to main worktree
cd -

# Remove the worktree (branch stays on remote via the PR)
git worktree remove "$WORKTREE_PATH" 2>/dev/null || true

# Remove in-progress label (PR is the new status indicator)
gh issue edit ISSUE_NUMBER --remove-label "in-progress"
```

## Step 7: Auto-Continue Loop

After the PR is created, DO NOT stop and wait for the user. Instead:

1. Announce: "PR created for #ISSUE_NUMBER. Checking for next task..."
2. Make sure you're in the main worktree (project root)
3. Pull latest: `git pull`
4. Go back to **Step 1** and pick up the next issue automatically

Keep looping until: no more assigned issues, a step needs user input (e.g., plan approval), or the user interrupts.

If the user passes a specific issue number (`/hack 42`), execute just that one issue and stop after the PR.

## Multi-Session Workflow

This command is designed for parallel execution across multiple terminal tabs:

```
Tab 1: cd project && claude → /hack     → picks issue #5, creates worktree, works...
Tab 2: cd project && claude → /hack     → sees #5 is in-progress, picks issue #7
Tab 3: cd project && claude → /hack     → sees #5 and #7 in-progress, picks issue #9
```

Each tab works in its own worktree. No conflicts, no coordination needed. The `in-progress` label and worktree detection prevent double-picking.
````

### 5.2 Create `.claude/commands/checkpoint.md`

Write the following file to `.claude/commands/checkpoint.md`:

````markdown
---
description: Check hackathon progress against the timeline — shows status dashboard, identifies risks, suggests scope cuts
allowed-tools: Read, Bash, Glob, Grep, AskUserQuestion
---

# /checkpoint — Progress Review

You are reviewing hackathon progress against the checkpoint timeline.

## Step 1: Read Tracking State

```bash
gh issue view 1 --json body --jq '.body'
```

Parse the tracking issue to extract:
- **Checkpoint Timeline** table (C0-C7 with target times)
- **Hacking start time** (C0 target time)
- **Phase Checklist** status

## Step 2: Compute Current Checkpoint

Determine the current time and compute elapsed hours since hacking started:

```bash
echo "Current time: $(date -u '+%Y-%m-%d %H:%M UTC')"
```

Compare elapsed time against the checkpoint timeline offsets to determine which checkpoint window you are in.

## Step 3: Check Issue Status

```bash
echo "=== P0 Issues ==="
gh issue list --state open --label P0 --json number,title,assignees

echo "=== P1 Issues ==="
gh issue list --state open --label P1 --json number,title,assignees

echo "=== P2 Issues ==="
gh issue list --state open --label P2 --json number,title,assignees

echo "=== Closed Issues ==="
gh issue list --state closed --json number,title,labels
```

## Step 4: Check PR Status

```bash
gh pr list --state open --json number,title,author,reviewDecision
gh pr list --state merged --json number,title
```

## Step 5: Status Dashboard

Present a dashboard using this format:

```
╔══════════════════════════════════════════════════════╗
║              HACKATHON STATUS — Checkpoint Cx        ║
╠══════════════════════════════════════════════════════╣
║ Elapsed:  Xh XXm / {{DURATION}}h total              ║
║ Remaining: Xh XXm                                    ║
╠══════════════════════════════════════════════════════╣
║ P0 Issues:  X open / Y total     [GREEN/YELLOW/RED] ║
║ P1 Issues:  X open / Y total     [GREEN/YELLOW/RED] ║
║ P2 Issues:  X open / Y total     [GREEN/YELLOW/RED] ║
║ Open PRs:   X                    [GREEN/YELLOW/RED] ║
╠══════════════════════════════════════════════════════╣
║ Overall:    [GREEN/YELLOW/RED]                       ║
╚══════════════════════════════════════════════════════╝
```

Color rules:
- **GREEN**: On track. P0s done or in progress with time remaining.
- **YELLOW**: At risk. P0s behind schedule but recoverable with scope cuts.
- **RED**: Behind. P0s blocked or insufficient time to complete.

## Step 6: Scope Cut Recommendations (if behind)

If status is YELLOW or RED, suggest scope cuts following this protocol:

1. **Cut P-lagniappe first** — remove any nice-to-have items
2. **Cut P2 next** — close or deprioritize polish items
3. **Reduce P1 scope** — simplify P1 items to minimum viable versions
4. **Simplify P0 scope** — only as last resort, reduce P0 to bare minimum for demo

For each cut, explain what is lost and what is saved in time.

## Step 7: Update Tracking Issue

Add a checkpoint comment to the tracking issue:

```bash
gh issue comment 1 --body "## Checkpoint Cx — STATUS

**Elapsed:** Xh XXm
**P0:** X/Y complete
**P1:** X/Y complete
**P2:** X/Y complete
**Open PRs:** X

**Risks:** (list any)
**Scope cuts:** (list any decisions made)

**Next checkpoint:** Cx+1 at TIME"
```
````

### 5.3 Create `.claude/commands/hack-bug.md`

Write the following file to `.claude/commands/hack-bug.md`:

````markdown
---
description: Quickly file a bug as a GitHub Issue with hackathon labels and priority
argument-hint: <brief description of the bug>
allowed-tools: Bash, AskUserQuestion
---

# /hack-bug — File a Bug

## Step 1: Get Bug Description

If `$ARGUMENTS` is provided, use it as the bug title.

If not, ask:

> What's the bug? (one line)

## Step 2: Get Priority

Ask:

> How bad is it?
> - **P0** — Demo breaks
> - **P1** — Significant impact
> - **P2** — Minor issue

## Step 3: Gather Details (P0 only)

If the priority is P0, ask:

> What are the steps to reproduce this bug?

For P1 and P2, skip this step.

## Step 4: Create the Issue

```bash
gh issue create \
  --title "bug: <DESCRIPTION>" \
  --label "bug,<PRIORITY>" \
  --body "$(cat <<'EOF'
## Description

<DESCRIPTION>

## Steps to Reproduce

<STEPS_IF_P0_OR "N/A">

## Expected Behavior

<Ask or infer>

## Actual Behavior

<Ask or infer>

## Error Messages

<Any error output, or "None provided">
EOF
)" \
  <IF_P0: --assignee @me>
```

- Use label `bug` plus the priority label (`P0`, `P1`, or `P2`).
- If P0, assign to current user with `--assignee @me`. Otherwise, leave unassigned.

## Step 5: Report

Print the issue URL and suggest:

> Run `/hack` to pick this up if it's your highest priority.
````

### 5.4 Create `.claude/commands/hack-feat.md`

Write the following file to `.claude/commands/hack-feat.md`:

````markdown
---
description: Quickly file a feature idea as a GitHub Issue with hackathon labels and priority
argument-hint: <brief description of the feature>
allowed-tools: Bash, AskUserQuestion
---

# /hack-feat — File a Feature Idea

## Step 1: Get Feature Description

If `$ARGUMENTS` is provided, use it as the feature title.

If not, ask:

> What's the feature idea? (one line)

## Step 2: Get Priority

Ask:

> How important?
> - **P0** — Demo needs it
> - **P1** — Wow factor
> - **P2** — Nice-to-have
> - **P-lagniappe** — Stretch goal

## Step 3: Create the Issue

```bash
gh issue create \
  --title "feat: <DESCRIPTION>" \
  --label "enhancement,<PRIORITY>" \
  --body "$(cat <<'EOF'
## Description

<DESCRIPTION>

## Why It Matters

<Why this matters for the demo/judges — infer from context or ask briefly>

## Rough Approach (optional)

<If the user mentioned an approach, include it. Otherwise, leave as "TBD during planning.">
EOF
)"
```

- Use label `enhancement` plus the priority label (`P0`, `P1`, `P2`, or `P-lagniappe`).
- Do not assign — brainstorming/routing handles assignment.

## Step 4: Report

Print the issue URL.
````

### 5.5 Create `.claude/commands/hack-retro.md`

Write the following file to `.claude/commands/hack-retro.md`:

````markdown
---
description: Run a post-hackathon retrospective — captures results, metrics, reflections, and learnings into docs/results.md
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, AskUserQuestion
---

# /hack-retro — Post-Hackathon Retrospective

## Part 1: Gather Project Metrics Automatically

Collect the following metrics silently (do not ask the user for these):

```bash
# Commit count
echo "Commits: $(git rev-list --count HEAD)"

# Merged PRs
echo "Merged PRs: $(gh pr list --state merged --json number | jq length)"

# Issues by state
echo "=== Issues ==="
gh issue list --state all --json state,labels,number,title

# Lines of code (approximate)
echo "Lines of code:"
find src -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.jsx' -o -name '*.py' 2>/dev/null | xargs wc -l 2>/dev/null | tail -1
```

Also:
- Count P0/P1/P2 issues completed vs total from the issue list.
- Detect test runner and run tests if available: try `pnpm test` or `uv run pytest`. Capture pass/fail counts and coverage if reported.
- Read tracking issue #1 for checkpoint timeline and final status: `gh issue view 1 --json body --jq '.body'`
- List plan files: `ls docs/plans/ 2>/dev/null`
- Check for demo artifacts: `ls docs/demo/ 2>/dev/null`

## Part 2: Ask User for Reflections

Ask these questions **one at a time**, waiting for an answer before asking the next:

1. "What went well? What are you most proud of?"
2. "What didn't go well? What would you do differently?"
3. "What surprised you — technically or about the team dynamics?"
4. "Rate the hackathon tooling (this plugin, Claude Code, etc.) — what helped, what got in the way?"
5. "Any shoutouts for teammates or specific contributions?"
6. "If you had 4 more hours, what would you have done?"

## Part 3: Generate docs/results.md

Write a comprehensive results document to `docs/results.md`:

```markdown
# [Project Name] — Hackathon Results

## Event
- Hackathon: [name]
- Date: [date]
- Team: [members]
- Track: [challenge track]

## Outcome
- [Won/Placed/Participated]
- Demo: [link if available]
- Submission: [link if available]

## Project Stats
| Metric | Value |
|--------|-------|
| Commits | X |
| PRs merged | X |
| Issues closed | X/Y |
| P0 completed | X/Y |
| P1 completed | X/Y |
| P2 completed | X/Y |
| Test coverage | X% (if available) |
| Lines of code | X |
| Plans written | X |

## Checkpoint Performance
[Table showing each checkpoint target vs actual, parsed from tracking issue #1]

## What Went Well
[User's reflections from question 1]

## What Didn't Go Well
[User's reflections from question 2]

## Surprises
[User's reflections from question 3]

## Tooling Feedback
[User's reflections from question 4]

## Shoutouts
[User's reflections from question 5]

## If We Had More Time
[User's reflections from question 6]

## Key Learnings
[Synthesize 3-5 bullet points from all of the above — metrics, reflections, and checkpoint performance]
```

Fill in all values from the metrics gathered in Part 1 and the reflections from Part 2. Read tracking issue #1 to populate Event details and Checkpoint Performance.

## Part 4: Commit and Update Tracking Issue

```bash
# Commit the results file
git add docs/results.md
git commit -m "docs: add hackathon retrospective results"
git push
```

Add a final comment to tracking issue #1 summarizing the retrospective:

```bash
gh issue comment 1 --body "## 🏁 Retrospective Complete

Results written to \`docs/results.md\`.

**Quick stats:** X commits, X PRs merged, X/Y issues closed.
**P0:** X/Y | **P1:** X/Y | **P2:** X/Y

**Key learnings:**
- [bullet 1]
- [bullet 2]
- [bullet 3]

See \`docs/results.md\` for full details."
```

Close the tracking issue if not already closed:

```bash
gh issue close 1 2>/dev/null || echo "Issue already closed"
```
````

### 5.6 Create `.claude/agents/tool-researcher.md`

Write the following file to `.claude/agents/tool-researcher.md` — copy the exact content from the plugin's agent definition:

```markdown
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

# Tool Researcher Agent

You are a hackathon tool researcher. Your job is to produce a comprehensive, actionable research report on a sponsor tool so the team can integrate it quickly under extreme time pressure.

## Context

You will receive a tool name and hackathon constraints. Your output is a structured research report that feeds into skill generation, README creation, and Terraform scaffolding.

## Research Dimensions

Investigate each of the following six dimensions. For each dimension, note what you confirmed, what you could not verify, and any blockers.

### 1. API Surface

- **Endpoints**: List the core REST/GraphQL/gRPC endpoints the team will actually use. Focus on CRUD operations relevant to hackathon scope — skip admin/billing endpoints.
- **SDKs**: Official SDKs and their languages. Note which SDK is most mature. Check npm, PyPI, and Go modules.
- **Authentication**: Auth method (API key, OAuth2, JWT, service account). How to obtain credentials. Whether there is a free tier or hackathon-specific access.
- **Rate Limits**: Documented rate limits. Whether the free tier is sufficient for demo-scale usage.
- **Gotchas**: Breaking changes in recent versions, deprecated endpoints, known bugs, surprising behavior. Check GitHub issues and changelogs.

### 2. Onboarding

- **Signup Flow**: Steps from zero to working API key. Note any approval gates, waitlists, or identity verification.
- **Time to Access**: Realistic estimate of how long it takes to get credentials and make a first successful API call.
- **Free Tier / Hackathon Credits**: Limits on the free tier. Whether hackathon-specific credits or elevated limits are available.
- **Team Access**: Can one account be shared, or does each team member need their own?

### 3. Infrastructure as Code (IaC)

- **Terraform Provider**: Does an official or community Terraform provider exist? Link to the registry page.
- **Key Resources**: List the Terraform resource types needed for a minimal integration (e.g., `pinecone_index`, `aws_bedrock_model`).
- **Example Config**: Sketch a minimal `main.tf` that provisions the resource. Include required variables.
- **State Considerations**: Any resources that are slow to create/destroy or have eventual consistency issues.

### 4. Claude Ecosystem

- **MCP Servers**: Search for Model Context Protocol servers that wrap this tool. Check the MCP server registry, GitHub, and npm.
- **Community Skills**: Any existing Claude Code skills or plugins for this tool.
- **Claude Tutorials**: Official or community tutorials showing Claude + this tool.
- **Prompt Patterns**: Known effective prompt patterns for using Claude with this tool's data or API.

### 5. CLI Tools

- **Official CLI**: Does the tool have a CLI? How to install it. Key commands for hackathon use.
- **OpenAPI Spec**: Is there a published OpenAPI/Swagger spec? Link to it. This is gold for generating typed clients.
- **Code Generation**: Can we generate a TypeScript client from the spec?

### 6. Integration Shortcuts

- **Pre-built Connectors**: Zapier, Make, n8n, or other integration platform connectors.
- **Example Apps**: Official quickstart repos, sample apps, or hackathon starter kits.
- **Community Projects**: Notable open-source projects integrating this tool that we can reference.
- **Starter Templates**: Any official or community templates (Next.js, Express, etc.) with this tool pre-configured.

## Output Format

Structure your report exactly as follows:

\```markdown
# Research Report: <Tool Name>

## TL;DR
<2-3 sentences: what this tool does, whether it's hackathon-friendly, and the fastest path to integration.>

## 1. API Surface
<findings>

## 2. Onboarding
<findings>

## 3. Infrastructure as Code
<findings>

## 4. Claude Ecosystem
<findings>

## 5. CLI Tools
<findings>

## 6. Integration Shortcuts
<findings>

## Hackathon Quick Start
<Numbered steps from zero to working integration. Be specific: exact commands, exact URLs, exact config.>

## Red Flags
<Anything that could block or slow the team. Be blunt.>

## Recommended Approach
<Your opinionated recommendation for the fastest, most reliable integration path given hackathon constraints.>
\```

## Research Strategy

1. Start with the tool's official documentation site. Use WebSearch to find it.
2. Check the tool's GitHub org for SDKs, examples, and OpenAPI specs.
3. Search the Terraform Registry for providers.
4. Search npm and GitHub for MCP servers.
5. Check the tool's status page or Twitter for ongoing incidents.
6. If information is conflicting or unclear, note the uncertainty explicitly rather than guessing.

## Constraints

- Optimize for hackathon speed. A working integration in 2 hours beats a perfect architecture in 2 days.
- Prefer official SDKs over raw HTTP calls.
- Prefer managed services over self-hosted.
- If Terraform support is weak or nonexistent, say so — the team can provision manually.
- Always verify that free-tier limits are sufficient for a demo. If not, flag it immediately.
```

### 5.7 Update Directory Creation

Add to the `mkdir` commands in Phase 4.4 (if not already present):

```bash
mkdir -p .claude/commands
mkdir -p .claude/agents
```

These directories were already created in 5.1, but confirming them in Phase 4.4 ensures they exist even if Phase 5 is run independently.

---

## Phase 6: Initial Commit

Stage all generated files and create the initial commit:

```bash
git add -A
git commit -m "feat: initialize hackathon project — {{EVENT_NAME}}

- Tracking issue #1 with phase checklist and checkpoint timeline
- CONTRIBUTING.md with setup instructions
- .claude/CLAUDE.md with project context
- .claude/skills/hackathon-rules and hackathon-sdlc
- .claude/commands/hack, checkpoint, hack-bug, hack-feat, hack-retro for contributors
- .claude/agents/tool-researcher for sponsor tool research
- .env.example with required credentials
- Directory structure for docs, infra, tests, src"

git push -u origin main
```

If the push fails because the remote is empty and needs a branch:

```bash
git push --set-upstream origin main
```

---

## Phase 7: Update Tracking Issue

### 7.1 Check Off Init Complete

Edit the tracking issue body to check off "Init complete":

```bash
# Get current issue body
BODY=$(gh issue view 1 --json body --jq '.body')

# Replace the init checkbox
UPDATED_BODY=$(echo "$BODY" | sed 's/- \[ \] Init complete/- [x] Init complete/')

# Update the issue
gh issue edit 1 --body "$UPDATED_BODY"
```

### 7.2 Add Completion Comment

```bash
gh issue comment 1 --body "## ✅ Init Complete

**What was created:**
- GitHub repo: {{OWNER}}/{{REPO_NAME}}
- GitHub Project board
- Tracking issue #1
- \`.claude/CLAUDE.md\` — project instructions
- \`.claude/skills/hackathon-rules/SKILL.md\` — parsed rules reference
- \`.claude/skills/hackathon-sdlc/SKILL.md\` — development process
- \`.claude/commands/hack.md\` — contributor workflow command
- \`.claude/commands/checkpoint.md\` — progress review command
- \`.claude/commands/hack-bug.md\` — quick bug filing command
- \`.claude/commands/hack-feat.md\` — quick feature idea filing command
- \`.claude/commands/hack-retro.md\` — post-hackathon retrospective command
- \`.claude/agents/tool-researcher.md\` — sponsor tool research agent
- \`CONTRIBUTING.md\` — team onboarding
- \`.env.example\` — credential template
- \`.gitignore\`
- Directory structure: \`docs/plans\`, \`docs/tools\`, \`infra\`, \`test/e2e\`, \`test/fixtures/expected-violations\`, \`src\`

**Credential status:**
{{CREDENTIAL_STATUS_SUMMARY}}

**Next step:** Run \`/hack\` to continue to the next phase."
```

---

## Completion

Present a summary to the user:

> **Init complete!** Here is what was set up:
>
> **Repository:** `{{OWNER}}/{{REPO_NAME}}`
> **Tracking issue:** {{ISSUE_URL}}
> **Project board:** {{PROJECT_URL}}
>
> **Files created:**
> - `.claude/CLAUDE.md`
> - `.claude/skills/hackathon-rules/SKILL.md`
> - `.claude/skills/hackathon-sdlc/SKILL.md`
> - `.claude/commands/hack.md`
> - `.claude/commands/checkpoint.md`
> - `.claude/commands/hack-bug.md`
> - `.claude/commands/hack-feat.md`
> - `.claude/commands/hack-retro.md`
> - `.claude/agents/tool-researcher.md`
> - `CONTRIBUTING.md`
> - `.env.example`
> - `.gitignore`
>
> **Directories created:**
> - `docs/plans/`, `docs/tools/`, `infra/`, `src/`
> - `test/e2e/`, `test/fixtures/expected-violations/`
> - `.claude/skills/`, `.claude/commands/`, `.claude/agents/`
>
> **Outstanding credential setup:**
> {{LIST_ANY_UNVERIFIED_CREDENTIALS}}
>
> Contributors can clone this repo and use `/hack` to pick up work items — no plugin needed.
> Available project commands: `/hack` (pick next issue), `/checkpoint` (progress review), `/hack-bug` (file a bug), `/hack-feat` (file a feature), `/hack-retro` (retrospective)
>
> **Next step:** Run `/hack` to continue to the next phase.

---

## Phase 8: Workspace Setup (Optional)

After the initial commit, offer the workspace pattern:

> **Would you like separate workspaces for coordination and building?**
> This is recommended for teams of 2+ or when you want to keep your director and builder contexts separate.

If the user says yes, invoke skill `hackathoner:workspace-setup`.

If the user says no, continue. This can always be set up later with `/hackprep workspaces`.
