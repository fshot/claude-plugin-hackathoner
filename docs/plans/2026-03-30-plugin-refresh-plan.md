# Hackathoner Plugin Refresh — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refresh the hackathoner plugin with storytelling, presentation skills, workspace guidance, identity config, agent attribution, autonomous mode, README, and repo cleanup — all lessons from the TwelveLabs hackathon.

**Architecture:** All changes are to markdown skill files, one JSON config, and one gitignore. No runtime code. The plugin is a collection of Claude Code skills, commands, and agents. Each task modifies or creates one file (occasionally two when a skill + command route are coupled).

**Tech Stack:** Markdown (skill files), JSON (plugin.json), shell (gitignore)

**Design doc:** `docs/plans/2026-03-30-plugin-refresh-design.md`

---

### Task 1: Rename `hackathon-storming` → `hackathon-brainstorming`

**Files:**
- Rename: `skills/hackathon-storming/SKILL.md` → `skills/hackathon-brainstorming/SKILL.md`
- Modify: `commands/hackprep.md`
- Modify: `docs/design.md`

**Step 1: Create new directory and move skill file**

```bash
cd /Users/fshot/code/fshot/claude-plugin-hackathoner
mkdir -p skills/hackathon-brainstorming
mv skills/hackathon-storming/SKILL.md skills/hackathon-brainstorming/SKILL.md
rmdir skills/hackathon-storming
```

**Step 2: Update skill frontmatter**

In `skills/hackathon-brainstorming/SKILL.md`, change:
- `name: hackathon-storming` → `name: hackathon-brainstorming`
- Update description: replace "storm" with "brainstorm" throughout
- Replace all instances of "Hackathon-Storming" with "Hackathon-Brainstorming" in the body
- Replace all instances of "hackathon-storming" with "hackathon-brainstorming" in the body

**Step 3: Update hackprep.md routing table**

In `commands/hackprep.md`:
- Change `| storm | hackathoner:hackathon-storming |` → `| brainstorm | hackathoner:hackathon-brainstorming |`
- Update the argument-hint in frontmatter: replace `storm` with `brainstorm`
- Update the unknown phase error message to list `brainstorm` instead of `storm`
- Update Phase Checklist parsing: `Hackathon-storming` → `Hackathon-brainstorming`
- Update auto-detect routing table: `hackathon-storming` → `hackathon-brainstorming`

**Step 4: Update design.md**

In `docs/design.md`:
- Replace all instances of `hackathon-storming` with `hackathon-brainstorming`
- Replace all instances of `storm` (as a command arg) with `brainstorm`

**Step 5: Verify no remaining references**

```bash
grep -r "storming" --include="*.md" .
```

