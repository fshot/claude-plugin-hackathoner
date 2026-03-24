---
name: demo-prep
description: Use when preparing the hackathon demo — audits readiness, generates demo script, captures screenshots, records backup video, and packages submission. Triggered by /hack demo.
---

# Demo Prep Skill

Prepares the hackathon demo and packages the final submission. This is the final phase — everything leads to this. Run this after all features are built, tested, and checkpointed.

## Prerequisites

Before running demo prep, verify:

1. All P0 features are implemented and passing tests.
2. Tracking issue #1 exists with feature completion status.
3. You are in the target hackathon project directory (not the plugin repo).
4. Playwright is installed (`pnpm exec playwright install chromium`).

Read the current project state:

```bash
gh issue view 1 --json body --jq '.body'
cat package.json | jq '.scripts'
ls docs/ 2>/dev/null
```

---

## Step 1: Demo Readiness Audit

Run a systematic readiness audit across three tiers. Check each item and report status.

### 1.1 Automated Checks

Run build and test suites first — these are hard blockers:

```bash
pnpm build 2>&1 | tail -20
pnpm test 2>&1 | tail -30
```

If either fails, stop and fix before proceeding. Do not continue with a broken build.

### 1.2 Critical Checklist (Must Pass)

Verify each of these manually. All must be true before demo:

- [ ] **All P0 features working** — exercise each P0 feature end-to-end in the browser. If any fails, fix it now.
- [ ] **No console errors** — open the app in the browser, navigate every key screen, check for JavaScript errors in the console.
- [ ] **Test data loaded** — sample data exists and is displayed correctly in the UI. Run `scripts/seed.sh` or `scripts/seed-demo.sh` if needed.
- [ ] **Demo credentials ready** — all API keys and environment variables are configured for the demo environment. Document them in a secure location.
- [ ] **App accessible** — the app starts cleanly with `pnpm dev` and is reachable at the expected URL (typically `http://localhost:3000`).

### 1.3 Important Checklist (Should Pass)

These affect demo quality but are not hard blockers:

- [ ] **Loading states** — async operations show spinners or skeleton UI, not blank screens.
- [ ] **Error handling** — bad inputs and network failures produce user-friendly messages, not raw stack traces.
- [ ] **Performance** — pages load in under 2 seconds; no visible jank during interactions.

### 1.4 Nice-to-Have Checklist (Polish)

Address these if time permits:

- [ ] **UI polish** — consistent spacing, typography, and colors throughout.
- [ ] **Favicon and meta tags** — custom favicon, page title, og:image set.
- [ ] **Mobile responsive** — key screens render acceptably on a phone-width viewport.

Document the audit results as a comment on tracking issue #1:

```bash
gh issue comment 1 --body "$(cat <<'AUDIT_EOF'
## Demo Readiness Audit

### Automated Checks
- [ ] `pnpm build` — PASS / FAIL
- [ ] `pnpm test` — PASS / FAIL

### Critical (all must pass)
- [ ] All P0 features working
- [ ] No console errors
- [ ] Test data loaded
- [ ] Demo credentials ready
- [ ] App accessible

### Important
- [ ] Loading states present
- [ ] Error handling graceful
- [ ] Performance acceptable

### Nice-to-Have
- [ ] UI polish
- [ ] Favicon and meta tags
- [ ] Mobile responsive

**Overall status:** READY / NOT READY — [summary of any blockers]
AUDIT_EOF
)"
```

Update the checklist items based on actual results before posting.

---

## Step 2: Generate Demo Script

Create a 3-minute demo script optimized for hackathon judging. Pull the scoring rubric and feature list from the tracking issue to tailor the script.

### 2.1 Read Context

```bash
# Get the scoring rubric and feature list
gh issue view 1 --json body --jq '.body'
# Check what features are actually built
git log --oneline --since="$(gh issue view 1 --json createdAt --jq '.createdAt')" | head -30
```

### 2.2 Script Structure

Create `docs/demo/script.md` with this timing structure:

