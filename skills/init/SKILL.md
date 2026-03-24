---
name: init
description: Use when initializing a new hackathon project — creates repo, tracking issue, CONTRIBUTING.md, CLAUDE.md, and project structure. Triggered by /hack when no tracking issue exists.
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

## Phase Checklist

- [x] Rules parsed
- [ ] Init complete
- [ ] Team inventory done
- [ ] Tools researched
- [ ] Hackathon-storming done
- [ ] Scaffold committed
- [ ] Feature Zero working
- [ ] Build phase (checkpoint-driven)
- [ ] Demo prep done
- [ ] Submitted

## Scoring Rubric

| Criterion | Weight | Our Strategy |
|-----------|--------|-------------|
| {{CRITERION_1}} | {{WEIGHT_1}} | _TBD after storming_ |
| {{CRITERION_2}} | {{WEIGHT_2}} | _TBD after storming_ |
| {{CRITERION_3}} | {{WEIGHT_3}} | _TBD after storming_ |
| {{CRITERION_4}} | {{WEIGHT_4}} | _TBD after storming_ |

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

### 2.4 Optionally Enable GitHub Discussions

Ask the user:

> Would you like to enable GitHub Discussions for team communication? (y/n)

If yes:

```bash
gh repo edit {{OWNER}}/{{REPO_NAME}} --enable-discussions
```

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

## Project Context

This is a hackathon project for **{{EVENT_NAME}}** ({{DATES}}).
Hackathon duration: {{DURATION}} hours.

## Tech Stack

- Runtime: Node.js
- Package manager: pnpm
- Language: TypeScript (strict)
- Frontend: Next.js on Vercel, Tailwind CSS, shadcn/ui
- IaC: Terraform
- Local cloud: LocalStack for AWS services
- Testing: Vitest (unit), Playwright (E2E)
- State: GitHub Issues + Projects

## Development Process

- **Spec-driven:** No code without an approved plan in `docs/plans/`.
- **Plan format:** `docs/plans/YYYY-MM-DD-HHMM-<description>.md`
- **Branching:** Worktrees from main. PR back to main.
- **Priorities:** P0 > P1 > P2 > P-lagniappe. P0 must be done before C4.
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

Replace all placeholders with actual values from the parsed rules.

### 4.2 Generate CONTRIBUTING.md

```markdown
# Contributing to {{EVENT_NAME}}

## Prerequisites

- [ ] Node.js 20+
- [ ] pnpm 9+
- [ ] GitHub CLI (`gh`) authenticated
- [ ] Terraform 1.5+ (if using IaC)
- [ ] Docker (for LocalStack)
- [ ] Claude Code CLI

## Getting Started

1. Clone the repo:
   ```bash
   gh repo clone {{OWNER}}/{{REPO_NAME}}
   cd {{REPO_NAME}}
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up credentials:
   ```bash
   cp .env.example .env
   # Fill in your credential values — see sections below
   ```

4. Verify your setup:
   ```bash
   source .env
   gh api user --jq '.login'
   # Verify each tool credential as described below
   ```

5. Start developing:
   ```bash
   pnpm dev
   ```

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
```

### 4.4 Create Directory Structure

```bash
mkdir -p .claude/skills
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

## Phase 5: Initial Commit

Stage all generated files and create the initial commit:

```bash
git add -A
git commit -m "feat: initialize hackathon project — {{EVENT_NAME}}

- Tracking issue #1 with phase checklist and checkpoint timeline
- CONTRIBUTING.md with setup instructions
- .claude/CLAUDE.md with project context
- .claude/skills/hackathon-rules and hackathon-sdlc
- .env.example with required credentials
- Directory structure for docs, infra, tests, src"

git push -u origin main
```

If the push fails because the remote is empty and needs a branch:

```bash
git push --set-upstream origin main
```

---

## Phase 6: Update Tracking Issue

### 6.1 Check Off Init Complete

Edit the tracking issue body to check off "Init complete":

```bash
# Get current issue body
BODY=$(gh issue view 1 --json body --jq '.body')

# Replace the init checkbox
UPDATED_BODY=$(echo "$BODY" | sed 's/- \[ \] Init complete/- [x] Init complete/')

# Update the issue
gh issue edit 1 --body "$UPDATED_BODY"
```

### 6.2 Add Completion Comment

```bash
gh issue comment 1 --body "## ✅ Init Complete

**What was created:**
- GitHub repo: {{OWNER}}/{{REPO_NAME}}
- GitHub Project board
- Tracking issue #1
- \`.claude/CLAUDE.md\` — project instructions
- \`.claude/skills/hackathon-rules/SKILL.md\` — parsed rules reference
- \`.claude/skills/hackathon-sdlc/SKILL.md\` — development process
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
> - `CONTRIBUTING.md`
> - `.env.example`
> - `.gitignore`
>
> **Directories created:**
> - `docs/plans/`, `docs/tools/`, `infra/`, `src/`
> - `test/e2e/`, `test/fixtures/expected-violations/`
> - `.claude/skills/`
>
> **Outstanding credential setup:**
> {{LIST_ANY_UNVERIFIED_CREDENTIALS}}
>
> **Next step:** Run `/hack` to continue to the next phase.
