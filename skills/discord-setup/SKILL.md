---
name: discord-setup
description: Use when setting up a disposable Discord server for hackathon team communication. Creates server, channels, roles, and invite link via bot API. Only needed when the hackathon organizers did NOT provide a communication channel.
---

# Discord Setup Skill

Sets up a disposable Discord server for hackathon team communication. Discord is the default because it's faster to set up (~2 min vs ~15 min for Slack), fully scriptable via bot API, offers 1-click join with no email verification, and the server can be deleted when the hackathon is over.

**When to use:** The hackathon organizers did not provide a Discord server or Slack workspace, and the team needs a communication channel.

**When to skip:** The organizers already provided a comms channel — just record it in the tracking issue and move on.

---

## Step 1: Check If Comms Already Configured

```bash
BODY=$(gh issue view 1 --json body --jq '.body' 2>/dev/null)
echo "$BODY" | grep -i "comms\|discord\|slack" || echo "No comms configured yet"
```

If the tracking issue already has a comms channel recorded, announce it and skip this skill.

---

## Step 2: Ask About Organizer-Provided Channel

> Did the hackathon organizers provide a Discord server or Slack workspace?
>
> 1. **Yes, Discord** — I have an invite link
> 2. **Yes, Slack** — I have a workspace link
> 3. **No** — Set one up for me (Discord recommended — ~2 min, 1-click join for teammates)

### If the user chose 1 or 2:

Ask for the invite/workspace link, then skip to **Step 6** to record it in the tracking issue.

### If the user chose 3:

Continue to Step 3.

---

## Step 3: Create a Discord Bot

Walk the user through creating a temporary Discord bot. This takes ~2 minutes.

