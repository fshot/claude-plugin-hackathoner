---
title: "Hackathoner Plugin Design"
created: 2026-03-24
status: approved
repo: fshot/claude-plugin-hackathoner
---

# Hackathoner: Claude Code Plugin for Hackathon Execution

## Overview

A Claude Code plugin that structures and optimizes hackathon projects. It encodes a methodology for compressed-timeline development: research sponsor tools, assemble project-specific skills, route tasks across a team, enforce checkpoints, and prepare a winning demo.

The plugin operates at two levels:
- **System-level skills** (reusable across any hackathon): the machines that build the machines
- **Project-level skills** (generated per-hackathon): working knowledge Claude uses during development

## Core Philosophy

- Humans design, Claude builds. Maximize human time on architecture, testing, and refinement.
- Spec-driven development. No code without an approved plan.
- Bias to action. `/hack` with no args picks up the next task and goes.
- Feature Zero: if test data matters, the test data manager is the first deliverable.
- Plans committed before implementation. Timestamped to the minute: `docs/plans/YYYY-MM-DD-HHMM-<description>.md`

## Plugin Structure

```
claude-plugin-hackathoner/
├── .claude-plugin/
│   └── plugin.json
├── commands/
│   └── hack.md                       # Single entry point: /hack [phase] [args]
├── skills/
│   ├── init/SKILL.md                 # Repo, creds, tracking issue, CONTRIBUTING.md
│   ├── research-tool/SKILL.md        # Probe sponsor tool → generate project skill
│   ├── team-inventory/SKILL.md       # Roster, strengths, routing rules
│   ├── hackathon-storming/SKILL.md   # Brainstorming wrapper with hackathon constraints
│   ├── scaffold/SKILL.md             # Stubs, mocks, test harnesses, Feature Zero, IaC
│   ├── checkpoint/SKILL.md           # Timeline enforcement, scope cuts
│   ├── sample-data/SKILL.md          # Test data curation, ground truth, validation
│   └── demo-prep/SKILL.md            # Recording, slides, submission packaging
├── agents/
│   └── tool-researcher.md            # Deep-dive research agent for sponsor tools
├── hooks/
│   └── hooks.json                    # SessionStart: load state, show next phase
└── scripts/
    └── session-init.sh               # Check tracking issue, display status
```

## Project-Level Output

```
hackathon-project/
├── .claude/
│   ├── CLAUDE.md                     # Project instructions (generated)
│   └── skills/
│       ├── hackathon-rules/SKILL.md  # Parsed rules, rubric, timeline
│       ├── team-routing/SKILL.md     # Roster + assignment heuristics
│       ├── hackathon-sdlc/SKILL.md   # Spec-driven dev process
│       └── <tool-name>/SKILL.md      # Per-tool integration guides (one per researched tool)
├── CONTRIBUTING.md                   # Teammate onboarding with config validation
├── docs/
│   ├── plans/                        # Timestamped plan files
│   └── tools/<tool-name>/
│       ├── README.md                 # Human-audience onboarding
│       ├── main.tf                   # IaC if applicable
│       └── variables.tf
├── infra/                            # Composed Terraform root module
├── test/
│   ├── e2e/                          # Playwright E2E tests
│   └── fixtures/
│       └── expected-violations/      # Ground truth for validation
└── ...                               # Actual project code
```

## State Management

