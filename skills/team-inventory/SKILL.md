---
name: team-inventory
description: Use when collecting team member profiles and generating routing rules — gathers strengths, availability, and preferences for task assignment. Triggered by /hack team.
---

# Team Inventory Skill

Collects team member profiles interactively, updates the tracking issue roster, and generates a team-routing project skill for intelligent task assignment.

## Inputs

- None required. The skill drives an interactive interview loop.

## Workflow

### Step 1: Collect Team Members

Interview team members one at a time. For each member, gather the following profile using conversational prompts (ask naturally, not as a rigid form):

| Field | Description | Example |
|-------|-------------|---------|
| **GitHub username** | Their GitHub handle | `@alice` |
| **Display name** | How they prefer to be called | `Alice` |
| **Strengths (ranked)** | Top 3-5 skills, ordered by confidence | `1. React/Next.js, 2. Tailwind CSS, 3. API design` |
| **Gaps** | Areas they are weak in or want to avoid | `DevOps, databases` |
| **Known tools** | Tools/frameworks they have used before | `Supabase, Vercel, Figma` |
| **Available hours** | Hours they can commit during the hackathon | `18 of 24` |
| **Comms handle** | Preferred comms channel + handle | `Discord: alice#1234` |
| **Dev environment** | OS, editor, local setup notes | `macOS, VS Code, has Docker` |

**Interview flow:**

1. Start by asking: "Let's build the team roster. I'll ask about each team member one at a time. Who's first? (Give me their GitHub username to start.)"

2. For each member, ask follow-up questions conversationally. You can batch related questions:

   > **@{{username}}** — Tell me about their skills:
   > - What are their top 3-5 strengths, ranked by confidence?
   > - Any areas they'd prefer to avoid or are weak in?
   > - Which tools/frameworks have they used before?

   > Now for logistics:
   > - How many hours can they commit during the hackathon?
   > - What's their preferred comms handle? (e.g., Discord, Slack)
   > - What's their dev setup? (OS, editor, Docker available?)

3. After completing each member, confirm the profile:

   > Here's what I have for **{{display_name}}** (@{{username}}):
   >
   > | Field | Value |
   > |-------|-------|
   > | Strengths | {{strengths}} |
   > | Gaps | {{gaps}} |
   > | Known tools | {{tools}} |
   > | Available hours | {{hours}} |
   > | Comms | {{comms}} |
   > | Dev env | {{dev_env}} |
   >
   > Does this look right? Any corrections?

4. After confirming, ask: "Add another team member? (y/n)"

5. Repeat until the user says no.

Store all collected profiles — you will use them in subsequent steps.

---

### Step 2: Update Tracking Issue Roster

Edit issue #1 to fill in the Team Roster table with collected data.

```bash
# Get current issue body
BODY=$(gh issue view 1 --json body --jq '.body')
```

Replace the placeholder row in the Team Roster table with actual member rows:

| GitHub | Role | Strengths | Hours Available | Status |
|--------|------|-----------|-----------------|--------|
| @{{username}} | _TBD after storming_ | {{top 3 strengths}} | {{hours}} | :white_check_mark: Inventoried |

```bash
# Build the replacement table rows from collected data
# Replace the placeholder row with actual roster rows
UPDATED_BODY=$(echo "$BODY" | sed 's/| _Run `\/hack team` to populate_ | | | | |/{{ROSTER_ROWS}}/')

gh issue edit 1 --body "$UPDATED_BODY"
```

If there are multiple members, include one row per member. Use the `sed` replacement or rebuild the table section entirely if the substitution is complex.

---

### Step 3: Generate Team-Routing Project Skill

Create `.claude/skills/team-routing/SKILL.md` in the **target hackathon project repo** (not the plugin repo):

