---
name: research-domain
description: This skill should be used when the user asks to "research the domain", "understand the standards", "look up compliance frameworks", "what regulations apply", "research broadcast standards", "what content categories exist", needs to understand industry standards, regulations, taxonomies, or classification systems relevant to the hackathon challenge, or when the hackathon challenge involves a regulated domain (compliance, finance, healthcare, content moderation, accessibility, etc.). Produces a project skill with comparison matrices, classification guides, and primary source links. DO NOT use for tool/API research (use research-tool instead), general brainstorming, or implementation.
---

# Research Domain Skill

Orchestrates end-to-end domain research for a hackathon project. Analyzes the hackathon challenge to identify domain-specific standards, regulations, and frameworks, then dispatches the `domain-researcher` agent for deep investigation and generates project-level reference artifacts.

**Tool research** answers "how do I call this API?" — **domain research** answers "what are the rules, standards, and classification systems my project must understand?"

## Inputs

- `topic` (optional): Specific domain topic to research (e.g., "broadcast-compliance", "payment-regulations", "accessibility-standards"). If not provided, the skill will analyze the hackathon challenge to identify domain topics automatically.

## Workflow

### Step 1: Identify Domain Topics

If a specific topic was provided, use it directly.

If no topic was provided, read the hackathon rules and challenge description to identify domain topics that require research:

```bash
# Read the hackathon-rules skill for parsed challenge details
cat .claude/skills/hackathon-rules/SKILL.md 2>/dev/null
```

Also check the tracking issue for context:

```bash
gh issue view 1 --json body --jq '.body' 2>/dev/null
```

Look for:
- **Regulations or standards mentioned by name** (FCC, GDPR, HIPAA, PCI-DSS, WCAG, etc.)
- **Regulated domains** (compliance, finance, healthcare, content moderation, broadcasting, etc.)
- **Classification systems implied** (content categories, severity levels, rating systems, etc.)
- **Judging criteria that reference domain knowledge** (e.g., "regulatory auditability", "multi-region compliance")

Present the identified topics to the user:

> **Domain topics identified from the challenge:**
>
> 1. **{{TOPIC_1}}** — {{brief rationale}}
> 2. **{{TOPIC_2}}** — {{brief rationale}}
>
> Should I research all of these, or focus on specific ones?

Wait for the user to confirm or narrow the scope before proceeding.

---

### Step 2: Dispatch Domain Researcher Agents

For each confirmed topic, dispatch a `domain-researcher` agent. If there are multiple topics, launch them in parallel using the Agent tool (same pattern as parallel tool research).

Each agent receives:
- The domain topic
- Relevant context from the hackathon rules (challenge track, judging criteria, target workflows)
- Instruction to produce the full structured research report

Wait for all agents to return their reports before proceeding.

---

### Step 3: Generate Project-Level Domain Skill

For each researched topic, create `.claude/skills/<topic-slug>/SKILL.md` in the hackathon project repo:

```yaml
---
name: <topic-slug>
description: Domain reference for <topic>. Standards comparison, content categories, classification rules, and implementation guidance for the hackathon project.
---
```

The skill body must include:
- **Framework Summary**: One-paragraph overview of each relevant framework and its scope
- **Content Category Matrix**: The comparison table from the research report — this is the core reference Claude will use when implementing detection rules
- **Classification Guide**: For each content category, what constitutes a violation, what are the edge cases, and what severity levels apply
- **Rule Encoding Guidance**: How to represent these rules programmatically (JSON schema, enum values, etc.)
- **Regional Variations**: Key differences that affect implementation, if applicable
- **Primary Sources**: Links to official documents for verification

**Important:** This skill will be read by Claude during implementation. Optimize for actionability — include concrete examples, specific thresholds, and clear decision trees. Avoid lengthy prose.

---

### Step 4: Generate Human Reference Doc

Create `docs/domain/<topic-slug>/README.md` in the hackathon project repo with:

- **Overview**: What this domain is about and why it matters for the project
- **Framework Inventory**: Table of all relevant frameworks with governing body, scope, and source links
- **Comparison Matrix**: Full content category comparison chart
- **Category Deep Dives**: Detailed breakdown of each content category with definitions, edge cases, and detection signals
- **Implementation Notes**: How to encode these standards in the project's rule engine
- **Primary Sources**: Numbered list of all official source documents with URLs
- **Gaps**: What requires further investigation or expert consultation

---

### Step 5: Update Tracking Issue

Update the GitHub tracking issue (issue #1):

```bash
BODY=$(gh issue view 1 --json body --jq '.body')
UPDATED_BODY=$(echo "$BODY" | sed 's/- \[ \] Domain research: {{TOPIC}}/- [x] Domain research: {{TOPIC}}/')
gh issue edit 1 --body "$UPDATED_BODY"
```

Add a completion comment:

```bash
gh issue comment 1 --body "## 📚 Domain Research Complete: {{TOPIC}}

**Frameworks analyzed:** {{COUNT}}
**Content categories mapped:** {{COUNT}}

**Key frameworks:**
{{FRAMEWORK_LIST}}

**Artifacts generated:**
- \`.claude/skills/{{TOPIC_SLUG}}/SKILL.md\` — domain reference skill
- \`docs/domain/{{TOPIC_SLUG}}/README.md\` — human reference doc

**Critical findings:**
{{TOP_3_FINDINGS}}

**Next step:** Run \`/hackprep\` to continue to the next phase."
```

---

### Step 6: Commit and Push

```bash
git add .claude/skills/{{TOPIC_SLUG}}/ docs/domain/{{TOPIC_SLUG}}/
git commit -m "feat(research): add {{TOPIC}} domain reference

- Domain skill: .claude/skills/{{TOPIC_SLUG}}/SKILL.md
- Reference doc: docs/domain/{{TOPIC_SLUG}}/README.md
- Frameworks: {{FRAMEWORK_NAMES}}
- Content categories: {{CATEGORY_COUNT}} mapped"

git push
```

---

## Error Handling

- If the domain-researcher agent cannot find sufficient primary sources, generate partial artifacts and flag gaps explicitly. Mark uncertain cells in the comparison matrix as "Unverified."
- If the tracking issue doesn't exist yet, warn the user and skip Step 5.
- If no domain topics can be identified from the challenge rules, ask the user directly: "What domain standards or regulations does your project need to understand?"
- If the commit fails (e.g., no changes), report what happened and why.

## Example Usage

```
/hackprep research-domain broadcast-compliance
```

This will:
1. Research FCC standards, OFCOM, EBU, GARM, platform policies, and related frameworks
2. Build a content category comparison matrix (drugs, sex, violence, religion, hate symbols, etc.)
3. Generate `.claude/skills/broadcast-compliance/SKILL.md` with classification rules
4. Generate `docs/domain/broadcast-compliance/README.md` with full reference guide
5. Update the tracking issue
6. Commit and push all artifacts

```
/hackprep research-domain
```

This will:
1. Analyze the hackathon challenge to identify domain topics automatically
2. Present them for confirmation
3. Research each confirmed topic (in parallel if multiple)
4. Generate all artifacts