State lives in a **GitHub Issue** (the tracking issue, always issue #1):
- Phase checklist in the issue body (edited as phases complete)
- Team roster table
- Sponsor tools table
- Checkpoint timeline
- Test data coverage matrix
- Comments as activity log (phase completions, checkpoint reviews, scope cuts)

## The /hack Command

Single entry point. Behavior depends on state:

```
/hack (no args)
  ├─ No state exists?
  │   └─ Prompt for hackathon rules (URL, file, paste)
  │   └─ Parse rules → seed tracking issue → proceed to init
  │
  ├─ Prep phases incomplete?
  │   └─ Resume next incomplete prep phase
  │
  ├─ All prep done, no work items?
  │   └─ Run hackathon-storming → generate issues
  │
  └─ Work items exist, prep complete?
      ├─ Detect current user (git config → GitHub username)
      ├─ Check: does next issue have an approved plan?
      │   ├─ No → Generate plan, commit to main, wait for approval
      │   └─ Yes → Create worktree, execute plan
      ├─ Build → verify → PR
      └─ Loop: /hack picks next issue

/hack research <tool>    # Research a specific tool
/hack team               # Run team inventory
/hack storm              # Run hackathon-storming
/hack scaffold           # Run scaffold phase
/hack checkpoint         # View/run checkpoint review
/hack data               # Manage test data
/hack demo               # Demo preparation
```

## Phases

### 1. Rules Parsing (automatic on first /hack)
- Accept hackathon rules via URL, file path, or pasted text
- Extract: event basics, challenge tracks, required tech, scoring rubric, timeline, demo format, resources provided, submission requirements
- Flag unspecified details humans should ask organizers about
- Generate hackathon-rules project skill
- Seed tracking issue with structured data

### 2. Init
- Create GitHub repo (or use existing)
- Create GitHub Project board (Backlog, Ready, In Progress, Review, Done)
- Create tracking issue #1 with phase checklist
- Enable GitHub Discussions for team comms (configurable)
- Walk through scoped credential creation (GitHub PAT 7-day expiry, AWS IAM user)
- Verify credentials work
- Generate CONTRIBUTING.md with prerequisites, workflow, config validation checklist
- Generate .claude/CLAUDE.md with project context and tech stack defaults
- Set up .gitignore, .env.example, docs/plans/
- Initial commit and push

### 3. Research (per sponsor tool)
- Spawn tool-researcher agent to probe six dimensions:
  - API surface (endpoints, SDKs, auth, rate limits, gotchas)
  - Onboarding (signup flow, approval gates, time to access)
  - IaC (Terraform providers, resource configs)
  - Claude ecosystem (MCP servers, community skills, Claude tutorials)
  - CLI tools (official CLI, OpenAPI specs, CLI generation candidates)
  - Integration shortcuts (pre-built connectors, example apps to fork)
- Generate project-level skill: .claude/skills/<tool>/SKILL.md
- Generate human-audience README: docs/tools/<tool>/README.md
- Generate Terraform fragments: docs/tools/<tool>/main.tf (if applicable)
- Update CONTRIBUTING.md config validation with new tool checks
- Update tracking issue: mark tool as researched

### 4. Team Inventory
- Collect per-member: GitHub username, strengths, gaps, known tools, available hours, comms handle, environment
- Update tracking issue roster
- Generate team-routing project skill with assignment heuristics
- Update CONTRIBUTING.md with team section

### 5. Hackathon-Storming
- Phase 1: Calibrate judging criteria from parsed rules
- Phase 2: Calibrate priorities (creativity vs polish vs scale; NFRs; demo-ability)
- Phase 3: Invoke brainstorming with all constraints pre-loaded (rubric, team, tools, timeline)
- Phase 4: Generate work items as GitHub Issues (P0/P1/P2 + P-lagniappe)
  - Assign based on team-routing
  - Label with priority, type, component
  - Map to checkpoints
- Phase 4.5: Lagniappe discussion (2-3hr max, only if C4 is green, zero guilt if cut)
- Phase 5: Commit architecture plan to docs/plans/, push to main

### 6. Scaffold
- Generate project structure (Next.js / pnpm / TypeScript / Tailwind / shadcn)
- Generate stubs and mocks for each chosen integration
- Generate dependency injection container (USE_MOCKS=true for local dev)
- Compose Terraform root module from research fragments
- Generate LocalStack docker-compose for local AWS
- Generate dev scripts (env-from-terraform, env-local, dev server)
- Generate smoke test
- Feature Zero: test data manager page (upload, preview, tag clips in S3)
- Commit scaffold to main

### 7. Build (checkpoint-driven)
- /hack loop: pick issue → check for plan → generate/approve plan → worktree → build → verify → PR
- Checkpoint enforcement at each milestone
- Scope cut protocol when behind schedule
- P0 before P1 before P2. P-lagniappe only if C4 is green.
- No new features after C5.

### 8. Demo Prep
- Demo readiness audit (all P0 working, no errors, test data populated)
- Generate 3-minute demo script from rubric and features built
- Pre-load demo state (seed script to index clips and run analysis)
- Capture screenshots via Playwright
- Record backup video
- Generate backup slide deck from screenshots
- Submission packaging checklist
- Final tracking issue comment with all submission links

## Checkpoint Timeline Template

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

## Priority Framework

| Priority | Definition | Rule |
|----------|-----------|------|
| P0 | Demo breaks without this | Must be done before C4 |
| P1 | Bonus points or significant wow factor | Do if P0s on track |
| P2 | Nice-to-have polish | Only if time after P1s |
| P-lagniappe | Above and beyond; the "wow" moment | Only if C4 green, 2-3hrs max, zero guilt if cut |

## Tech Stack

The scaffold skill does NOT hardcode a tech stack. It reads the hackathon rules (required tech), research artifacts (sponsor tool SDKs), and architecture plan (storming output) to determine the right stack for each project. Common stacks include:

- **Web app:** Node.js/TypeScript/Next.js/pnpm or Python/FastAPI/uv
- **Agent system:** Python/Google ADK/uv or TypeScript/LangChain/pnpm
- **Infrastructure:** Terraform, Docker Compose, Cloud Run, Vercel — whatever the project needs

Fixed across all projects:
- State: GitHub Issues + Projects
- Comms: GitHub Discussions (configurable)
- Process: Plan-driven, TDD, checkpoint-enforced

## SDLC Process

1. Every work item has a plan file committed to main before implementation starts
2. Plan format: docs/plans/YYYY-MM-DD-HHMM-<description>.md with frontmatter linking to issue, assignee, checkpoint
3. Implementation happens in worktrees branched from main (after plan is merged)
4. Superpowers skills enforced: brainstorming for design, writing-plans for specs, TDD for implementation, verification-before-completion before PRs
5. PRs reference the plan file
6. Humans review PRs; Claude runs tests and verification

## Credential Scoping

- GitHub PAT: repo + issues + projects scope, 7-day expiry, stored in .env (gitignored)
- AWS: dedicated IAM user for hackathon, scoped policy, access key in .env
- Semi-automated: plugin walks through creation, verifies, does not store credentials in plugin state
- CONTRIBUTING.md documents exact creation steps with CLI examples
- Config validation script verifies all credentials work

## Test Data Architecture

- Video clips stored in S3 bucket (not repo)
- Manifest JSON tracks clips with metadata, expected violations, tags, purpose
- Ground truth files enable precision/recall/F1 validation
- Test data manager page (Feature Zero) is the upload/preview UI AND the product's ingest UI
- GitHub Issue tracks test data coverage progress
- Sample data skill analyzes challenge requirements and suggests sourcing strategy

## Team Routing

- Roster collected during team-inventory, stored in tracking issue and team-routing project skill
- GitHub Issues assigned to exactly one person based on strengths
- /hack detects current user via git config, picks their highest priority unblocked issue
- "In-progress" label + comment when issue is picked up
- Multi-laptop, multi-worktree safe: assignment = single owner, no conflicts
