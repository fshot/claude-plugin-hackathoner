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
