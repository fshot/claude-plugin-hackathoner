---
name: checkpoint
description: This skill should be used when the user asks "how are we doing", "are we on track", "check our progress", "run a checkpoint", "status check", "progress report", "should we cut scope", "are we behind schedule", mentions being worried about the hackathon timeline, wants to know what is done vs at risk, or asks about P0/P1 issue status during a hackathon. Reviews elapsed time against checkpoint targets (C0-C7), presents a status dashboard, and triggers scope cuts when behind. DO NOT use for creating issues, brainstorming, debugging, PR reviews, or deployment.
---

# Checkpoint Skill

Reviews hackathon progress against the timeline, enforces checkpoint discipline, triggers scope cuts when behind schedule, and updates tracking state. Run this periodically (every 2-3 hours minimum) or whenever you suspect the team is falling behind.

## Checkpoint Timeline

All offsets are relative to "hacking starts" time recorded in the tracking issue.

| Checkpoint | Offset | Target | Exit Criteria |
|------------|--------|--------|---------------|
| C0 | +0h | Hacking starts | Scaffold committed, Feature Zero assigned, tracking issue live |
| C1 | +3h | Feature Zero working | Feature Zero demo-able with mock data, mock pipeline wired end-to-end |
| C2 | +7h | One real integration | At least one sponsor tool using real credentials (not mocks), demo-able with one clip |
| C3 | +11h | Core pipeline E2E | Core pipeline runs end-to-end with real integrations, 3+ clips/items processed |
| C4 | +19h | All P0 closed | Every P0 issue closed, full test data set processed successfully |
| C5 | +23h | Polish complete | P1 done or cut, polish pass done, all tests green, no open P0 or P1 |
| C6 | +24.5h | Demo ready | Demo recording done, backup slides ready, submission draft prepared |
| C7 | +25.5h | Submission | Code frozen, submission submitted, no further changes |

---

## Step 1: Determine Current Checkpoint

Read the tracking issue to find the hacking start time, then compute which checkpoint window we are in.

```bash
# Get the tracking issue body
ISSUE_BODY=$(gh issue view 1 --json body --jq '.body')
echo "$ISSUE_BODY"
```

Look for a line in the tracking issue body matching one of these patterns:
- `Hacking starts: <ISO datetime or natural language time>`
- `Start time: <datetime>`
- A field in a metadata table with the start time

Parse the start time and compute the elapsed hours:

```bash
# Example: parse start time and compute elapsed hours
# Adjust the grep/parse logic based on actual tracking issue format
START_TIME=$(gh issue view 1 --json body --jq '.body' | grep -i 'hacking starts\|start time' | head -1)
echo "Start time line: $START_TIME"
echo "Current time: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
```

Calculate elapsed hours from start time to now. Map to the current checkpoint:

| Elapsed Hours | Current Checkpoint Window |
|---------------|--------------------------|
| 0-3h | C0 -> C1 |
| 3-7h | C1 -> C2 |
| 7-11h | C2 -> C3 |
| 11-19h | C3 -> C4 |
| 19-23h | C4 -> C5 |
| 23-24.5h | C5 -> C6 |
| 24.5-25.5h | C6 -> C7 |
| >25.5h | Past deadline |

Report: "We are **X hours** into the hackathon. Current checkpoint window: **C{N} -> C{N+1}**. Target for C{N+1}: {target description}."

---

## Step 2: Status Assessment

Gather current project state using `gh` CLI and present a dashboard.

### 2.1 Collect Metrics

```bash
# Open P0 issues
gh issue list --label "P0" --state open --json number,title --jq '.[] | "  #\(.number) \(.title)"'

# Open P1 issues
gh issue list --label "P1" --state open --json number,title --jq '.[] | "  #\(.number) \(.title)"'

# Open P2 issues
gh issue list --label "P2" --state open --json number,title --jq '.[] | "  #\(.number) \(.title)"'

# Open pull requests
gh pr list --state open --json number,title,isDraft --jq '.[] | "  #\(.number) \(.title) \(if .isDraft then "(draft)" else "" end)"'

# Closed issues (progress indicator)
gh issue list --state closed --json number,title --jq '. | length'

# Total open issues
gh issue list --state open --json number --jq '. | length'
```

