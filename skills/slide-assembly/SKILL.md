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