```markdown
# Demo Script — [Project Name]

**Total time:** 3:00
**Presenter:** [name]
**Pre-demo checklist:** App running, test data loaded, browser tabs pre-loaded, screen sharing ready.

---

## Opening Hook (0:00–0:15) — 15 seconds

[One compelling sentence that frames the problem in human terms.]
[One sentence establishing urgency or scale of the problem.]

**Presenter note:** Make eye contact, speak slowly. This sets the tone.

---

## Problem Statement (0:15–0:35) — 20 seconds

[2-3 sentences explaining the specific problem being solved.]
[Who suffers from this problem? What is the current workaround?]

**Presenter note:** Keep this relatable. Judges evaluate problem understanding.

---

## Solution Walkthrough (0:35–2:35) — 2 minutes

### Feature 1: [Name] (0:35–1:05) — 30 seconds

**Show:** [Exact UI action to perform]
**Say:** [What to say while performing the action]
**Backup:** [What to do if this feature fails during demo]

### Feature 2: [Name] (1:05–1:35) — 30 seconds

**Show:** [Exact UI action to perform]
**Say:** [What to say while performing the action]
**Backup:** [What to do if this feature fails during demo]

### Feature 3: [Name] (1:35–2:05) — 30 seconds

**Show:** [Exact UI action to perform]
**Say:** [What to say while performing the action]
**Backup:** [What to do if this feature fails during demo]

### Feature 4: [Name] (2:05–2:35) — 30 seconds

**Show:** [Exact UI action to perform]
**Say:** [What to say while performing the action]
**Backup:** [What to do if this feature fails during demo]

---

## Technical Highlights (2:35–2:55) — 20 seconds

[Which sponsor tools were used and how they integrate.]
[One impressive technical detail — architecture, scale, or novel approach.]

**Presenter note:** Name-drop sponsor tools here. Judges track sponsor prize eligibility.

---

## Closing / Vision (2:55–3:10) — 15 seconds

[One sentence on what's next — scaling, additional features, market potential.]
[End with a strong closer — impact statement or call to action.]

**Presenter note:** End confidently. Smile.

---

## Pre-Load Instructions

Before starting the demo, open these browser tabs in order:

1. [URL] — [description of what's pre-loaded]
2. [URL] — [description of what's pre-loaded]
3. [URL] — [description of what's pre-loaded]

Run these commands:

```bash
# Start the app
pnpm dev

# Seed demo data
./scripts/seed-demo.sh

# Verify everything is up
curl -sf http://localhost:3000/api/health || echo "App not ready"
```

## Backup Plans

| Scenario | Action |
|----------|--------|
| App crashes during demo | Switch to screenshots in slide deck |
| API rate limited | Show pre-recorded video |
| WiFi fails | Use localhost demo (already running) |
| Feature X broken | Skip to Feature Y, mention X in Q&A |
```

Fill in the template using the actual project name, features, and URLs. Prioritize P0 features — they get the most demo time. If there are more than 4 features, combine minor ones or drop P2s.

```bash
mkdir -p docs/demo
```

---

## Step 3: Pre-load Demo State

Create `scripts/seed-demo.sh` to set up the exact demo state. This script should be idempotent — safe to run multiple times.

```bash
#!/usr/bin/env bash
# scripts/seed-demo.sh
#
# Seeds the demo environment with curated data for the hackathon presentation.
# Idempotent — safe to run multiple times.
#
# Usage: ./scripts/seed-demo.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

echo "=== Seeding Demo Environment ==="

# Step 1: Load environment
if [ -f .env ]; then
  set -a; source .env; set +a
fi

# Step 2: Index all test clips / sample data
if [ -d "test/fixtures/sample-data" ]; then
  echo "Loading sample data..."
  # Upload or index sample data files
  # Adjust this based on the project's data pipeline
  for f in test/fixtures/sample-data/*; do
    echo "  Indexing: $(basename "$f")"
    # Add project-specific indexing command here, e.g.:
    # curl -s -X POST http://localhost:3000/api/data -F "file=@$f" > /dev/null
  done
fi

# Step 3: Run analysis pipeline (if applicable)
# This triggers any background processing that needs to complete before demo
# Example:
# curl -s -X POST http://localhost:3000/api/analyze/batch > /dev/null

# Step 4: Populate caches
# Pre-warm any expensive API calls so the demo is snappy
# Example:
# curl -s http://localhost:3000/api/search?q=demo > /dev/null

# Step 5: Set demo user state
# Create a demo user account or set session state
# Example:
# curl -s -X POST http://localhost:3000/api/auth/demo-login > /dev/null

echo "=== Demo Seed Complete ==="
echo ""
echo "Next steps:"
echo "  1. Start the app: pnpm dev"
echo "  2. Open http://localhost:3000"
echo "  3. Verify demo data appears correctly"
```

