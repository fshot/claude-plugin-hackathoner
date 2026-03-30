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

The plugin walks you through: parse rules > init repo > research tools > team inventory > brainstorm > scaffold > build > slides > demo > submit.

## What It Does

| Skill | Purpose | Triggered by |
|-------|---------|-------------|
| **init** | Repo, tracking issue, credentials, CLAUDE.md | `/hackprep` (first run) |
| **research-tool** | Deep-dive sponsor tool research > project skill | `/hackprep research <tool>` |
| **research-domain** | Domain standards/regulations > reference docs | `/hackprep research-domain <topic>` |
| **team-inventory** | Roster, strengths, routing rules, identity config | `/hackprep team` |
| **hackathon-brainstorming** | Constrained brainstorming > prioritized GitHub Issues | `/hackprep brainstorm` |
| **scaffold** | Project structure, mocks, dev scripts, Feature Zero | `/hackprep scaffold` |
| **checkpoint** | Timeline enforcement, scope cuts, story checks | `/hackprep checkpoint` |
| **sample-data** | Test data curation and ground truth | `/hackprep data` |
| **slide-assembly** | Marp slide deck from your story + features | `/hackprep slides` |
| **demo-videography** | Demo script, recording guide, team roles | `/hackprep video` |
| **demo-prep** | Readiness audit, screenshots, submission packaging | `/hackprep demo` |
| **workspace-setup** | Director/builder checkout pattern | `/hackprep workspaces` |
| **autonomous-mode** | Experimental `/loop`-based checkpoint watchdog | `/hackprep autopilot` |
| **discord-setup** | Disposable Discord server for team comms | `/hackprep comms` |

## The Flow

```
/hackprep          <- auto-detects next phase and runs it
    |
    +-- Parse hackathon rules
    +-- Initialize repo, tracking issue, credentials
    +-- Set up team communication channel
    +-- Research sponsor tools (parallel)
    +-- Research domain standards (parallel)
    +-- Collect team roster and routing rules
    +-- Brainstorm -> prioritized issues with assignments
    +-- Scaffold -> project structure + Feature Zero
    |
    |   -- Build loop --------------------------
    |   |  /hack picks next issue -> plan -> worktree -> build -> PR
    |   |  /hackprep checkpoint enforces timeline
    |   |  /hackprep autopilot monitors autonomously
    |   ----------------------------------------
    |
    +-- Assemble presentation slides
    +-- Record demo video
    +-- Demo readiness audit + submission packaging
    +-- Submit
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
