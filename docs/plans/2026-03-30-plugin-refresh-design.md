---
title: "Hackathoner Plugin Refresh"
created: 2026-03-30
status: approved
repo: fshot/claude-plugin-hackathoner
context: Post-hackathon retro from TwelveLabs Video Intelligence hackathon (Mar 28-29, 2026)
---

# Hackathoner Plugin Refresh — Design

## Motivation

Field-tested the plugin at the TwelveLabs Video Intelligence hackathon. Didn't place. All three winning teams shared: team of three, polished presentation slides, and someone with real domain experience. The plugin optimized for engineering execution but ignored storytelling, presentation, and team composition. This refresh encodes those lessons.

Secondary goals: make the plugin shareable (README, repo polish) after interest from TwelveLabs staff and other attendees. Also fix operational pain points discovered during the hackathon (identity thrashing, workspace confusion, agent attribution ambiguity).

## Changes

### 1. Identity Configuration

**Problem:** `/hack` runs `git config user.email` every session to match the user to the team roster. Wasteful and fragile.

**Design:** Three-tier resolution, checked in order:

1. `.hackathoner.local.md` in project root (gitignored). Written once by `/hackprep team` when it asks "which team member are you?"
   ```markdown
   ---
   user: fshot
   ---
   ```
2. `HACKATHONER_USER` environment variable
3. `git config user.name` mapped against the roster (existing behavior, last resort)

If none match, ask once and write `.hackathoner.local.md`. The init skill adds this file to `.gitignore` automatically.

### 2. Storytelling Thread

**Problem:** Narrative was an afterthought. Winning teams told stories; we demoed features.

**Design:** Advisory prompts (printed, never blocking) at specific moments:

| Skill | When | Prompt |
|-------|------|--------|
| `team-inventory` | After roster complete | "Does anyone on this team have lived experience with the problem you're solving? If not, consider pivoting to a problem someone knows firsthand." |
| `hackathon-brainstorming` | Phase 3 (design discussion) | "Before we design: who is the person this tool is for? What's their struggle today? How does solving it change their life? The winning demo tells their story, not yours." |
| `hackathon-brainstorming` | Phase 5 (generate issues) | Auto-generate P1 issue: "Assemble presentation slides" (target C3). Auto-generate P1 issue: "Record demo video" (target C5). Qualified with: "if your hackathon includes a presentation or demo." |
| `checkpoint` | Every checkpoint C1-C5 | "Story check: can you explain what you've built and why it matters in 30 seconds?" |
| `checkpoint` | C3 | "Have you started your slides? If not, now is the time. Not at the deadline." |
| `checkpoint` | C5 | "Demo recording should happen NOW. Schedule 45 minutes. Make it a team activity — one person drives, one narrates, one watches for rough spots." |
| `scaffold` | After Feature Zero | "You now have something that works end-to-end. Before you build more: could you demo this to a judge and explain why it matters?" |

Not added to `/hack` issue pickup — don't interrupt heads-down building.

Prompts reference the user's actual problem statement from brainstorming when available.

Demo format varies by hackathon. Slides and video issues are advisory ("if your hackathon includes a presentation"), not assumed universal. But always recommended — the winners all had slides regardless of whether they were required.

### 3. Rename `hackathon-storming` → `hackathon-brainstorming`

Skill directory: `skills/hackathon-storming/` → `skills/hackathon-brainstorming/`
Command arg: `/hackprep storm` → `/hackprep brainstorm`
All references updated across design.md, hackprep.md, other skills.

### 4. New Skill: `slide-assembly`

**Triggered by:** Auto-generated P1 issue from brainstorming, or `/hackprep slides`.

**What it does:**
1. Reads architecture plan and brainstorming output for problem statement, user story, feature list
2. Generates Marp-compatible slide deck at `docs/demo/slides.md`:
   - Slide 1: The problem (who hurts, why, how bad)
   - Slide 2: The hero's journey (how your user's life changes)
   - Slides 3-5: Feature walkthroughs (screenshots if available, placeholders if not)
   - Slide 6: Architecture/tech (brief — judges care less than you think)
   - Slide 7: What's next / ask
3. Captures screenshots via Playwright if app is running
4. Reminds: "These slides are a draft. The story matters more than the formatting. Practice telling it out loud."

### 5. New Skill: `demo-videography`

**Triggered by:** Auto-generated P1 issue from brainstorming, or `/hackprep video`.

**What it does:**
1. Generates demo script at `docs/demo/video-script.md` — timed walkthrough with narration cues
2. Pre-loads demo state via seed script
3. Walks team through recording setup:
   - Tool recommendations (QuickTime, OBS, Loom)
   - Screen resolution and window positioning
   - "One person drives, one narrates, one watches for rough spots"
