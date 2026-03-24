---
name: scaffold
description: Use when generating the hackathon project's code structure — reads project context to pick the right stack, then generates stubs, mocks, dev scripts, and Feature Zero. Triggered by /hackprep scaffold.
---

# Scaffold Skill

Generates the hackathon project's technical foundation. Unlike a fixed template, this skill reads the project context and adapts to whatever stack the team chose.

## Prerequisites

Before running scaffold, verify:

1. Tracking issue #1 exists with populated sponsor tools table
2. Tool research artifacts exist in `.claude/skills/` and `docs/tools/`
3. Hackathon-storming output exists with architecture decisions
4. You are in the target hackathon project directory

## Step 1: Gather Context

Read all available project context to determine what to scaffold:

```bash
# Tracking issue for overall state
gh issue view 1 --json body --jq '.body'

# Architecture plan from storming
cat docs/plans/*architecture* 2>/dev/null || cat docs/plans/*storming* 2>/dev/null

# Research skills for each tool
for skill in .claude/skills/*/SKILL.md; do echo "=== $skill ==="; head -20 "$skill"; done

# Hackathon rules for tech requirements
cat .claude/skills/hackathon-rules/SKILL.md 2>/dev/null
```

From this context, determine:

| Decision | Source |
|----------|--------|
| **Language/runtime** | Architecture plan, hackathon rules (required tech) |
| **Package manager** | Language conventions (pnpm for Node, uv for Python, cargo for Rust, etc.) |
| **Framework** | Architecture plan (Next.js, FastAPI, ADK, Flask, Express, etc.) |
| **Sponsor tool SDKs** | Research skills (each tool's recommended SDK/client library) |
| **Infrastructure** | Research skills (cloud providers, IaC needs) |
| **Testing framework** | Language conventions (vitest/jest for TS, pytest for Python, etc.) |
| **Feature Zero** | Architecture plan (what proves the stack works end-to-end) |

Present a summary to the user:

> **Scaffold plan based on project context:**
>
> - **Stack:** [language] + [framework] + [package manager]
> - **Sponsor tools:** [list with SDK choices]
> - **Infrastructure:** [IaC approach, local dev strategy]
> - **Testing:** [framework]
> - **Feature Zero:** [what it is]
>
> Does this look right? Any changes before I scaffold?

Wait for confirmation before proceeding.

## Step 2: Initialize Project Structure

Based on the determined stack, initialize the project. Use the standard project creation tool for the chosen framework:

- **Node.js/Next.js:** `pnpm create next-app` or `npm create vite`
- **Python:** `uv init` + `pyproject.toml` setup
- **Python ADK:** Google ADK project structure with `agent.py`, `__init__.py`
- **Rust:** `cargo init`
- **Go:** `go mod init`
- **Other:** Create a minimal project structure appropriate for the framework

Install the testing framework, sponsor tool SDKs, and any other dependencies identified in Step 1.

If the directory already has files from init, merge carefully — don't overwrite `.claude/`, `docs/`, `CONTRIBUTING.md`, or `.gitignore`.

## Step 3: Stubs and Mocks for Sponsor Tools

For each sponsor tool, create an integration module with:

1. **Real client** — imports the official SDK, reads credentials from env vars, implements the key API calls identified during research. Can be a stub that throws "not yet implemented" for methods not yet needed.

2. **Mock client** — returns realistic fake data matching the tool's response shapes. Read the tool's research skill for API response formats.

3. **Switching mechanism** — a way to toggle between real and mock at runtime. The pattern depends on the language:
   - **TypeScript:** barrel `index.ts` that checks `USE_MOCKS` env var
   - **Python:** factory function or env-var check in `__init__.py`
   - **Other:** whatever is idiomatic

The file layout should follow the language's conventions:
- **TypeScript:** `src/lib/<tool>/client.ts`, `mock.ts`, `index.ts`
- **Python:** `src/<tool>/client.py`, `mock.py`, `__init__.py`
- **Other:** adapt accordingly

## Step 4: Dependency Injection / Service Container

Create a central place to resolve all tool clients. This makes it easy to swap mocks in tests and keeps imports clean.

- **TypeScript:** `src/lib/container.ts` with lazy async getters
- **Python:** simple module-level factory functions or a container class
- **Other:** whatever is idiomatic for the framework

## Step 5: Infrastructure

Based on the research artifacts, generate infrastructure configuration:

### If Terraform is appropriate:
- `infra/main.tf` — root module composing fragments from `docs/tools/*/main.tf`
- `infra/variables.tf` — all required variables with defaults
- `infra/outputs.tf` — values needed by the application

### If Docker Compose is needed:
- `docker-compose.yml` for local services (LocalStack, databases, etc.)

### If the project uses a managed platform (Cloud Run, Vercel, etc.):
- Deployment config (`Dockerfile`, `app.yaml`, `vercel.json`, etc.)
- Include comments pointing to the relevant research skill for deploy instructions

### Always:
- `.env.example` with all required env vars (no values, just keys with comments)

## Step 6: Dev Scripts

Create executable scripts for common development tasks. Adapt to the project's stack:

| Script | Purpose |
|--------|---------|
| `scripts/dev.sh` | Start the full local dev stack (services + app) |
| `scripts/seed.sh` | Seed local dev data |
| `scripts/env-local.sh` | Set env vars for local development (mock mode) |

If the project uses Terraform:
| `scripts/env-from-terraform.sh` | Extract Terraform outputs into .env format |

Make all scripts executable: `chmod +x scripts/*.sh`

## Step 7: Smoke Test

Create a smoke test that validates the scaffold is wired correctly:

- All tool clients can be imported without error
- Mock switching works (mock mode returns data, real mode throws without credentials)
- The service container resolves all clients
- The dev server starts (if applicable)

Use the project's testing framework. Run the smoke test and fix any issues before proceeding.

## Step 8: Feature Zero

Feature Zero is always the first P0 — the smallest thing that proves the full stack works end-to-end. What it is depends on the project:

- **Web app:** A data manager page (upload, preview, tag) with API routes and mock storage
- **Agent system:** A minimal agent that responds to a test prompt using a mock tool
- **Pipeline:** A minimal ingest → process → output flow with mock data
- **API:** A health endpoint + one real endpoint with mock data

Read the architecture plan to determine what Feature Zero should be. Create the initial stub — enough to run and see something working, not a complete implementation.

## Step 9: Run Smoke Test

Execute the smoke test:

```bash
# Adapt to the project's test runner
# Node: pnpm test test/smoke.test.ts
# Python: uv run pytest tests/test_smoke.py
# etc.
```

Fix any failures in a loop until passing.

## Step 10: Commit and Push

```bash
git add -A
git commit -m "feat: scaffold project structure, mocks, dev scripts, Feature Zero

- [stack description]
- Stub and mock clients for each sponsor tool
- Dev scripts for local development
- Feature Zero: [description]
- Smoke test passing"

git push
```

## Step 11: Update Tracking Issue

Check off scaffold in the tracking issue and add a completion comment listing:
- What stack was scaffolded
- What sponsor tool integrations were stubbed
- What Feature Zero is
- How to run locally (one-liner)
- Link to smoke test results

## Error Handling

- If the project creation tool fails because the directory is not empty, use a temp directory and merge
- If a sponsor tool has no SDK, create a raw HTTP client using the language's standard library
- If no infrastructure is needed, skip Step 5 entirely
- If Docker is not available, note it and skip container-based local services
- If the smoke test fails after 3 fix attempts, commit what works and note failures in the tracking issue
