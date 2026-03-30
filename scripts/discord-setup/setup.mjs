#!/usr/bin/env node

// Sets up a Discord server for a weekend hackathon.
// Usage: node setup.mjs --bot-token TOKEN --name "My Hackathon" [--teams 3] [--guild-id ID]
//
// Two modes:
//   A) Auto-create: Bot creates a new guild (works for older/allowlisted bots)
//   B) Configure existing: User creates server manually, passes --guild-id,
//      bot joins via OAuth2 invite and configures channels/roles
//
// What it does:
//   1. Creates or connects to a Discord server (guild)
//   2. Cleans up default channels, sets up categories: GENERAL, TEAMS, RESOURCES
//   3. Creates text channels under each category
//   4. Creates team roles (if --teams specified)
//   5. Generates a never-expiring invite link
//   6. Outputs JSON with server ID, invite URL, and channel list

import { Client, GatewayIntentBits, ChannelType } from "discord.js";

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--bot-token" && argv[i + 1]) {
      args.botToken = argv[++i];
    } else if (argv[i] === "--name" && argv[i + 1]) {
      args.name = argv[++i];
    } else if (argv[i] === "--teams" && argv[i + 1]) {
      args.teams = parseInt(argv[++i], 10);
    } else if (argv[i] === "--guild-id" && argv[i + 1]) {
      args.guildId = argv[++i];
    } else if (argv[i] === "--help") {
      console.log(`Usage: hackathon-discord --bot-token TOKEN --name "Hackathon Name" [--teams N] [--guild-id ID]

Options:
  --bot-token   Discord bot token (required)
  --name        Server name (required)
  --teams       Number of team channels to create (default: 0)
  --guild-id    Existing guild ID to configure (skips guild creation)
  --help        Show this help message

If --guild-id is not provided, the script tries to create a new guild.
If guild creation fails (error 20001 — newer bots are blocked from POST /guilds),
it prints an OAuth2 invite URL and instructions for manual setup.`);
      process.exit(0);
    }
  }
  return args;
}

async function configureGuild(guild, name, teamCount) {
  // Rename the guild if needed
  if (guild.name !== name) {
    await guild.setName(name);
    console.error(`Renamed server to: ${name}`);
  }

  // --- Clean up default channels ---
  const existingChannels = guild.channels.cache.filter(
    (ch) => ch.type === ChannelType.GuildText || ch.type === ChannelType.GuildVoice
  );
  for (const [, ch] of existingChannels) {
    try {
      await ch.delete("Hackathon setup — replacing with structured channels");
      console.error(`Deleted default channel: #${ch.name}`);
    } catch {
      console.error(`Could not delete channel: #${ch.name} (may lack permissions)`);
    }
  }
  // Also clean up default categories
  const existingCategories = guild.channels.cache.filter(
    (ch) => ch.type === ChannelType.GuildCategory
  );
  for (const [, ch] of existingCategories) {
    try {
      await ch.delete("Hackathon setup — replacing with structured categories");
    } catch {
      // ignore
    }
  }

  // --- Create text channels ---
  const textChannels = ["general", "links", "demo"];
  for (const chName of textChannels) {
    await guild.channels.create({
      name: chName,
      type: ChannelType.GuildText,
    });
  }
  console.error(`Created text channels: ${textChannels.join(", ")}`);

  // --- Create voice channel for pairing ---
  await guild.channels.create({
    name: "pairing",
    type: ChannelType.GuildVoice,
  });
  console.error("Created voice channel: pairing");

  // --- Generate invite link (never expires, unlimited uses) ---
  // Refetch channels since cache may be stale after creation
  const freshChannels = await guild.channels.fetch();
  const welcomeChannel = freshChannels.find(
    (ch) => ch.name === "general" && ch.type === ChannelType.GuildText
  ) || freshChannels.find((ch) => ch.type === ChannelType.GuildText);

  const invite = await welcomeChannel.createInvite({
    maxAge: 0, // never expires
    maxUses: 0, // unlimited uses
    unique: true,
  });

  // --- Collect channel list ---
  const channels = freshChannels
    .filter((ch) => ch.type === ChannelType.GuildText)
    .map((ch) => ({
      name: ch.name,
      category: ch.parent?.name || null,
      id: ch.id,
    }));

  const roles = guild.roles.cache
    .filter((r) => r.name !== "@everyone" && !r.managed)
    .map((r) => ({ name: r.name, id: r.id }));

  return { invite, channels: [...channels.values()], roles };
}