Should return zero results (except possibly the design doc's historical context, which is fine to update too).

**Step 6: Commit**

```bash
git add -A
git commit -m "refactor: rename hackathon-storming to hackathon-brainstorming"
```

**Verification:** `grep -r "hackathon-storming" --include="*.md" .` returns no results. `ls skills/hackathon-brainstorming/SKILL.md` exists.

---

### Task 2: Add storytelling prompts to existing skills

**Files:**
- Modify: `skills/team-inventory/SKILL.md`
- Modify: `skills/hackathon-brainstorming/SKILL.md`
- Modify: `skills/checkpoint/SKILL.md`
- Modify: `skills/scaffold/SKILL.md`

**Step 1: Add domain experience prompt to team-inventory**

In `skills/team-inventory/SKILL.md`, after the workflow completes (after the roster is finalized and before generating the team-routing skill), add a new section:

```markdown
### Step 2.5: Domain Experience Check

After finalizing the roster, print this advisory:

> **Domain experience check:** Does anyone on this team have *lived experience* with the problem you're solving? Teams with real domain expertise consistently outperform those building for theoretical users. If no one on the team has felt this pain firsthand, consider pivoting to a problem someone knows.

This is advisory only — do not block progress. Print it and continue.
```

**Step 2: Add storytelling prompt to hackathon-brainstorming**

In `skills/hackathon-brainstorming/SKILL.md`, at the beginning of Phase 3 (Design Discussion), before generating concept options, add:

```markdown
### 3.0 Story-First Framing

Before designing solutions, ask the user:

> **Before we design:** Who is the person this tool is for? Not a persona — a real human with a name and a job title. What's their struggle today? How does solving it change their life? The winning demo tells *their* story, not yours.

Wait for the user's answer. Use their response to anchor the concept options in Phase 3.1.
```

**Step 3: Add auto-generated presentation issues to hackathon-brainstorming**

In `skills/hackathon-brainstorming/SKILL.md`, in Phase 5 (Generate Work Items), after generating the user's feature issues, add:

```markdown
### 5.5 Presentation Work Items

If the hackathon includes a presentation, demo, or pitch component (check the parsed rules), auto-generate these two P1 issues:

**Issue: "Assemble presentation slides"**
- Priority: P1
- Checkpoint target: C3
- Description: "Build a slide deck that tells the user's story. Start with the problem (who hurts, why), then the journey (how their life changes), then the solution. Use docs/demo/slides.md (Marp format). Screenshots can be added later. The story matters more than the formatting."
- Label: `presentation`

**Issue: "Record demo video"**
- Priority: P1
- Checkpoint target: C5
- Description: "Record a polished screenshare + voiceover demo. Script it first (docs/demo/video-script.md), rehearse once, then record with margin. Make this a team activity — one person drives, one narrates, one watches for rough spots. Do NOT leave this for the final 15 minutes."
- Label: `presentation`

If the hackathon format is unclear about presentations, generate the issues anyway but add a note: "Recommended even if not required — the winning teams always have slides."
```

**Step 4: Add storytelling prompts to checkpoint**

In `skills/checkpoint/SKILL.md`, at the end of Step 2 (status assessment), before the scope cut protocol, add:

```markdown
### 2.5 Story Check

Append this to every checkpoint output (C1 through C5):

> **Story check:** Can you explain what you've built and why it matters in 30 seconds?

At **C3**, also append:

> **Slides check:** Have you started your slides? If not, now is the time. Not at the deadline.

At **C5**, also append:

> **Demo recording check:** Demo recording should happen NOW. Schedule 45 minutes. Make it a team activity — one person drives, one narrates, one watches for rough spots.
```

**Step 5: Add storytelling prompt to scaffold**

In `skills/scaffold/SKILL.md`, at the end of the final step (after Feature Zero is committed), add:

```markdown
### Post-Scaffold Story Check

After Feature Zero is committed and the scaffold is complete, print:

> **You now have something that works end-to-end.** Before you build more: could you demo this to a judge and explain why it matters? If the story isn't clear yet, that's fine — but keep it in mind as you build. Every feature should serve the narrative.

This is advisory only — do not block progress.
```

**Step 6: Commit**

```bash
git add skills/team-inventory/SKILL.md skills/hackathon-brainstorming/SKILL.md skills/checkpoint/SKILL.md skills/scaffold/SKILL.md
git commit -m "feat: add storytelling prompts to team, brainstorming, checkpoint, and scaffold skills"
```

**Verification:** Read each modified file and confirm the new sections are present and don't break the existing flow. The prompts should be advisory, not blocking.

---

### Task 3: Create `slide-assembly` skill

**Files:**
- Create: `skills/slide-assembly/SKILL.md`

**Step 1: Write the skill file**

Create `skills/slide-assembly/SKILL.md`:

```markdown
---
name: slide-assembly
description: Use when building presentation slides for a hackathon demo. Generates a Marp-compatible slide deck from the architecture plan and brainstorming output. Triggered by the auto-generated "Assemble presentation slides" issue or /hackprep slides.
---

# Slide Assembly Skill

Generates a presentation slide deck that tells the user's story. Not a feature list. Not a tech stack diagram. A narrative about how someone's life gets better.

## Prerequisites

1. Architecture plan exists in `docs/plans/`
2. Brainstorming output exists (from hackathon-brainstorming skill)
3. You are in the target hackathon project directory

Read the context:

```bash
gh issue view 1 --json body --jq '.body'
ls docs/plans/*.md
```

---

## Step 1: Extract the Story

Read the architecture plan and brainstorming output. Extract:

- **The hero:** Who is this tool for? (From the story-first framing in brainstorming)
- **The struggle:** What's their pain today?
- **The journey:** How does this tool change their life?
- **The features:** Which features serve the story? (P0s first, then P1s)
- **The tech:** Architecture highlights (keep brief)

If the story-first framing wasn't captured during brainstorming, ask the user now:

> Who is the person this tool is for? What's their struggle? How does solving it change their life?

---

## Step 2: Generate Slide Deck

Create `docs/demo/slides.md` in Marp-compatible markdown format:

```markdown
---
marp: true
theme: default
paginate: true
---

# [Project Name]
## [One-line tagline that describes the user's transformation]

---

# The Problem

[Who hurts. Why. How bad. Use a specific example, not an abstraction.
If possible, name a real role: "broadcast compliance officers at mid-market streaming platforms"
not "content moderators."]

---

# The Journey

[How your user's life changes when they use this tool.
Before → After. Be specific about time saved, errors prevented, decisions improved.]

---

# [Feature 1 Name]

[Screenshot placeholder or description]

[One sentence: what this does for the user (not what it does technically)]

---

# [Feature 2 Name]

[Screenshot placeholder or description]

[One sentence: what this does for the user]

---

# [Feature 3 Name] (if applicable)

[Screenshot placeholder or description]

[One sentence: what this does for the user]

---

# Under the Hood

[Architecture diagram or brief tech stack description.
Keep this to ONE slide. Judges care less about this than you think.]

---

# What's Next

[Where this goes after the hackathon. What's the vision?
End with an ask if appropriate.]
```

Customize the content using the extracted story elements. Replace placeholders with real content where available.

---

## Step 3: Capture Screenshots (if app is running)

If the development server is running, capture screenshots for the feature slides:

```bash
# Check if dev server is running
curl -s http://localhost:3000 > /dev/null 2>&1
```

If running, use Playwright to capture full-page screenshots of key screens. Save to `docs/demo/screenshots/`.

If not running, leave screenshot placeholders in the slides and print:

> Screenshots not captured — dev server isn't running. Run your app and re-run `/hackprep slides` to add them, or add them manually.

---

## Step 4: Remind

Print:

> **Slides generated at `docs/demo/slides.md`.**
>
> These are a draft. The story matters more than the formatting.
>
> To preview: `npx @marp-team/marp-cli docs/demo/slides.md --preview`
>
> Practice telling it out loud. If you can't explain each slide in 15 seconds, simplify it.

---

## Step 5: Commit

```bash
git add docs/demo/slides.md docs/demo/screenshots/ 2>/dev/null
git commit -m "feat: add presentation slides"
```
```

**Step 2: Commit**

```bash
git add skills/slide-assembly/SKILL.md
git commit -m "feat: add slide-assembly skill — Marp slide deck generation"
```

**Verification:** `cat skills/slide-assembly/SKILL.md` shows valid frontmatter with name and description. The skill references docs/plans and brainstorming output correctly.

---

### Task 4: Create `demo-videography` skill

**Files:**
- Create: `skills/demo-videography/SKILL.md`

**Step 1: Write the skill file**

Create `skills/demo-videography/SKILL.md`:

```markdown
---
name: demo-videography
description: Use when recording a demo video for a hackathon submission. Generates a timed demo script, sets up recording environment, and guides the team through a polished screenshare + voiceover capture. Triggered by the auto-generated "Record demo video" issue or /hackprep video.
---

# Demo Videography Skill

Records a polished demo video. This is a team activity, not a solo scramble at the deadline.

**Schedule this at C5 at the latest.** If you're reading this at C7, you're already in trouble.

## Prerequisites

1. P0 features are working (check with `/hackprep checkpoint`)
2. Demo data is loaded (seed script or manual setup)
3. You are in the target hackathon project directory

---

## Step 1: Generate Demo Script

Create `docs/demo/video-script.md` with a timed walkthrough.

Read the hackathon rules for demo time limits. If specified, structure the script to fit within the limit with 30 seconds of margin.

```markdown
# Demo Script

**Total time target:** [X minutes] (limit: [Y minutes from rules])

## Opening (30 seconds)
- **Say:** "[One sentence: the problem this solves for a real person]"
- **Show:** Landing page / hero screen
- **Transition:** "Let me show you how it works."

## Feature 1: [Name] (60 seconds)
- **Show:** [Exact clicks/navigation path]
- **Say:** "[What the user sees and why it matters]"
- **Watch for:** [Known rough spots or loading times]

## Feature 2: [Name] (60 seconds)
- **Show:** [Exact clicks/navigation path]
- **Say:** "[What the user sees and why it matters]"
- **Watch for:** [Known rough spots or loading times]

## Feature 3: [Name] (45 seconds)
- **Show:** [Exact clicks/navigation path]
- **Say:** "[What the user sees and why it matters]"

## Closing (15 seconds)
- **Say:** "[One sentence summary. What's the vision?]"
- **Show:** Return to landing page or results screen

## Known Issues to Avoid
- [List any brittle flows, slow loads, or error-prone paths]
- [Workarounds for each]
```

Populate the script using the architecture plan, feature list, and any known issues from the issue tracker.

---

## Step 2: Pre-Load Demo State

Check if a seed script exists:

```bash
ls scripts/seed-demo.sh 2>/dev/null || ls scripts/seed.sh 2>/dev/null
```

If it exists, run it. If not, create `scripts/seed-demo.sh` that sets up the exact demo state:

- Loads sample data
- Triggers any processing pipelines
- Waits for results to be ready

The seed script must be idempotent — safe to run multiple times.

---

## Step 3: Recording Setup Guide

Print the recording guide:

> **Recording Setup:**
>
> **Tool options:**
> - QuickTime Player (macOS, free, reliable): File → New Screen Recording
> - OBS Studio (cross-platform, free): Scene with Display Capture + Audio Input
> - Loom (browser extension, easy sharing): loom.com
>
> **Before recording:**
> 1. Set screen resolution to 1920x1080 (or 1280x720 for smaller file)
> 2. Close all notifications (Do Not Disturb / Focus mode)
> 3. Close unnecessary browser tabs and apps
> 4. Position the app window to fill most of the screen
> 5. Open the demo script in a second display or printed copy
>
> **Team roles (if 2+ people):**
> - **Driver:** Controls the mouse and keyboard. Follows the script exactly.
> - **Narrator:** Does the voiceover. Reads from the script, adapts naturally.
> - **Spotter:** Watches for mistakes, timing issues, rough spots. Calls for retakes.
>
> **Recording tips:**
> - Do a dry run first without recording
> - Start recording 5 seconds before you begin talking
> - If you make a mistake, pause, then restart that section cleanly (edit later)
> - Speak slightly slower than normal
> - End recording 5 seconds after you finish

---

## Step 4: Record

> **Ready to record?**
>
> 1. Start your recording tool
> 2. Run through the demo script
> 3. Save the recording to `docs/demo/`
>
> If the recording is longer than the time limit, note which sections to trim.

If the hackathon format doesn't require a video submission, print:

> Your hackathon may not require a video, but recording one is still recommended as a backup. If your live demo crashes, you'll be glad you have it.

---

## Step 5: Verify

After recording, check:

```bash
ls -la docs/demo/*.{mp4,mov,webm} 2>/dev/null
```

Print the file size and duration (if determinable). If the file is over 100MB, suggest compression:

> Recording is [X]MB. If you need to upload it, consider compressing:
> `ffmpeg -i docs/demo/recording.mov -c:v libx264 -crf 28 docs/demo/recording-compressed.mp4`

---

## Step 6: Commit

```bash
# Don't commit large video files to git — just the script
git add docs/demo/video-script.md scripts/seed-demo.sh 2>/dev/null
git commit -m "feat: add demo script and seed"
```

Print:

> **Demo video script and seed committed.** The video file itself should be uploaded directly to your submission platform, not committed to git.
```

**Step 2: Commit**

```bash
git add skills/demo-videography/SKILL.md
git commit -m "feat: add demo-videography skill — recording guide and script generation"
```

**Verification:** `cat skills/demo-videography/SKILL.md` shows valid frontmatter. References to seed scripts and demo directory are consistent with demo-prep skill.

---

### Task 5: Create `workspace-setup` skill

**Files:**
- Create: `skills/workspace-setup/SKILL.md`

**Step 1: Write the skill file**

Create `skills/workspace-setup/SKILL.md`:

```markdown
---
name: workspace-setup
description: Use when setting up separate director and builder workspaces for a hackathon project. Clones the repo into manage and work directories for parallel Claude Code sessions. Triggered by /hackprep workspaces or offered during init.
---

# Workspace Setup Skill

Sets up two separate checkouts of the same repo for parallel Claude Code sessions: one for coordination (director) and one for building (builder). Both share the same remote.

## Why Two Workspaces?

Running coordination (checkpoints, issue triage, PR review, slides) and building (feature implementation in worktrees) in the same Claude Code session muddies the context. The director accumulates project management context. The builder accumulates implementation context. Keeping them separate means each session stays focused.

This is optional. Solo hackers or small teams may prefer a single workspace. No judgment.

---

## Step 1: Ask

If invoked from init, the user has already been asked. If invoked directly, ask:

> **Would you like separate workspaces for coordination and building?**
>
> This gives you two terminals:
> - **`<project>-manage`** — Director. Triage issues, run checkpoints, review PRs, build slides, record demos.
> - **`<project>-work`** — Builder. Run `/hack` to pick up tasks. Implementation happens in worktrees.
>
> Both share the same remote. Pushes from either land in the same repo.
>
> Want me to set this up? (y/n)

If no, print "No problem. Single workspace works fine." and stop.

---

## Step 2: Clone

Determine the repo URL and current directory:

```bash
REPO_URL=$(git remote get-url origin)
PROJECT_NAME=$(basename $(pwd))
PARENT_DIR=$(dirname $(pwd))
```

Clone into two directories:

```bash
git clone "$REPO_URL" "${PARENT_DIR}/${PROJECT_NAME}-manage"
git clone "$REPO_URL" "${PARENT_DIR}/${PROJECT_NAME}-work"
```

If the directories already exist, skip cloning and print:

> Directories already exist. Pulling latest instead.

```bash
cd "${PARENT_DIR}/${PROJECT_NAME}-manage" && git pull
cd "${PARENT_DIR}/${PROJECT_NAME}-work" && git pull
```

---

## Step 3: Orient

Print:

> **Workspaces ready.**
>
> ### Director: `<parent>/<project>-manage/`
> Open a Claude Code session here for:
> - `/hackprep checkpoint` — check progress
> - `/hackprep slides` — build presentation
> - `/hackprep video` — record demo
> - `/hackprep autopilot` — experimental autonomous monitoring
> - Issue triage, PR review, scope decisions
>
> ### Builder: `<parent>/<project>-work/`
> Open a Claude Code session here for:
> - `/hack` — pick up your next task
> - Implementation in worktrees
> - Tests, builds, PRs
>
> Both share the same GitHub remote. Commits from either side appear in the same repo.
>
> **Tip:** Keep the director terminal visible at all times. It's your dashboard.

---

## Step 4: Update CLAUDE.md

If a `.claude/CLAUDE.md` exists in the project, append a section:

```markdown
## Workspace Pattern

This project uses two separate checkouts for parallel Claude Code sessions:

- **`<project>-manage`** — Director session for coordination, checkpoints, presentations
- **`<project>-work`** — Builder session for implementation in worktrees

Both share the same remote. Run `/hackprep checkpoint` in the director. Run `/hack` in the builder.
```
```

**Step 2: Commit**

```bash
git add skills/workspace-setup/SKILL.md
git commit -m "feat: add workspace-setup skill — director/builder checkout pattern"
```

**Verification:** `cat skills/workspace-setup/SKILL.md` shows valid frontmatter. Clone commands use relative paths correctly.

---

### Task 6: Add identity configuration

**Files:**
- Modify: `skills/team-inventory/SKILL.md`
- Modify: `skills/init/SKILL.md`

**Step 1: Add identity prompt to team-inventory**

In `skills/team-inventory/SKILL.md`, after the roster is finalized (after the team-routing skill is generated), add:

```markdown
### Step 4: Configure Local Identity

After generating the team-routing skill, ask:

> **Which team member are you?** I'll save this so `/hack` knows who you are without asking every time.

Present the roster as a numbered list. After the user selects, write `.hackathoner.local.md` in the project root:

```markdown
---
user: <selected-github-username>
---
```

This file is gitignored — each teammate creates their own when they first run `/hack` or `/hackprep team`.
```

**Step 2: Add `.hackathoner.local.md` to init's gitignore generation**

In `skills/init/SKILL.md`, in the phase that generates `.gitignore`, add `.hackathoner.local.md` to the list of ignored files. Find the section that creates `.gitignore` and ensure it includes:

```
.hackathoner.local.md
```

**Step 3: Document resolution order**

In `skills/team-inventory/SKILL.md`, add a note in the team-routing skill generation section:

```markdown
Include this identity resolution order in the generated team-routing skill:

> **Identity resolution (checked in order):**
> 1. `.hackathoner.local.md` file in project root (fastest, no shell)
> 2. `HACKATHONER_USER` environment variable
> 3. `git config user.name` mapped against the roster
> 4. If none match: ask once, then write `.hackathoner.local.md`
```

**Step 4: Commit**

```bash
git add skills/team-inventory/SKILL.md skills/init/SKILL.md
git commit -m "feat: add identity config — .hackathoner.local.md with env and git fallback"
```

**Verification:** `grep "hackathoner.local" skills/team-inventory/SKILL.md skills/init/SKILL.md` returns matches in both files.

---

### Task 7: Add agent attribution and API key conflict detection

**Files:**
- Modify: `skills/team-inventory/SKILL.md`

**Step 1: Add API key conflict detection**

In `skills/team-inventory/SKILL.md`, after collecting all team member profiles, add:

```markdown
### Step 3.5: API Key Conflict Check

After collecting all profiles, check if multiple team members will be using the same sponsor tools. For each sponsor tool in the tracking issue:

1. Note which team member's API key will be used (from their `.env` or credentials)
2. If two or more members have configured different API keys for the same service, print:

> **⚠ API key conflict detected:** @member1 and @member2 have different [service] API keys configured. This will cause cross-session conflicts — one person's agent may create resources under a different account than expected. Pick one key and share it across the team.

This is a warning, not a blocker. Print it and continue.
```

**Step 2: Add attribution format to team-routing generation**

In `skills/team-inventory/SKILL.md`, in the section that generates the team-routing project skill, add:

```markdown
Include this attribution format in the generated team-routing skill:

> **Activity attribution:** When posting comments to the tracking issue or closing issues, always use this format:
>
> `**@username** (via Claude agent) closed #N — PR #M`
>
> The `(via Claude agent)` suffix is mandatory when Claude posts on behalf of a user. This distinguishes actions taken by the human from actions taken by their agent.
```

**Step 3: Commit**

```bash
git add skills/team-inventory/SKILL.md
git commit -m "feat: add API key conflict detection and agent attribution format"
```

**Verification:** `grep "API key conflict" skills/team-inventory/SKILL.md` returns a match. `grep "via Claude agent" skills/team-inventory/SKILL.md` returns a match.

---

### Task 8: Create `autonomous-mode` skill (experimental)

**Files:**
- Create: `skills/autonomous-mode/SKILL.md`

**Step 1: Write the skill file**

Create `skills/autonomous-mode/SKILL.md`:

```markdown
---
name: autonomous-mode
description: "Experimental: Use when setting up autonomous checkpoint monitoring in the director workspace. Runs periodic status checks via /loop and nudges the team when behind schedule. Triggered by /hackprep autopilot. Only available after C3."
---

# Autonomous Mode Skill (Experimental)

⚠ **This is experimental.** The `/loop` and `/schedule` features in Claude Code are new. This skill uses them to create an autonomous watchdog in the director workspace. It observes and nudges but never acts on its own.

**Tell us what worked and what didn't:** github.com/fshot/claude-plugin-hackathoner/issues

## Prerequisites

1. You are in the director workspace (the `-manage` checkout, or the main checkout if not using the workspace pattern)
2. The hackathon is past C3 (the watchdog isn't useful before real integrations are live)
3. The tracking issue exists with checkpoint timeline

---

## Step 1: Verify Timing

Check current checkpoint:

```bash
gh issue view 1 --json body --jq '.body'
```

Parse the hacking start time and compute elapsed hours. If before C3, print:

> **Too early for autopilot.** The watchdog is most useful after C3, when real integrations are live and you're heads-down building. Run this again after C3.

And stop.

---

## Step 2: Start the Loop

Use `/loop 15m` with this status check prompt:

```
Check hackathon progress:
1. Run: gh issue list --state open --json number,title,labels --jq '.[] | "\(.number) \(.title) [\(.labels | map(.name) | join(", "))]"'
2. Run: git log --oneline --since="1 hour ago" | head -10
3. Run: gh pr list --state open --json number,title --jq '.[] | "#\(.number) \(.title)"'
4. Compare against checkpoint targets from tracking issue #1
5. Print a 3-line status summary:
   - Current checkpoint and status (GREEN/YELLOW/RED)
   - Open P0 count, open P1 count, open PRs
   - Story check: "Can you explain what you've built in 30 seconds?"
6. If RED: suggest specific scope cuts
7. If PRs waiting: remind the human to review
8. If a P0 is unassigned: flag it
```

---

## Step 3: Post-C5 Shift

After C5, the loop prompt shifts:

```
Post-C5 check (NO new features — polish, bugs, demo only):
1. Check: are slides done? (ls docs/demo/slides.md)
2. Check: is demo recorded? (ls docs/demo/*.mp4 docs/demo/*.mov 2>/dev/null)
3. Check: is submission draft ready? (ls docs/submission.md 2>/dev/null)
4. Check: any open P0 bugs? (gh issue list --label P0,bug --state open)
5. Print status focusing on demo readiness, not feature completion
6. Frequency: every 10 minutes
```

---

## Step 4: Stopping

The loop can be stopped anytime. Print:

> **Autopilot is running.** It will check status every 15 minutes (10 minutes after C5).
>
> To stop: press Ctrl+C or close this terminal.
>
> The autopilot is read-only. It will never pick up tasks, merge PRs, or make decisions. It only observes and nudges.
```

**Step 2: Commit**

```bash
git add skills/autonomous-mode/SKILL.md
git commit -m "feat: add autonomous-mode skill (experimental) — /loop-based checkpoint watchdog"
```

**Verification:** `cat skills/autonomous-mode/SKILL.md` shows valid frontmatter with experimental note. The skill never takes actions, only prints status.

---

### Task 9: Update `hackprep.md` command router with new routes

**Files:**
- Modify: `commands/hackprep.md`

**Step 1: Add new routes to the routing table**

In `commands/hackprep.md`, add these rows to the Step 2 routing table:

```markdown
| `slides`    | `hackathoner:slide-assembly`      | Remaining args (if any)              |
| `video`     | `hackathoner:demo-videography`    | Remaining args (if any)              |
| `workspaces`| `hackathoner:workspace-setup`     | Remaining args (if any)              |
| `autopilot` | `hackathoner:autonomous-mode`     | Remaining args (if any)              |
```

**Step 2: Update the argument-hint in frontmatter**

Change the argument-hint to include the new phases:

```
argument-hint: "[phase] [args] — e.g., research <tool>, research-domain <topic>, team, brainstorm, scaffold, slides, video, workspaces, autopilot, data, demo"
```

**Step 3: Update the unknown phase error message**

Update the available phases list to include: `comms, research, research-domain, team, brainstorm, scaffold, checkpoint, slides, video, workspaces, autopilot, data, demo`

**Step 4: Commit**

```bash
git add commands/hackprep.md
git commit -m "feat: add slides, video, workspaces, and autopilot routes to hackprep"
```

**Verification:** `grep "slides\|video\|workspaces\|autopilot" commands/hackprep.md` returns matches for all four new routes.

---

### Task 10: Add workspace-setup prompt to init skill

**Files:**
- Modify: `skills/init/SKILL.md`

**Step 1: Add workspace prompt after repo setup**

In `skills/init/SKILL.md`, after the initial commit and push (the last step of init), add:

```markdown
## Phase 9: Workspace Setup (Optional)

After the initial commit, offer the workspace pattern:

> **Would you like separate workspaces for coordination and building?**
> This is recommended for teams of 2+ or when you want to keep your director and builder contexts separate.

If the user says yes, invoke skill `hackathoner:workspace-setup`.

If the user says no, continue. This can always be set up later with `/hackprep workspaces`.
```

**Step 2: Commit**

```bash
git add skills/init/SKILL.md
git commit -m "feat: offer workspace setup during init"
```

**Verification:** `grep "workspace" skills/init/SKILL.md` returns matches for the new phase.

---

### Task 11: Update `plugin.json` and `.gitignore`

**Files:**
- Modify: `.claude-plugin/plugin.json`
- Modify: `.gitignore`

**Step 1: Update plugin.json**

Change the description:

```json
"description": "Structure your next hackathon, game jam, or sprint with Claude Code — plans before code, storytelling from brainstorm to demo, checkpoint discipline",
```

Update keywords:

```json
"keywords": ["hackathon", "game-jam", "sprint", "scaffolding", "team-routing", "checkpoints", "demo-prep", "storytelling", "claude-code-plugin"]
```

Bump version:

```json
"version": "0.2.0",
```

**Step 2: Update .gitignore**

Add to `.gitignore`:

```
evals/
```

**Step 3: Commit**

```bash
git add .claude-plugin/plugin.json .gitignore
git commit -m "chore: bump to v0.2.0, update description, gitignore evals/"
```

**Verification:** `cat .claude-plugin/plugin.json | grep version` shows `0.2.0`. `cat .gitignore` includes `evals/`.

---

### Task 12: Update `design.md`

**Files:**
- Modify: `docs/design.md`

**Step 1: Update the design doc**

Major updates to `docs/design.md`:

1. **Add storytelling to Core Philosophy:**
   ```markdown
   - Story-first. Before designing solutions, identify the hero, their struggle, and their journey. The winning demo tells the user's story, not yours.
   ```

2. **Update Plugin Structure** to show new skills:
   ```markdown
   ├── skills/
   │   ├── ...existing...
   │   ├── slide-assembly/SKILL.md       # Marp slide deck from story + features
   │   ├── demo-videography/SKILL.md     # Demo recording guide and script
   │   ├── workspace-setup/SKILL.md      # Director/builder checkout pattern
   │   └── autonomous-mode/SKILL.md      # Experimental /loop-based watchdog
   ```

3. **Replace all `hackathon-storming` references** with `hackathon-brainstorming`

4. **Replace all `storm` command args** with `brainstorm`

5. **Add Workspace Pattern section** after Team Routing:
   ```markdown
   ## Workspace Pattern (Optional)

   Two checkouts of the same repo for parallel Claude Code sessions:
   - `<project>-manage` — Director: checkpoints, triage, slides, demo recording
   - `<project>-work` — Builder: `/hack` loop, worktrees, implementation

   Offered during init. Can be set up later with `/hackprep workspaces`.
   ```

6. **Add Agent Attribution section** after Credential Scoping:
   ```markdown
   ## Agent Attribution

   All tracking issue comments posted by Claude include `(via Claude agent)` suffix.
   API key conflicts between team members are flagged during team inventory.
   ```

7. **Update the `/hack` command section** to show the identity resolution order

8. **Add Demo & Presentation section** to Phases:
   ```markdown
   ### 8a. Slides
   - Generate Marp slide deck from story + features
   - Capture screenshots if app is running
   - Recommended starting at C3

   ### 8b. Demo Video
   - Generate timed demo script
   - Pre-load demo state
   - Guide team through recording (driver/narrator/spotter)
   - Recommended at C5, not at deadline
   ```

**Step 2: Commit**

```bash
git add docs/design.md
git commit -m "docs: update design.md with storytelling, new skills, workspace pattern"
```

**Verification:** `grep "storytelling\|slide-assembly\|workspace\|brainstorming" docs/design.md` returns multiple matches.

---

### Task 13: Write README.md

**Files:**
- Create: `README.md`

**Step 1: Write the README**

Create `README.md` in the repo root:

```markdown
# hackathoner

A Claude Code plugin for building under extreme time pressure. Hackathons, game jams, ship weeks, rapid prototyping sprints.

The plugin encodes a methodology: plans before code, storytelling from brainstorm through demo, and checkpoint discipline that forces scope cuts before the deadline arrives. It generates project-specific skills, slash commands, and a tracking issue that becomes your single source of truth.

This is not a template. It's a system that builds the machines that build your project.

## Quick Start

```bash
claude plugin add fshot/claude-plugin-hackathoner
```

Then in your project directory:

```bash
claude
> /hackprep
```

The plugin walks you through: parse rules → init repo → research tools → team inventory → brainstorm → scaffold → build → slides → demo → submit.

## What It Does

| Skill | Purpose | Triggered by |
|-------|---------|-------------|
| **init** | Repo, tracking issue, credentials, CLAUDE.md | `/hackprep` (first run) |
| **research-tool** | Deep-dive sponsor tool research → project skill | `/hackprep research <tool>` |
| **research-domain** | Domain standards/regulations → reference docs | `/hackprep research-domain <topic>` |
| **team-inventory** | Roster, strengths, routing rules, identity config | `/hackprep team` |
| **hackathon-brainstorming** | Constrained brainstorming → prioritized GitHub Issues | `/hackprep brainstorm` |
| **scaffold** | Project structure, mocks, dev scripts, Feature Zero | `/hackprep scaffold` |
| **checkpoint** | Timeline enforcement, scope cuts, story checks | `/hackprep checkpoint` |
| **sample-data** | Test data curation and ground truth | `/hackprep data` |
| **slide-assembly** | Marp slide deck from your story + features | `/hackprep slides` |
| **demo-videography** | Demo script, recording guide, team roles | `/hackprep video` |
| **demo-prep** | Readiness audit, screenshots, submission packaging | `/hackprep demo` |
| **workspace-setup** | Director/builder checkout pattern | `/hackprep workspaces` |
| **autonomous-mode** | Experimental `/loop`-based checkpoint watchdog | `/hackprep autopilot` |

## The Flow

```
/hackprep          ← auto-detects next phase and runs it
    │
    ├── Parse hackathon rules
    ├── Initialize repo, tracking issue, credentials
    ├── Research sponsor tools (parallel)
    ├── Research domain standards (parallel)
    ├── Collect team roster and routing rules
    ├── Brainstorm → prioritized issues with assignments
    ├── Scaffold → project structure + Feature Zero
    │
    │   ── Build loop ──────────────────────────
    │   │  /hack picks next issue → plan → worktree → build → PR
    │   │  /hackprep checkpoint enforces timeline
    │   │  /hackprep autopilot monitors autonomously
    │   ────────────────────────────────────────
    │
    ├── Assemble presentation slides
    ├── Record demo video
    ├── Demo readiness audit + submission packaging
    └── Submit
```

## Checkpoint Timeline

| Checkpoint | Offset | Target |
|-----------|--------|--------|
| C0 | +0h | Scaffold committed, Feature Zero assigned |
| C1 | +3h | Feature Zero working with mock data |
| C2 | +7h | One real integration live |
| C3 | +11h | Core pipeline end-to-end |
| C4 | +19h | All P0 closed |
| C5 | +23h | Polish complete, demo recording done |
| C6 | +24.5h | Slides ready, submission drafted |
| C7 | +25.5h | Submitted. Code frozen. |

## Forge Your Own Lightsaber

This plugin encodes one team's methodology. It came from building a broadcast compliance scanner at the TwelveLabs Video Intelligence hackathon, losing, and paying attention to why the winners won.

Crack it open. The skills are markdown files. Read them, edit them, delete the ones you don't need, add the ones you do. The plugin will only work if you rewire it to suit yourself.

## Field-Tested

Built this plugin, then used it to compete. 190 commits in 23 hours. 31 design documents before code. 11 custom skills generated. Didn't place, but learned what winning actually looks like.

_Blog post coming soon at [cruxcapacity.com](https://cruxcapacity.com)._

## Contributing

Issues and PRs welcome. If you use this plugin at a hackathon, tell us how it went.

## License

MIT
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README — quick start, skill table, methodology, lightsaber invitation"
```

**Verification:** `head -5 README.md` shows the title and tagline. The skill table lists all 13 skills.

---

### Task 14: Smoke test — dry run on a test hackathon

**Files:**
- No files modified. This is a verification task.

**Step 1: Verify all skill files have valid frontmatter**

```bash
for f in skills/*/SKILL.md; do
  echo "=== $f ==="
  head -4 "$f"
  echo
done
```

Every skill should have `---` delimiters and a `name:` and `description:` field.

**Step 2: Verify hackprep routing**

```bash
grep -c '|' commands/hackprep.md
```

Count the routing table rows. Should be 13 (comms, research, research-domain, team, brainstorm, scaffold, checkpoint, data, demo, slides, video, workspaces, autopilot).

**Step 3: Verify no stale references**

```bash
grep -r "hackathon-storming" --include="*.md" .
grep -r "\/hack storm" --include="*.md" .
```

Both should return zero results.

**Step 4: Verify gitignore**

```bash
cat .gitignore
```

Should include `.hackathoner.local.md` and `evals/`.

**Step 5: Dry run**

Create a temporary test directory and attempt to install the plugin locally:

```bash
mkdir -p /tmp/hackathoner-test
cd /tmp/hackathoner-test
git init
```

The actual dry run on a real hackathon (the full `/hackprep` flow) should be done in a separate session to avoid polluting this context.

**Verification:** All skill frontmatter is valid. No stale references. Gitignore is correct. Plugin structure is consistent.

---

## Task Dependency Order

```
Task 1 (rename) ← no dependencies
Task 2 (storytelling) ← depends on Task 1 (references hackathon-brainstorming)
Task 3 (slide-assembly) ← no dependencies
Task 4 (demo-videography) ← no dependencies
Task 5 (workspace-setup) ← no dependencies
Task 6 (identity config) ← no dependencies
Task 7 (attribution) ← no dependencies
Task 8 (autonomous-mode) ← no dependencies
Task 9 (hackprep routes) ← depends on Tasks 1, 3, 4, 5, 8 (new routes must reference existing skills)
Task 10 (init workspace prompt) ← depends on Task 5
Task 11 (plugin.json + gitignore) ← no dependencies
Task 12 (design.md) ← depends on Tasks 1-8 (needs to reference all new skills)
Task 13 (README) ← depends on Tasks 1-12 (needs complete skill list)
Task 14 (smoke test) ← depends on all tasks
```

**Parallelizable groups:**
- Group A (independent): Tasks 1, 3, 4, 5, 6, 7, 8, 11
- Group B (after Task 1): Task 2
- Group C (after Tasks 1-8): Tasks 9, 10, 12
- Group D (after all): Tasks 13, 14