Make the script executable and customize it for the actual project:

```bash
chmod +x scripts/seed-demo.sh
```

Tailor the indexing, analysis, caching, and user setup steps to match the actual features built. Remove placeholder comments and replace with real commands.

---

## Step 4: Capture Screenshots

Create a Playwright spec that navigates to each key screen and captures full-page screenshots. These screenshots serve as backup visuals for the slide deck and submission.

### `test/e2e/screenshots.spec.ts`

```typescript
// test/e2e/screenshots.spec.ts
//
// Captures full-page screenshots of all key screens for demo materials.
// Run: pnpm exec playwright test test/e2e/screenshots.spec.ts
// Output: docs/demo/*.png

import { test } from "@playwright/test";
import { mkdirSync } from "fs";
import { join } from "path";

const DEMO_DIR = join(__dirname, "../../docs/demo");

test.describe("Demo Screenshots", () => {
  test.beforeAll(() => {
    mkdirSync(DEMO_DIR, { recursive: true });
  });

  test("capture home page", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: join(DEMO_DIR, "01-home.png"),
      fullPage: true,
    });
  });

  test("capture data manager page", async ({ page }) => {
    await page.goto("/data");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: join(DEMO_DIR, "02-data-manager.png"),
      fullPage: true,
    });
  });

  // --- Add one test per key screen ---
  // Follow this pattern for each feature page:
  //
  // test("capture [feature-name] page", async ({ page }) => {
  //   await page.goto("/[route]");
  //   await page.waitForLoadState("networkidle");
  //   // Optionally interact to show a specific state:
  //   // await page.click('[data-testid="demo-button"]');
  //   // await page.waitForTimeout(500);
  //   await page.screenshot({
  //     path: join(DEMO_DIR, "0N-[feature-name].png"),
  //     fullPage: true,
  //   });
  // });

  // Capture the result/output screen — this is usually the most impressive visual
  // test("capture results page", async ({ page }) => {
  //   await page.goto("/results");
  //   await page.waitForLoadState("networkidle");
  //   await page.screenshot({
  //     path: join(DEMO_DIR, "0N-results.png"),
  //     fullPage: true,
  //   });
  // });
});
```

Add specific screenshot tests for every key screen in the application. Customize the routes and interactions based on the actual features built. Screenshots should show the app in its best state — with data loaded and key interactions completed.

Run the screenshots:

```bash
# Ensure Playwright browsers are installed
pnpm exec playwright install chromium

# Start dev server in background
pnpm dev &
DEV_PID=$!
sleep 5

# Seed demo data
./scripts/seed-demo.sh

# Capture screenshots
pnpm exec playwright test test/e2e/screenshots.spec.ts

# Stop dev server
kill $DEV_PID 2>/dev/null || true

# Verify screenshots were captured
ls -la docs/demo/*.png
```

---

## Step 5: Record Backup Video

A backup video ensures the demo can proceed even if the live demo fails. Offer two approaches.

### Option A: Manual Recording (Recommended)

Guide the user through recording with their preferred tool:

1. **QuickTime Player** (macOS): File > New Screen Recording. Select the app window.
2. **OBS Studio** (cross-platform): Set up a Window Capture source pointing at the browser.
3. **Loom** (browser extension): Click record, select browser tab.

Walk through the demo script from Step 2 while recording. Target exactly 3 minutes.

Save the recording to `docs/demo/demo-video.mp4` (or `.mov`/`.webm`).

```bash
echo "=== Backup Video Recording Checklist ==="
echo "1. Open the app at http://localhost:3000"
echo "2. Seed demo data: ./scripts/seed-demo.sh"
echo "3. Pre-load all browser tabs from the demo script"
echo "4. Start screen recording (QuickTime/OBS/Loom)"
echo "5. Follow docs/demo/script.md exactly"
echo "6. Stop recording"
echo "7. Save to docs/demo/demo-video.mp4"
echo "8. Verify: duration ~3 min, audio clear, screens visible"
```

### Option B: Playwright Headed Recording (Automated Fallback)