### 2.2 Check Test Status

```bash
# Run tests if a test command exists (check package.json or Makefile)
# For Node projects:
if [ -f package.json ]; then
  pnpm test 2>&1 | tail -20
fi

# For Python projects:
if [ -f pyproject.toml ]; then
  uv run pytest --tb=short 2>&1 | tail -20
fi
```

### 2.3 Check Demo Readiness

Look for demo artifacts:

```bash
# Check for demo recording
ls -la demo.* recording.* *.mp4 *.mov 2>/dev/null || echo "No demo recording found"

# Check for slides
ls -la slides.* presentation.* *.pptx *.pdf 2>/dev/null || echo "No slides found"

# Check if submission draft exists
ls -la SUBMISSION* submission* DEVPOST* 2>/dev/null || echo "No submission draft found"
```

### 2.4 Present Dashboard

Format the dashboard as follows. Use status indicators based on whether targets are met:

- GREEN: On track or ahead of schedule for current checkpoint
- YELLOW: Slightly behind but recoverable without scope cuts
- RED: Behind schedule, scope cuts needed

```
## Checkpoint Status Dashboard

**Elapsed:** Xh Ym | **Window:** C{N} -> C{N+1} | **Target:** {description}

| Metric              | Target          | Actual          | Status |
|---------------------|-----------------|-----------------|--------|
| Open P0s            | 0 by C4         | {count}         | {G/Y/R}|
| Open P1s            | 0 by C5         | {count}         | {G/Y/R}|
| Open PRs            | 0 (merged)      | {count}         | {G/Y/R}|
| Tests               | All passing     | {pass/fail}     | {G/Y/R}|
| Issues closed       | {expected}      | {actual}        | {G/Y/R}|
| Demo recording      | Done by C6      | {yes/no}        | {G/Y/R}|
| Submission draft    | Done by C6      | {yes/no}        | {G/Y/R}|

### Open P0 Issues
{list or "None - all clear"}

### Open P1 Issues
{list or "None - all clear"}

### Open PRs
{list or "None"}
```

Status assignment rules:
- **P0 count:** GREEN if 0, YELLOW if <= 2 and before C4, RED if > 2 or past C4
- **P1 count:** GREEN if 0, YELLOW if <= 3 and before C5, RED if > 3 or past C5
- **Tests:** GREEN if all pass, YELLOW if < 3 failures, RED if >= 3 failures or no tests exist
- **Demo:** GREEN if done, YELLOW if before C5, RED if past C5 and not done

### 2.5 Story Check

Append this to every checkpoint output (C1 through C5):

> **Story check:** Can you explain what you've built and why it matters in 30 seconds?

At **C3**, also append:

> **Slides check:** Have you started your slides? If not, now is the time. Not at the deadline.

At **C5**, also append:

> **Demo recording check:** Demo recording should happen NOW. Schedule 45 minutes. Make it a team activity — one person drives, one narrates, one watches for rough spots.

---

## Step 3: Scope Cut Protocol

If any metric is RED, or if the team is behind the current checkpoint target, initiate scope cuts.

### 3.1 Identify Blockers

For each open P0 and overdue item, determine:
1. What is blocking it?
2. How many hours of work remain?
3. Is it on the critical path for the demo?

```bash
# Get details on open P0s including comments for context
gh issue list --label "P0" --state open --json number,title,body,comments --jq '.[] | "--- #\(.number) \(.title) ---\n\(.body)\n"'
```

### 3.2 Propose Cuts (in priority order)

Cut in this order — always sacrifice the lowest-value work first:

1. **P-lagniappe (nice-to-have extras):** Cut immediately, close issues with "cut: out of time" label.
2. **P2 features:** Cut next. These are "nice for demo but not critical."
3. **P1 features:** Cut reluctantly. Evaluate each: does it strengthen the demo narrative?
4. **P0 scope reduction (LAST RESORT):** Simplify P0 features — e.g., reduce "process 10 file types" to "process 3 file types," replace a real integration with a convincing mock.