```markdown
---
name: team-routing
description: Task assignment heuristics based on team member strengths, availability, and tool familiarity. Used by other skills to pick the right assignee.
---

# Team Routing

## Current User Detection

Detect who is running Claude Code right now:

```bash
git config user.email
```

Match the email against the roster below to identify the current user.

## Team Roster

| GitHub | Display Name | Strengths (ranked) | Gaps | Known Tools | Hours Available | Comms | Dev Env |
|--------|-------------|---------------------|------|-------------|-----------------|-------|---------|
{{FULL_ROSTER_TABLE_ROWS}}

## Assignment Heuristics

When assigning a task, apply these rules in priority order:

### 1. Match by Strength

Assign the task to the team member whose **top-ranked strength** best matches the task's primary skill requirement. Prefer a #1-ranked strength over a #3-ranked strength on another member.

### 2. Spread Tool Ownership

If a task involves a specific sponsor tool (e.g., Pinecone, Supabase), prefer the member who listed it in **Known Tools**. If multiple members know the tool, prefer the one with fewer tool-ownership assignments so far.

### 3. Respect Availability

Never assign to a member who has already been assigned more hours of work than their **Hours Available**. Track running totals. If a member is approaching their limit, prefer someone with more headroom.

### 4. Pair on Gaps

If a task falls in a member's **Gaps** area but they need to learn it, assign them as a **secondary** with a stronger member as **primary**. The primary implements; the secondary reviews and learns.

### 5. Single Owner

Every task has exactly **one owner** (the assignee on the GitHub issue). Pairing is encouraged, but one person is accountable for completion.

### 6. Tiebreaker

If multiple members are equally qualified, prefer:
1. The member with more available hours remaining
2. The member who has completed fewer tasks so far (balance workload)
3. The current user (minimize context-switching overhead)

## Usage

Other skills reference this skill when they need to assign work. Example:

> "Based on the team-routing heuristics, this React component task should go to **@alice** (React is her #1 strength, 12 hours remaining)."
```

Replace `{{FULL_ROSTER_TABLE_ROWS}}` with one row per collected team member, including all profile fields.

---

### Step 4: Update CONTRIBUTING.md

Open the project's `CONTRIBUTING.md` and add a team section. If a `## Team` section already exists, replace it. Otherwise, append it before the `## Project Structure` section (or at the end if that section doesn't exist).

```markdown
## Team

| Member | GitHub | Strengths | Comms |
|--------|--------|-----------|-------|
{{MEMBER_ROWS}}

### Availability

| Member | Hours Available | Dev Environment |
|--------|-----------------|-----------------|
{{AVAILABILITY_ROWS}}

### Communication

- Primary channel: {{COMMS_CHANNEL}} (based on team consensus)
- Tag teammates using their GitHub handle in issues and PRs
- For urgent items, use the comms handle listed above
```

Replace all placeholders with actual collected data. Infer the primary comms channel from the most common platform across team members (e.g., if 3 of 4 members use Discord, set Discord as primary).

---

### Step 5: Mark Phase Complete

Update the tracking issue checklist and add a completion comment.

#### 5.1 Check Off Team Inventory

```bash
BODY=$(gh issue view 1 --json body --jq '.body')
UPDATED_BODY=$(echo "$BODY" | sed 's/- \[ \] Team inventory done/- [x] Team inventory done/')
gh issue edit 1 --body "$UPDATED_BODY"
```

#### 5.2 Add Completion Comment

```bash
gh issue comment 1 --body "## ✅ Team Inventory Complete

**Team members inventoried:** {{COUNT}}

| Member | Strengths | Hours |
|--------|-----------|-------|
{{SUMMARY_ROWS}}

**Artifacts generated:**
- Updated roster in tracking issue #1
- \`.claude/skills/team-routing/SKILL.md\` — assignment heuristics
- Updated \`CONTRIBUTING.md\` with team section

**Next step:** Run \`/hack\` to continue to the next phase."
```

---

### Step 6: Commit and Push

Stage all modified and generated files in the target project repo:

```bash
git add CONTRIBUTING.md .claude/skills/team-routing/SKILL.md
git commit -m "feat(team): add team roster and routing rules

- Team roster added to tracking issue #1
- Generated .claude/skills/team-routing/SKILL.md with assignment heuristics
- Updated CONTRIBUTING.md with team member info"

git push
```

If the push fails due to upstream changes, pull and retry:

```bash
git pull --rebase && git push
```

---

## Error Handling

- If tracking issue #1 doesn't exist, warn the user: "No tracking issue found. Run `/hack` to initialize the project first." Then skip Steps 2 and 5.
- If CONTRIBUTING.md doesn't exist, create it with a minimal header and the team section.
- If `.claude/skills/` directory doesn't exist, create it before writing the routing skill.
- If the user provides incomplete info for a member, note the gaps and proceed — flag them as `⚠️ incomplete` in the roster.
- If the commit fails because there are no changes, report what happened and why.

## Example Usage

```
/hack team
```

This will:
1. Interview the user about each team member's profile
2. Update the tracking issue roster table
3. Generate `.claude/skills/team-routing/SKILL.md` with assignment heuristics
4. Update `CONTRIBUTING.md` with team info
5. Mark "Team inventory done" on the tracking issue
6. Commit and push all artifacts