If manual recording is not feasible, create a Playwright script that performs the demo automatically in a visible browser:

```typescript
// test/e2e/demo-recording.spec.ts
//
// Automated demo walkthrough in headed mode.
// Run: pnpm exec playwright test test/e2e/demo-recording.spec.ts --headed
// Then screen-record the browser window externally.

import { test } from "@playwright/test";

test("automated demo walkthrough", async ({ page }) => {
  test.setTimeout(200_000); // 3+ minutes

  // Home page
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(3000); // Pause for viewer

  // Feature 1 walkthrough
  // await page.goto("/[feature-1-route]");
  // await page.waitForLoadState("networkidle");
  // await page.click('[data-testid="demo-action"]');
  // await page.waitForTimeout(5000);

  // Feature 2 walkthrough
  // ...repeat for each feature...

  // Results page
  // await page.goto("/results");
  // await page.waitForLoadState("networkidle");
  // await page.waitForTimeout(5000);
});
```

Customize the walkthrough steps to match the actual demo script. The `waitForTimeout` calls create natural pauses for viewers.

---

## Step 6: Generate Backup Slide Deck

Create a Marp-compatible markdown slide deck that can serve as a fallback if the live demo fails entirely.

### `docs/demo/slides.md`

```markdown
---
marp: true
theme: default
paginate: true
---

# [Project Name]

**[Tagline — one sentence that captures what it does]**

[Team Name] — [Hackathon Name] [Year]

---

# The Problem

[2-3 bullet points describing the problem]

- **Who:** [target users]
- **Pain:** [specific pain point]
- **Scale:** [how widespread the problem is]

---

# Our Solution: [Project Name]

[1-2 sentences summarizing the approach]

![Screenshot of main feature](./01-home.png)

---

# Feature: [Feature 1 Name]

[One sentence describing what it does and why it matters]

![Screenshot](./02-data-manager.png)

---

# Feature: [Feature 2 Name]

[One sentence describing what it does and why it matters]

![Screenshot](./0N-feature-2.png)

---

# Feature: [Feature 3 Name]

[One sentence describing what it does and why it matters]

![Screenshot](./0N-feature-3.png)

---

# Architecture

```
[Simple ASCII or text diagram showing how components connect]

User -> Next.js Frontend -> API Routes -> [Sponsor Tool 1]
                                       -> [Sponsor Tool 2]
                                       -> [Database / Storage]
```

**Built with:** [list sponsor tools and key technologies]

---

# Impact

- **[Metric 1]:** [quantified result or capability]
- **[Metric 2]:** [quantified result or capability]
- **[Vision]:** [what's next — scaling, market, future features]

---

# Thank You

**[Project Name]** — [tagline]

[Team member names]
[GitHub repo URL]
```

Fill in every slide with the actual project details. Reference screenshots captured in Step 4 — use relative paths from `docs/demo/`. Add or remove feature slides to match the actual features built.

---

## Step 7: Submission Checklist

Work through this comprehensive checklist. Check off each item as it is completed. This covers all typical hackathon submission requirements.

### Code & Repository

- [ ] All code pushed to the remote repository (`git push`)
- [ ] README.md updated with: project description, screenshots, setup instructions, tech stack, team members
- [ ] `.env.example` present with all required environment variables (no real secrets)
- [ ] Build passes: `pnpm build` exits 0
- [ ] Tests pass: `pnpm test` exits 0

### Demo Materials

- [ ] Demo video recorded and uploaded (YouTube unlisted, Loom, or direct upload)
- [ ] Demo video is under 3 minutes
- [ ] Slide deck ready at `docs/demo/slides.md`
- [ ] Screenshots captured in `docs/demo/` directory

### Devpost / Submission Platform