4. If hackathon format doesn't require video, says so but recommends recording one anyway as backup
5. Checks recording length against hackathon demo time limit from parsed rules

**Relationship to `demo-prep`:** Demo-prep is a readiness audit and submission packager. Slide-assembly and demo-videography are the creative work of building the presentation. Demo-prep checks that you did them.

### 6. New Skill: `workspace-setup`

**Triggered by:** Init skill (opt-in prompt), or `/hackprep workspaces`, or a teammate joining mid-hackathon.

**What it does:**
1. Asks: "Would you like separate workspaces for coordination and building?"
2. If yes, clones the repo twice:
   - `<project>-manage` — director terminal. Use for `/checkpoint`, issue triage, PR review, `/hackprep slides`, `/hackprep video`.
   - `<project>-work` — builder terminal. Run `/hack` to pick up tasks. Builds in worktrees.
3. Both share the same remote
4. Adds a note to the generated CLAUDE.md explaining the two-workspace pattern
5. If no: single checkout, no judgment

Does not automate tmux layouts or terminal splitting. Just the clones and the guidance.

### 7. Agent Attribution

**Problem:** "Steve tested this" vs "Steve's agent tested this" was ambiguous, contributing to the dual API key disaster.

**Two changes:**

1. **Tracking issue comments are attributed:** When `/hack` posts to the tracking issue, format is:
   ```
   **@fshot** (via Claude agent) closed #14 — PR #22
   ```
   The `(via Claude agent)` suffix is always present when Claude posts on behalf of a user.

2. **API key conflict detection:** During `/hackprep team`, after collecting credentials, the skill checks if multiple team members configure different keys for the same service. If so:
   > "Warning: @fshot and @SteveShotwell have different TwelveLabs API keys configured. This will cause cross-session conflicts. Pick one key and share it."

### 8. New Skill: `autonomous-mode` (Experimental)

**Triggered by:** `/hackprep autopilot` (only available after C3, only in director workspace).

**What it does:**
1. Uses `/loop 15m` to run a lightweight status check every 15 minutes:
   - Fetches open issues, recent commits, open PRs
   - Compares against checkpoint targets
   - If behind: prints nudge with specific scope cut suggestions
   - If PRs waiting: reminds human to review
   - If P0 unassigned: flags it
2. Read-only watchdog. Does NOT pick up tasks, merge PRs, or make decisions.
3. Post-C5 variant: stops suggesting new work, focuses on demo/slides/submission readiness, frequency increases to every 10 minutes.

**Explicitly experimental.** Skill file says: "This is experimental — tell us what worked and what didn't at github.com/fshot/claude-plugin-hackathoner/issues."

### 9. README.md

1. One-liner + badges (version, license)
2. Philosophy paragraph (3-4 sentences): plans before code, storytelling from brainstorm through demo, checkpoint discipline, forge your own lightsaber
3. Quick start: `claude plugin add fshot/claude-plugin-hackathoner` → `/hackprep`
4. What it does: table of skills with one-line descriptions
5. The flow: init → research → team → brainstorm → scaffold → build → slides → demo → submit
6. "Forge your own lightsaber" paragraph: this encodes one team's methodology, crack it open, make it yours
7. "Field-tested" paragraph: link to blog post, "built this plugin then used it to compete"
8. Contributing: issues welcome, PRs welcome, share your hackathon stories

### 10. Repo Cleanup

- Update `plugin.json` description: "Structure your next hackathon, game jam, or sprint with Claude Code"
- Update `design.md` to reflect storytelling philosophy, new skills, workspace pattern
- Add `evals/` to `.gitignore`
- Update all internal references from `hackathon-storming` to `hackathon-brainstorming`

## Summary Table

| Change | Type |
|--------|------|
| Identity config (`.hackathoner.local.md` + env + git fallback) | New feature |
| Storytelling prompts in team-inventory, brainstorming, checkpoint, scaffold | Modify existing skills |
| Rename `hackathon-storming` → `hackathon-brainstorming` | Rename |
| Auto-generate slides + video P1 issues from brainstorming | Modify existing skill |
| `slide-assembly` skill | New skill |
| `demo-videography` skill | New skill |
| `workspace-setup` skill | New skill |
| Agent attribution in tracking issue comments | Modify `/hack` behavior |
| API key conflict warning in team-inventory | Modify existing skill |
| `autonomous-mode` skill (experimental) | New skill |
| Demo format adaptivity (advisory, not assumed) | Modify storytelling prompts |
| README.md | New file |
| Updated `design.md` | Modify existing doc |
| Updated `plugin.json` description | Modify existing config |
| Add `evals/` to `.gitignore` | Cleanup |