async function main() {
  const args = parseArgs(process.argv);

  if (!args.botToken) {
    console.error("Error: --bot-token is required");
    process.exit(1);
  }
  if (!args.name) {
    console.error("Error: --name is required");
    process.exit(1);
  }

  const teamCount = args.teams || 0;

  const client = new Client({
    intents: [GatewayIntentBits.Guilds],
  });

  try {
    // Register the ready listener BEFORE login to avoid a race condition
    // where the ready event fires during the login await and is missed.
    const readyPromise = new Promise((resolve) => client.once("ready", resolve));
    await client.login(args.botToken);
    await readyPromise;
    console.error(`Logged in as ${client.user.tag}`);

    let guild;

    if (args.guildId) {
      // --- Mode B: Configure existing guild ---
      guild = client.guilds.cache.get(args.guildId);
      if (!guild) {
        // Bot may not have joined yet — try fetching
        try {
          guild = await client.guilds.fetch(args.guildId);
        } catch {
          console.error(`Error: Bot is not a member of guild ${args.guildId}.`);
          console.error(`Invite the bot first using this URL:`);
          console.error(
            `https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot&guild_id=${args.guildId}`
          );
          client.destroy();
          process.exitCode = 1;
          return;
        }
      }
      console.error(`Connected to existing server: ${guild.name} (${guild.id})`);
    } else {
      // --- Mode A: Try to create a new guild ---
      const guildCount = client.guilds.cache.size;
      if (guildCount >= 10) {
        console.error(
          `Error: Bot is in ${guildCount} guilds (max 10 for guild creation). Remove the bot from unused servers first.`
        );
        client.destroy();
        process.exitCode = 1;
        return;
      }
      console.error(`Bot is in ${guildCount} guild(s), attempting to create server...`);

      try {
        guild = await client.guilds.create({ name: args.name });
        console.error(`Created server: ${guild.name} (${guild.id})`);
      } catch (createError) {
        if (createError.code === 20001) {
          // Discord blocks newer bots from POST /guilds (error 20001).
          // Fall back: ask user to create manually, then re-run with --guild-id.
          console.error("");
          console.error("=== Guild creation blocked (Discord error 20001) ===");
          console.error("Newer Discord bots cannot create servers via API.");
          console.error("Please create the server manually, then re-run with --guild-id:");
          console.error("");
          console.error("  1. Open Discord → '+' → 'Create My Own' → 'For me and my friends'");
          console.error(`  2. Name it: ${args.name}`);
          console.error("  3. Invite the bot to the server using this URL:");
          console.error(
            `     https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot`
          );
          console.error("  4. Right-click the server icon → 'Copy Server ID' (enable Developer Mode in Discord settings if needed)");
          console.error("  5. Re-run this script with --guild-id <SERVER_ID>");
          console.error("");

          // Output structured JSON for programmatic consumption
          const fallback = {
            error: "GUILD_CREATE_BLOCKED",
            code: 20001,
            botId: client.user.id,
            inviteUrl: `https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot`,
            instructions: "Create server manually, invite bot, re-run with --guild-id",
          };
          console.log(JSON.stringify(fallback, null, 2));
          client.destroy();
          process.exitCode = 2;
          return; // Exit code 2 = needs manual intervention
        }
        throw createError; // Re-throw other errors
      }
    }

    // --- Configure the guild (works for both modes) ---
    const { invite, channels, roles } = await configureGuild(guild, args.name, teamCount);

    // --- Output result as JSON to stdout ---
    const result = {
      server: {
        id: guild.id,
        name: guild.name,
      },
      invite: {
        url: `https://discord.gg/${invite.code}`,
        code: invite.code,
        expires: "never",
        maxUses: "unlimited",
      },
      channels,
      roles,
    };

    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    if (error.code === 30001) {
      console.error(
        "Error: Bot is in too many guilds (max 10 for guild creation). Remove the bot from unused servers first."
      );
    } else {
      console.error(`Error: ${error.message}`);
      if (error.code) console.error(`Discord error code: ${error.code}`);
      if (error.status) console.error(`HTTP status: ${error.status}`);
      if (error.rawError) console.error(`Raw: ${JSON.stringify(error.rawError)}`);
    }
    process.exitCode = 1;
  } finally {
    client.destroy();
    // Force exit — discord.js can leave dangling timers/handles that prevent
    // the process from exiting cleanly after client.destroy().
    setTimeout(() => process.exit(process.exitCode || 0), 500);
  }
}

main();
