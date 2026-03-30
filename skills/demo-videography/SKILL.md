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