For each proposed cut, present:

```
### Proposed Scope Cuts

| Issue | Priority | Action | Rationale | Time Saved |
|-------|----------|--------|-----------|------------|
| #N    | P2       | CUT    | Not in demo flow | ~2h |
| #M    | P1       | CUT    | Polish item, demo works without it | ~1.5h |
| #K    | P0       | REDUCE | Simplify from X to Y | ~3h |
```

### 3.3 Reassignment Options

If some tasks are blocked by dependencies, propose reordering:
- Can a blocked P0 be unblocked by pairing on the dependency first?
- Can a P0 be split into a smaller "demo-able" slice and a "full implementation" follow-up?
- Should the team context-switch to demo prep while waiting for a blocker?

### 3.4 Get Approval

Present cuts to the user and wait for explicit approval before executing. Do NOT auto-cut.

After approval, for each cut issue:

```bash
# Close cut issues with a label
gh issue close {NUMBER} --comment "Scope cut at checkpoint C{N}. Reason: {rationale}"
gh issue edit {NUMBER} --add-label "cut"
```

### 3.5 Post-C5 Rule: NO NEW FEATURES

After checkpoint C5 (+23h), enforce a strict rule:

- **NO new feature work.** Close or defer any open feature issues.
- **ONLY allow:** bug fixes, test fixes, demo polish, copy/text improvements, documentation.
- If someone proposes a new feature after C5, respond: "We are past C5. No new features. Focus on demo, polish, and submission."

---

## Step 4: Update Tracking Issue

After completing the checkpoint review, update the tracking issue with the results.

### 4.1 Update Checkpoint Status in Issue Body

Look for a checkpoint status section in the tracking issue body. If it exists, update it. If not, append one.

```bash
ISSUE_BODY=$(gh issue view 1 --json body --jq '.body')

# Check if checkpoint table exists; if not, we'll add it
if echo "$ISSUE_BODY" | grep -q 'Checkpoint Status'; then
  echo "Checkpoint table exists — update in place"
else
  echo "No checkpoint table — will append"
fi
```

The checkpoint status section should look like:

```markdown
## Checkpoint Status

| Checkpoint | Target Time | Status | Notes |
|------------|-------------|--------|-------|
| C0 | {time} | DONE | Scaffold committed |
| C1 | {time} | DONE | Feature Zero working |
| C2 | {time} | IN PROGRESS | Working on first integration |
| C3 | {time} | PENDING | |
| C4 | {time} | PENDING | |
| C5 | {time} | PENDING | |
| C6 | {time} | PENDING | |
| C7 | {time} | PENDING | |
```

Update the body with the current checkpoint status:

```bash
# Build updated body with checkpoint table
# Use gh issue edit to update
gh issue edit 1 --body "$UPDATED_BODY"
```

### 4.2 Add Checkpoint Review Comment

Post a comment summarizing the checkpoint review:

```bash
gh issue comment 1 --body "$(cat <<EOF
## Checkpoint Review: C{N} (+{X}h {Y}m)

**Status:** {ON TRACK / BEHIND / AT RISK}

### Dashboard
| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Open P0s | ... | ... | ... |
| Open P1s | ... | ... | ... |
| Tests | ... | ... | ... |
| Demo | ... | ... | ... |

### Scope Changes
{List any cuts made, or "No changes"}

### Next Target
C{N+1} at +{offset}h: {target description}

### Action Items
- {List specific next steps}
EOF
)"
```

---

## Error Handling

- If the tracking issue (#1) does not exist, warn the user and ask them to run `/hack init` first.
- If no hacking start time is found in the tracking issue, ask the user to provide it and update the issue.
- If `gh` commands fail (auth, network), report the error and provide a manual assessment template the user can fill in.
- If tests cannot be run (missing dependencies, build errors), mark test status as YELLOW with note "tests not runnable" and flag it as an action item.
- If the elapsed time is past C7 (+25.5h), report "PAST DEADLINE" and focus the review on submission status only.