> **Discord Bot Setup** (one-time, ~2 minutes)
>
> 1. Go to: https://discord.com/developers/applications
> 2. Click **"New Application"** → name it `hackathon-bot` → click **Create**
> 3. Go to the **Bot** tab in the left sidebar
> 4. Click **"Reset Token"** → copy the token (you'll need it in a moment)
> 5. Scroll down to **Privileged Gateway Intents** and enable **Server Members Intent**
> 6. While you're in Discord: enable **Developer Mode** (User Settings → App Settings → Advanced → Developer Mode) — you may need this to copy the Server ID later
> 7. That's it — paste the bot token when I ask for it.

Ask the user for the bot token:

> Paste your Discord bot token:

Store it as `DISCORD_BOT_TOKEN`. **Never write this token to any file or commit it.** It is used only for this one-time setup script.

---

## Step 4: Run the Setup Script

Parse the hackathon event name from the tracking issue:

```bash
EVENT_NAME=$(gh issue view 1 --json title --jq '.title' | sed 's/.*Tracker: //')
```

Install dependencies and run the setup script:

```bash
cd "${CLAUDE_PLUGIN_ROOT}/scripts/discord-setup" && npm install --silent 2>/dev/null && node setup.mjs --bot-token "$DISCORD_BOT_TOKEN" --name "$EVENT_NAME"
```

The script has two modes and uses exit codes to signal the result:

### Exit code 0 — Success

The script created a guild and configured it. JSON output on stdout:

```json
{
  "server": { "id": "...", "name": "..." },
  "invite": { "url": "https://discord.gg/XXXX", "code": "XXXX", "expires": "never", "maxUses": "unlimited" },
  "channels": [...],
  "roles": [...]
}
```

Proceed to Step 5.

### Exit code 2 — Guild creation blocked (error 20001)

Newer Discord bots cannot create servers via `POST /guilds`. The script outputs a fallback JSON:

```json
{
  "error": "GUILD_CREATE_BLOCKED",
  "code": 20001,
  "botId": "...",
  "inviteUrl": "https://discord.com/oauth2/authorize?client_id=BOT_ID&permissions=8&scope=bot",
  "instructions": "Create server manually, invite bot, re-run with --guild-id"
}
```

**When this happens, walk the user through the fallback:**

> Guild creation is blocked for newer bots. No problem — here's the manual path (~1 extra minute):
>
> 1. Open Discord → click **"+"** → **"Create My Own"** → **"For me and my friends"**
> 2. Name it: **{{EVENT_NAME}}**
> 3. Invite the bot to the server: {{INVITE_URL_FROM_OUTPUT}}
> 4. Right-click the server icon → **"Copy Server ID"**
>    _(If you don't see this option, enable Developer Mode: User Settings → App Settings → Advanced → Developer Mode)_
> 5. Paste the Server ID here.

Once the user provides the guild ID, re-run the script with `--guild-id`:

```bash
cd "${CLAUDE_PLUGIN_ROOT}/scripts/discord-setup" && node setup.mjs --bot-token "$DISCORD_BOT_TOKEN" --name "$EVENT_NAME" --guild-id "$GUILD_ID"
```

This mode connects to the existing server, cleans up its default channels, and sets up the hackathon channel structure. It produces the same success JSON as exit code 0.

### Exit code 1 — Other errors

Check the stderr output for details:

- **"Bot is in too many guilds"**: The bot is in 10+ servers. Ask the user to remove it from unused ones at https://discord.com/developers/applications, or create a new bot.
- **"Bot is not a member of guild"**: The bot hasn't been invited yet. The script prints an OAuth2 invite URL — have the user click it, then retry.
- **Invalid token**: Ask the user to re-copy the token from the Discord Developer Portal.
- **Other errors**: Show the error (the script logs `error.code`, `error.status`, and `error.rawError` to stderr) and fall back to the manual setup path in the Error Recovery section.

---

## Step 5: Post Welcome Message

After the server is created, post a welcome message to `#general`. Use the Discord bot to send a message:

```bash
# Extract the general channel ID from the setup output
GENERAL_CHANNEL_ID=$(echo "$SETUP_OUTPUT" | jq -r '.channels[] | select(.name == "general") | .id')

# Post welcome message via Discord API
curl -s -X POST "https://discord.com/api/v10/channels/$GENERAL_CHANNEL_ID/messages" \
  -H "Authorization: Bot $DISCORD_BOT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$(cat <<WELCOME_EOF
{
  "embeds": [{
    "title": "Welcome to $EVENT_NAME!",
    "description": "This Discord server is your team's communication hub for the hackathon.\n\n**Channels:**\n- #general — Main discussion\n- #links — Share useful resources\n- #demo — Demo prep and feedback\n- \uD83D\uDD0A pairing — Voice channel for pair programming\n\n**Getting started:**\n1. Say hi here\n2. Check the GitHub repo for setup instructions\n3. Run \`/hack\` in Claude Code to pick up your first task\n\nGood luck! :rocket:",
    "color": 5814783
  }]
}
WELCOME_EOF
)"
```

---

## Step 6: Record in Tracking Issue

Update the tracking issue to include the comms channel info. Add a row to the Event Details table:

```bash
BODY=$(gh issue view 1 --json body --jq '.body')

# Add comms info to the Event Details table (after the last row before the closing |)
INVITE_URL="{{INVITE_URL}}"
UPDATED_BODY=$(echo "$BODY" | sed "/| \*\*Submission\*\*/a\\
| **Comms** | Discord: $INVITE_URL |")

gh issue edit 1 --body "$UPDATED_BODY"
```

Replace `{{INVITE_URL}}` with the actual Discord invite URL (or Slack workspace URL if organizer-provided).

Also add a completion comment:

```bash
gh issue comment 1 --body "## :speech_balloon: Team Communication Set Up

**Platform:** Discord
**Invite link:** $INVITE_URL (never expires, unlimited uses)

**Channels created:**
- #general, #links, #demo
- pairing (voice)

Share the invite link with your teammates — they can join with one click.

**Note:** The Discord bot token was used only for setup and is not stored anywhere. The bot can be deleted from https://discord.com/developers/applications after the hackathon."
```

---

## Step 7: Update CONTRIBUTING.md

Add the comms info to the project's CONTRIBUTING.md. If a `## Communication` or `## Team` section exists, update it. Otherwise, add before `## Project Structure`:

```markdown
## Communication

- **Primary channel:** Discord — {{INVITE_URL}}
- Join with one click (no email verification needed)
- Tag teammates using their GitHub handle in issues and PRs
- For urgent items, ping in #general
```

---

## Step 8: Commit

```bash
git add CONTRIBUTING.md
git commit -m "docs: add Discord server invite to CONTRIBUTING.md"
git push
```

---

## Error Recovery

- If the setup script is not found at `${CLAUDE_PLUGIN_ROOT}/scripts/discord-setup/`, fall back to guiding the user through manual Discord server creation:
  1. Go to https://discord.com → "Add a Server" → "Create My Own" → name it after the hackathon
  2. Create text channels: general, links, demo
  3. Create a voice channel: pairing
  4. Generate invite link: Server Settings → Invites → Create → set to "Never expire"
  5. Provide the invite link to continue

- If `CLAUDE_PLUGIN_ROOT` is not set, try to locate the script via:
  ```bash
  find ~/.claude/plugins -path "*/hackathoner/scripts/discord-setup/setup.mjs" 2>/dev/null | head -1
  ```
