---
name: autonomous-mode
description: "Experimental: Use when setting up autonomous checkpoint monitoring in the director workspace. Runs periodic status checks via /loop and nudges the team when behind schedule. Triggered by /hackprep autopilot. Only available after C3."
---

# Autonomous Mode Skill (Experimental)

**This is experimental.** The `/loop` and `/schedule` features in Claude Code are new. This skill uses them to create an autonomous watchdog in the director workspace. It observes and nudges but never acts on its own.

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
