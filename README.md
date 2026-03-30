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

That's it. `/hackprep` auto-detects which phase you're on and runs the next one. Keep running it and the plugin walks you from rules to submission.

## Only One Person Installs the Plugin

The organizer installs hackathoner and runs `/hackprep`. That generates a repo with project-specific skills, slash commands, and a CLAUDE.md — all committed to the repo itself under `.claude/`. Teammates just clone the repo and open Claude Code. Everything they need is already there: `/hack` to pick up tasks, `/checkpoint` to check progress, routing rules that know who should work on what. No plugin install required.

## Two Commands

**`/hackprep`** — the organizer runs this. It guides you through setup, research, brainstorming, scaffolding, and presentation prep. No arguments needed — it reads the tracking issue and picks up where you left off.

**`/hack`** — contributors run this during the build phase. It picks up the next assigned issue, generates a plan, creates a worktree, builds, and opens a PR. Loop it.

```
/hackprep                          /hack
    |                                  |
    +-- Parse hackathon rules          +-- Detect current user
    +-- Init repo + tracking issue     +-- Find next assigned issue
    +-- Set up team comms              +-- Generate plan, get approval
    +-- Research sponsor tools         +-- Create worktree
    +-- Research domain standards      +-- Build + test
    +-- Collect team roster            +-- Open PR
    +-- Brainstorm -> issues           +-- Loop: /hack again
    +-- Scaffold + Feature Zero        |
    |                                  +-- /hackprep checkpoint
    +-- Assemble slides                    (enforces timeline,
    +-- Record demo video                   cuts scope when behind)
    +-- Submission packaging
    +-- Submit
```

Both commands are stateless — all state lives in GitHub Issue #1. You can close your terminal, switch machines, or hand off to a teammate.

<details>
<summary>All skills under the hood (you don't need to call these directly)</summary>

| Phase | What happens | Direct command (optional) |
|-------|-------------|--------------------------|
| Init | Repo, tracking issue, credentials, CLAUDE.md | `/hackprep init` |
| Research | Deep-dive sponsor tools, generate project skills | `/hackprep research <tool>` |
| Domain research | Standards, regulations, compliance frameworks | `/hackprep research-domain <topic>` |
| Team | Roster, strengths, routing rules, identity config | `/hackprep team` |
| Brainstorm | Constrained brainstorming > prioritized GitHub Issues | `/hackprep brainstorm` |
| Scaffold | Project structure, mocks, dev scripts, Feature Zero | `/hackprep scaffold` |
| Checkpoint | Timeline enforcement, scope cuts, story checks | `/hackprep checkpoint` |
| Test data | Sample data curation and ground truth | `/hackprep data` |
| Slides | Marp slide deck from your story + features | `/hackprep slides` |
| Demo video | Timed demo script, recording guide, team roles | `/hackprep video` |
| Demo prep | Readiness audit, screenshots, submission packaging | `/hackprep demo` |
| Workspaces | Director/builder checkout pattern (optional) | `/hackprep workspaces` |
| Autopilot | Experimental checkpoint watchdog (optional) | `/hackprep autopilot` |
| Comms | Disposable Discord server for team comms | `/hackprep comms` |

</details>

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

Crack it open. The skills are markdown files. Read them, edit them, delete the ones you don't need, add the ones you do. The plugin will work best if you rewire it to suit yourself.

## Field-Tested

Built this plugin, then used it to compete. 190 commits in 23 hours. 31 design documents before code. 11 custom skills generated. Didn't place, but did ship
a fully working system, and took notes on what the winning teams did differently.

_Blog post coming soon at [cruxcapacity.com](https://cruxcapacity.com)._

## Contributing

Issues and PRs welcome. If you use this plugin at a hackathon, tell us how it went.

## License

MIT
