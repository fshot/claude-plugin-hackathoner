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

## Solo or Team

This works for solo hackers. But from personal experience: find a team. Even if you are socially awkward and your skin is crawling at the idea of raising your hand and saying you need a teammate. A hackathon is not just an opportunity to practice building fast on your own — it's a chance to practice developing a constructive collaborative rapport on the fly, under time pressure, and surprising yourself with everything you can learn from a random stranger. The plugin supports both modes, but the team features are where it shines.

## Only One Person Installs the Plugin

One person on the team installs hackathoner and runs `/hackprep`. That creates a new **hackathon project repo** with project-specific skills, slash commands, and a CLAUDE.md — all committed under `.claude/`. Teammates just clone the project repo and open Claude Code. Everything they need is already there: `/hack` to pick up tasks, `/checkpoint` to check progress, routing rules that know who should work on what. No plugin install required — the project repo carries its own skills.

## Two Commands

**`/hackprep`** — your team lead runs this to set up the project. It guides you through setup, research, brainstorming, scaffolding, and presentation prep. No arguments needed — it reads the tracking issue and picks up where you left off.

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

## Collaboration: What Works, What's Next

**Battle-tested:** GitHub Issues and PRs. During our hackathon we lived in the tracking issue, assigned work through GitHub Issues, and reviewed each other's code through PRs. This is the plugin's backbone and it works well.

**Experimental:** Discord setup. The plugin can create a disposable Discord server with channels and roles, but honestly we never touched it during the actual hackathon. The potential is there, especially for remote/virtual teams — automated status posts, checkpoint notifications, scope cut alerts piped into a channel — but nobody has built those integrations yet.

**Wide open for contributions:**
- **Messaging integrations** — Slack, Discord bots, GitHub Discussions, or anything that pipes checkpoint status and scope decisions to where the team actually communicates
- **Alternative issue trackers** — Linear, Jira, Notion. The plugin assumes GitHub Issues today, but the methodology doesn't depend on it
- **Coordination automation** — anything that reduces the friction of a remote team working under time pressure

If you try this at a hackathon and build something for any of the above, please open an issue or PR. These are the gaps we know about but haven't had a chance to fill.

## Contributing

Issues and PRs welcome. If you use this plugin at a hackathon, tell us how it went.

## License

MIT
