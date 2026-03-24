---
name: hackathon-storming
description: This skill should be used when the user asks to "brainstorm hackathon ideas", "plan what to build", "figure out what to build", "ideate features for the hackathon", "create hackathon work items", "generate a backlog", "prioritize hackathon features", "storm", wants to decide what to build for a hackathon and assign work to team members, or needs to calibrate against a judging rubric. Runs structured brainstorming producing prioritized GitHub Issues (P0/P1/P2) with assignments, architecture plan, and demo strategy. DO NOT use for brainstorming names, planning schemas, general feature requests, project initialization, or tool research.
---

# Hackathon-Storming Skill

Structured brainstorming that produces a prioritized backlog of assigned GitHub Issues. Every phase builds on the previous — do not skip phases.

**Prerequisites:** The hackathon project must already have:
- A tracking issue (#1) with parsed rules and scoring rubric (from init skill)
- A `hackathon-rules` project skill in `.claude/skills/hackathon-rules/SKILL.md`
- A `team-routing` project skill in `.claude/skills/team-routing/SKILL.md`

---

## Priority Definitions

Use these consistently across all phases:

| Priority | Definition | Rule |
|----------|-----------|------|
| P0 | Demo breaks without this | Must be done before C4 |
| P1 | Bonus points or significant wow factor | Do if P0s on track |
| P2 | Nice-to-have polish | Only if time after P1s |
| P-lagniappe | Above and beyond; the "wow" moment | Only if C4 green, 2-3hrs max, zero guilt if cut |

**Strict ordering:** P0 → P1 → P2 → P-lagniappe. Never start a lower priority while a higher priority is incomplete, unless blocked.

---

## Phase 1: Calibrate Judging Criteria

### 1.1 Load Context

Read the hackathon-rules project skill (`.claude/skills/hackathon-rules/SKILL.md`) to load the scoring rubric, challenge tracks, demo format, timeline, and submission requirements.

### 1.2 Present Scoring Rubric

Present the rubric to the user in a clear table:

> **Scoring Rubric for {{EVENT_NAME}}**
>
> | Criterion | Weight | Description |
> |-----------|--------|-------------|
> | {{CRITERION_1}} | {{WEIGHT_1}} | {{DESCRIPTION_1}} |
> | {{CRITERION_2}} | {{WEIGHT_2}} | {{DESCRIPTION_2}} |
> | ... | ... | ... |

### 1.3 Calibrate with User

Ask the user:

> **Judging calibration:**
>
> 1. **Which criteria should we optimize for?** (Pick 1-2 to over-index on.)
> 2. **Insider knowledge?** Any intel on what judges value that isn't in the rubric? Past winners? Judge backgrounds?
> 3. **Minimum bars?** Any criterion where we just need to be "good enough" rather than exceptional?
> 4. **Challenge track?** Which track(s) are we targeting? (If multiple tracks exist.)

Record the user's answers — these feed into Phase 3 constraints.

---

## Phase 2: Calibrate Build Priorities

Ask the user a series of trade-off questions. Present them as binary or slider choices:

> **Build priority calibration:**
>
> 1. **Creativity vs. Polish:** Would you rather demo something novel but rough, or something polished but predictable?
> 2. **Breadth vs. Depth:** One feature done deeply, or several features shown end-to-end?
> 3. **Demo-ability:** How important is live demo vs. video backup? What's the risk tolerance for live failures?
> 4. **Non-functional requirements:** Do judges care about scalability, security, accessibility, or just "does it work?"
> 5. **Risk tolerance:** Are we going for a moonshot (high risk, high reward) or a reliable win (lower risk, solid execution)?
> 6. **Tech impressiveness vs. Impact story:** Do judges prefer technical depth or a compelling problem/solution narrative?

Record all answers. These shape the brainstorming constraints in Phase 3.

---

## Phase 3: Brainstorm with Constraints

### 3.1 Assemble Constraints

Before brainstorming, gather all constraints into a single brief:

- **Scoring rubric** with user-calibrated weights (from Phase 1)
- **Build priorities** (from Phase 2)
- **Team roster** with strengths and available hours (from team-routing skill)
- **Researched tools** and their capabilities (from tracking issue and tool skills)
- **Timeline** with checkpoint targets (from tracking issue)
- **Demo format** and duration (from hackathon-rules)
- **Submission requirements** (from hackathon-rules)

### 3.2 Run Constrained Brainstorming

Use the superpowers:brainstorming approach with all constraints pre-loaded. The brainstorming session must produce:

1. **Project concept:** One-paragraph elevator pitch. What does this project do and why should judges care?
2. **Feature list with priorities:** Every feature tagged P0/P1/P2/P-lagniappe with justification for the priority level.
3. **Technical approach:** Architecture overview — what components, what data flows, what integrations.
4. **Integration plan:** How each sponsor tool fits in. Which tool does what. Order of integration.
5. **Demo strategy:** What the 3-minute demo shows, in what order, to maximize rubric scores.

### 3.3 Review with User

Present the brainstorming output and ask:

> **Does this concept and feature list look right?**
>
> - Any features to add, cut, or re-prioritize?
> - Does the demo strategy hit the criteria we're optimizing for?
> - Any technical concerns with the approach?
> - Ready to generate work items?

Iterate until the user approves. Do not proceed to Phase 4 without explicit approval.

---

## Phase 4: Generate Work Items

### 4.0 Feature Zero

**Feature Zero is always the first P0 issue created.** If the project involves test data, sample data, or any form of ground truth validation, Feature Zero is the test data manager — the mechanism to upload, preview, tag, and manage test data.

Even if the project doesn't have an obvious test data component, Feature Zero is the "proof of life" — the minimal end-to-end integration that proves the scaffold works, data flows, and the team can ship.

### 4.1 Create GitHub Issues

For each work item from the brainstorming output, create a GitHub Issue:

```bash
gh issue create \
  --title "{{PRIORITY}}: {{TITLE}}" \
  --assignee "{{GITHUB_USERNAME}}" \
  --label "{{PRIORITY_LABEL}},{{TYPE_LABEL}},{{COMPONENT_LABEL}}" \
  --body "$(cat <<'ISSUE_BODY'
## Description

{{DESCRIPTION}}

## Acceptance Criteria

- [ ] {{CRITERION_1}}
- [ ] {{CRITERION_2}}
- [ ] {{CRITERION_3}}

## Technical Notes

{{TECHNICAL_NOTES}}

## Priority

**{{PRIORITY}}** — {{PRIORITY_JUSTIFICATION}}

## Checkpoint Target

**{{CHECKPOINT}}** ({{CHECKPOINT_TIME}})

## Estimated Effort

{{EFFORT_ESTIMATE}} hours

## Dependencies

{{DEPENDENCIES_OR_NONE}}

ISSUE_BODY
)"
```

### 4.2 Issue Structure Requirements

Every issue must include:

| Field | Description |
|-------|-------------|
| **Title** | Prefixed with priority: `P0: ...`, `P1: ...`, etc. |
| **Description** | What to build and why it matters for the demo |
| **Acceptance criteria** | Checkboxes. Concrete, testable conditions. |
| **Technical notes** | Implementation hints, API endpoints, relevant skill references |
| **Priority** | P0/P1/P2/P-lagniappe with justification tied to rubric |
| **Checkpoint target** | Which checkpoint (C0-C7) this must be done by |
| **Estimated effort** | Hours estimate for planning |
| **Dependencies** | Other issues that must be done first, or "None" |

### 4.3 Labels

Create labels if they don't exist, then apply:

**Priority labels:**
- `P0` (color: `#d73a4a` red)
- `P1` (color: `#e4e669` yellow)
- `P2` (color: `#0075ca` blue)
- `P-lagniappe` (color: `#7057ff` purple)

**Type labels:**
- `feature`, `infrastructure`, `integration`, `test-data`, `demo`, `polish`

**Component labels** (project-specific):
- Create based on the architecture from brainstorming (e.g., `frontend`, `api`, `pipeline`, `infra`)

```bash
# Create priority labels (skip if they already exist)
gh label create "P0" --color "d73a4a" --description "Demo breaks without this" --force
gh label create "P1" --color "e4e669" --description "Bonus points or wow factor" --force
gh label create "P2" --color "0075ca" --description "Nice-to-have polish" --force
gh label create "P-lagniappe" --color "7057ff" --description "Above and beyond, only if C4 green" --force

# Create type labels
gh label create "feature" --color "a2eeef" --force
gh label create "infrastructure" --color "d4c5f9" --force
gh label create "integration" --color "f9d0c4" --force
gh label create "test-data" --color "c5def5" --force
gh label create "demo" --color "bfdadc" --force
gh label create "polish" --color "fef2c0" --force
```

### 4.4 Assignment

Use the team-routing project skill (`.claude/skills/team-routing/SKILL.md`) to assign each issue:

- Match issue requirements to team member strengths
- Balance load across team members based on available hours
- Ensure no one person is bottlenecked with all P0s
- Each issue is assigned to exactly one person

### 4.5 Summary

After all issues are created, present a summary table:

> **Work items created:**
>
> | # | Title | Priority | Assignee | Checkpoint | Effort |
> |---|-------|----------|----------|------------|--------|
> | {{ISSUE_NUM}} | {{TITLE}} | {{PRIORITY}} | @{{ASSIGNEE}} | {{CHECKPOINT}} | {{EFFORT}}h |

---

## Phase 4.5: Lagniappe Discussion

After all P0/P1/P2 work items are created, discuss stretch goals:

> **Lagniappe (stretch goals):**
>
> These are "above and beyond" items. Rules:
> - Maximum 2-3 hours investment
> - Only start if C4 checkpoint is green (all P0s done)
> - Zero guilt if cut — they are explicitly optional
> - Should produce a "wow moment" in the demo
>
> **Proposed lagniappe items:**
> 1. {{LAGNIAPPE_1}} — {{WHY_ITS_WOW}}
> 2. {{LAGNIAPPE_2}} — {{WHY_ITS_WOW}}
> 3. {{LAGNIAPPE_3}} — {{WHY_ITS_WOW}}
>
> Which (if any) should we create issues for?

Create P-lagniappe issues for any the user approves.

---

## Phase 5: Commit Architecture Plan

### 5.1 Write Architecture Plan

Create `docs/plans/YYYY-MM-DD-HHMM-architecture.md` using the current timestamp:

```markdown
---
issue: "#1"
phase: "hackathon-storming"
---

# Architecture Plan: {{PROJECT_CONCEPT_NAME}}

## Concept

{{ONE_PARAGRAPH_ELEVATOR_PITCH}}

## Architecture

{{ARCHITECTURE_OVERVIEW}}

### Component Diagram

{{TEXT_BASED_COMPONENT_DIAGRAM}}

### Data Flow

{{DATA_FLOW_DESCRIPTION}}

## Feature Map

| # | Feature | Priority | Checkpoint | Assignee | Integration |
|---|---------|----------|------------|----------|-------------|
| {{ISSUE_NUM}} | {{FEATURE}} | {{PRIORITY}} | {{CHECKPOINT}} | @{{ASSIGNEE}} | {{TOOLS_USED}} |

## Integration Plan

| Order | Tool | Purpose | Integrated By | Checkpoint |
|-------|------|---------|--------------|------------|
| 1 | {{TOOL}} | {{PURPOSE}} | @{{ASSIGNEE}} | {{CHECKPOINT}} |

## Demo Strategy

### Demo Flow (3 minutes)

| Time | What to Show | Rubric Criterion | Notes |
|------|-------------|-----------------|-------|
| 0:00-0:30 | {{OPENING}} | {{CRITERION}} | {{NOTES}} |
| 0:30-1:30 | {{CORE_DEMO}} | {{CRITERION}} | {{NOTES}} |
| 1:30-2:30 | {{ADVANCED}} | {{CRITERION}} | {{NOTES}} |
| 2:30-3:00 | {{CLOSING}} | {{CRITERION}} | {{NOTES}} |

### Key Talking Points

- {{POINT_1}}
- {{POINT_2}}
- {{POINT_3}}
```

### 5.2 Commit and Push

```bash
git add docs/plans/*-architecture.md
git commit -m "docs(plan): architecture plan from hackathon-storming

- Project concept and architecture overview
- Feature map with priorities and assignments
- Integration plan for sponsor tools
- Demo strategy mapped to scoring rubric"

git push
```

---

## Phase 6: Update Tracking Issue

### 6.1 Check Off Storming

Edit the tracking issue body to mark storming as complete:

```bash
BODY=$(gh issue view 1 --json body --jq '.body')
UPDATED_BODY=$(echo "$BODY" | sed 's/- \[ \] Hackathon-storming done/- [x] Hackathon-storming done/')
gh issue edit 1 --body "$UPDATED_BODY"
```

### 6.2 Add Comment with Issue Breakdown

```bash
gh issue comment 1 --body "$(cat <<'COMMENT'
## ✅ Hackathon-Storming Complete

### Concept
{{ONE_LINE_CONCEPT}}

### Issue Breakdown

| Priority | Count | Issues |
|----------|-------|--------|
| P0 | {{P0_COUNT}} | {{P0_ISSUE_REFS}} |
| P1 | {{P1_COUNT}} | {{P1_ISSUE_REFS}} |
| P2 | {{P2_COUNT}} | {{P2_ISSUE_REFS}} |
| P-lagniappe | {{LAGNIAPPE_COUNT}} | {{LAGNIAPPE_ISSUE_REFS}} |

### Architecture Plan
Committed: `docs/plans/{{PLAN_FILENAME}}`

### Scoring Strategy
{{BRIEF_DESCRIPTION_OF_HOW_WE_SCORE_WELL}}

### Next Step
Run `/hack` to begin scaffold phase.
COMMENT
)"
```

Replace all `{{PLACEHOLDER}}` values with actual data.

---

## Error Handling

- **No hackathon-rules skill:** Stop and tell the user to run `/hack` first to complete init.
- **No team-routing skill:** Warn the user, proceed without assignments. Create issues unassigned and note that `/hack team` should be run to assign them.
- **Label creation fails:** Labels may already exist. Use `--force` flag to handle idempotently.
- **Issue creation fails:** Log the error, continue with remaining issues, report failures at the end.
- **User wants to re-storm:** This skill is idempotent — existing issues are not duplicated. If re-running, ask whether to close existing storming issues first or add to them.

---

## Example Usage

```
/hack storm
```

This will:
1. Load the scoring rubric and calibrate with the user
2. Calibrate build priorities through trade-off questions
3. Run constrained brainstorming producing concept, features, architecture, and demo strategy
4. Create GitHub Issues for every work item (Feature Zero first)
5. Assign issues to team members based on strengths
6. Discuss and optionally create lagniappe stretch goals
7. Commit architecture plan to `docs/plans/`
8. Update the tracking issue with storming completion and issue breakdown