- [ ] Devpost project entry created
- [ ] Project name and tagline filled in
- [ ] Description written (include problem, solution, how it works, challenges, accomplishments, what's next)
- [ ] Demo video URL linked
- [ ] GitHub repository URL linked
- [ ] All team members listed and linked to their Devpost profiles
- [ ] Challenge track(s) selected
- [ ] Sponsor tool usage documented (which tools, how they were used)
- [ ] Screenshots attached to the submission
- [ ] Built-with technologies listed

### Judge Access

- [ ] Demo credentials documented (if judges need to log in)
- [ ] Judge access instructions in README or submission notes
- [ ] App deployed to a public URL (if required) or clear local setup instructions

Verify each item:

```bash
# Check code is pushed
git status
git log --oneline -5

# Check README exists and is non-trivial
wc -l README.md

# Check .env.example exists
test -f .env.example && echo ".env.example exists" || echo "MISSING: .env.example"

# Check build
pnpm build

# Check tests
pnpm test

# Check demo materials
ls -la docs/demo/
test -f docs/demo/script.md && echo "Demo script exists" || echo "MISSING: demo script"
test -f docs/demo/slides.md && echo "Slide deck exists" || echo "MISSING: slide deck"
ls docs/demo/*.png 2>/dev/null | wc -l | xargs -I{} echo "{} screenshots captured"
```

---

## Step 8: Final Tracking Issue Comment and Close

Post a final summary to tracking issue #1 with all deliverable links and project stats, then close the issue.

### 8.1 Gather Stats

```bash
# Count completed features by priority
ISSUE_BODY=$(gh issue view 1 --json body --jq '.body')
P0_DONE=$(echo "$ISSUE_BODY" | grep -c '\- \[x\].*P0' || echo 0)
P0_TOTAL=$(echo "$ISSUE_BODY" | grep -c 'P0' || echo 0)
P1_DONE=$(echo "$ISSUE_BODY" | grep -c '\- \[x\].*P1' || echo 0)
P1_TOTAL=$(echo "$ISSUE_BODY" | grep -c 'P1' || echo 0)
P2_DONE=$(echo "$ISSUE_BODY" | grep -c '\- \[x\].*P2' || echo 0)
P2_TOTAL=$(echo "$ISSUE_BODY" | grep -c 'P2' || echo 0)

# Count total commits
TOTAL_COMMITS=$(git rev-list --count HEAD)

# Count merged PRs
MERGED_PRS=$(gh pr list --state merged --json number --jq 'length')

# Get repo URL
REPO_URL=$(gh repo view --json url --jq '.url')
```

### 8.2 Post Final Summary

```bash
gh issue comment 1 --body "$(cat <<FINAL_EOF
## Hackathon Complete — Final Summary

### Deliverables

| Deliverable | Link |
|-------------|------|
| Repository | ${REPO_URL} |
| Demo Video | [link to uploaded video] |
| Slide Deck | \`docs/demo/slides.md\` |
| Demo Script | \`docs/demo/script.md\` |
| Screenshots | \`docs/demo/*.png\` |

### Stats

| Metric | Count |
|--------|-------|
| P0 Features | ${P0_DONE}/${P0_TOTAL} |
| P1 Features | ${P1_DONE}/${P1_TOTAL} |
| P2 Features | ${P2_DONE}/${P2_TOTAL} |
| Total Commits | ${TOTAL_COMMITS} |
| PRs Merged | ${MERGED_PRS} |

### Team

[List team members and their roles/contributions]

### Demo Instructions

1. Clone the repo: \`git clone ${REPO_URL}\`
2. Install: \`pnpm install\`
3. Copy env: \`cp .env.example .env\` and fill in credentials
4. Seed demo data: \`./scripts/seed-demo.sh\`
5. Start: \`pnpm dev\`
6. Open: http://localhost:3000

---

**Status: SUBMITTED**
FINAL_EOF
)"
```

### 8.3 Close the Tracking Issue

```bash
gh issue close 1 --comment "Hackathon submission complete. All deliverables prepared. Good luck!"
```

---

## Error Handling

- If `pnpm build` fails, fix the build errors before proceeding. Build must pass for submission.
- If `pnpm test` fails, fix failing tests or mark known failures. Document any skipped tests in the submission.
- If Playwright is not installed, install it: `pnpm exec playwright install chromium`. If it still fails, capture screenshots manually and save to `docs/demo/`.
- If screenshot capture fails (e.g., app not running), start the dev server first with `pnpm dev` and retry.
- If the demo video cannot be recorded, rely on the slide deck with screenshots as the backup presentation.
- If the tracking issue cannot be updated (permissions, network), save the summary locally to `docs/demo/final-summary.md`.
- If time is extremely short, prioritize in this order: (1) build passes, (2) demo script exists, (3) screenshots captured, (4) submission checklist complete. Skip video and slides if necessary.
