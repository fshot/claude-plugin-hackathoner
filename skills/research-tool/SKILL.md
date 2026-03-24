---
name: research-tool
description: Use when researching a hackathon sponsor tool — spawns tool-researcher agent, generates project skill, README, and Terraform fragments. Triggered by /hack research <tool>.
---

# Research Tool Skill

Orchestrates end-to-end research of a hackathon sponsor tool. Dispatches the `tool-researcher` agent for deep investigation, then generates all project-level artifacts from the findings.

## Inputs

- `tool_name` (required): Name of the sponsor tool to research (e.g., "pinecone", "supabase", "cloudflare-workers").
- `hackathon_constraints` (optional): Any specific constraints like timeline, tier, or focus area.

## Workflow

### Step 1: Spawn Tool Researcher Agent

Dispatch the `tool-researcher` agent with:
- The tool name
- Any hackathon-specific constraints (timeline, free tier requirements, team size)
- Instruction to produce the full structured research report

Wait for the agent to return its research report before proceeding.

### Step 2: Generate Project-Level Skill

Create `.claude/skills/<tool-name>/SKILL.md` in the hackathon project repo with:

```yaml
---
name: <tool-name>
description: Integration guide for <tool-name>. Auth patterns, API usage, TypeScript examples, and gotchas.
---
```

The skill body must include:
- **Authentication**: How to authenticate. Environment variable names. Example config.
- **Core API Patterns**: The 3-5 API calls the project will actually use, with TypeScript examples.
- **TypeScript Examples**: Copy-pasteable code snippets for common operations. Use the official SDK if one exists.
- **Error Handling**: Common error codes and how to handle them.
- **Gotchas**: Anything surprising from the research report's Red Flags section.
- **Rate Limits**: What the team needs to stay within.

### Step 3: Generate Human README

Create `docs/tools/<tool-name>/README.md` in the hackathon project repo with:

- **What**: One-paragraph description of the tool and why we're using it.
- **Why**: How it fits into our hackathon project architecture.
- **Setup**: Step-by-step instructions to get credentials and configure local dev.
- **Quick Start**: Minimal code example that proves the integration works.
- **Links**: Official docs, dashboard, status page.

### Step 4: Generate Terraform Fragments (if applicable)

If the research report indicates Terraform support exists, create in the hackathon project repo:

**`docs/tools/<tool-name>/main.tf`**:
- Provider configuration
- Minimal resource definitions for hackathon use
- Output values the application needs (URLs, IDs, etc.)

**`docs/tools/<tool-name>/variables.tf`**:
- Required variables (API keys, project names, regions)
- Sensible defaults where possible
- Descriptions explaining each variable

If no Terraform provider exists, skip this step and note it in the README.

### Step 5: Update CONTRIBUTING.md

Append to the project's `CONTRIBUTING.md` a config validation section for this tool:

```markdown
### <Tool Name> Setup Validation

Run these checks to verify your <tool-name> configuration:

- [ ] Environment variable `<TOOL>_API_KEY` is set
- [ ] `<command to verify connectivity>` returns success
- [ ] <Any other tool-specific checks>
```

If `CONTRIBUTING.md` doesn't exist yet, create it with a header and the validation section.

### Step 6: Update Tracking Issue

Update the GitHub tracking issue (issue #1):
- Mark the tool as "researched" in the sponsor tools table
- Add a comment summarizing:
  - Tool researched
  - Artifacts generated (list file paths)
  - Red flags or blockers identified
  - Recommended integration approach

### Step 7: Commit and Push

Stage all generated files and commit:

```
feat(research): add <tool-name> integration artifacts

- Project skill: .claude/skills/<tool-name>/SKILL.md
- Tool README: docs/tools/<tool-name>/README.md
- Terraform fragments (if applicable)
- Updated CONTRIBUTING.md with config validation
```

Push to the current branch.

## Error Handling

- If the tool-researcher agent cannot find sufficient documentation, generate partial artifacts and flag gaps explicitly in the README and skill file.
- If Terraform provider doesn't exist, skip Step 4 and document manual provisioning steps instead.
- If the tracking issue doesn't exist yet, warn the user and skip Step 6.
- If the commit fails (e.g., no changes), report what happened and why.

## Example Usage

```
/hack research pinecone
```

This will:
1. Research Pinecone's API, SDKs, onboarding, IaC, Claude ecosystem, and integration shortcuts
2. Generate `.claude/skills/pinecone/SKILL.md` with auth patterns and TypeScript examples
3. Generate `docs/tools/pinecone/README.md` with setup instructions
4. Generate `docs/tools/pinecone/main.tf` and `variables.tf` (Pinecone has a Terraform provider)
5. Update `CONTRIBUTING.md` with Pinecone config validation checks
6. Update the tracking issue
7. Commit and push all artifacts
