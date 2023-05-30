import { parseMessage } from "./parse-message";

declare const global;

import {MusicRouter} from "./router";
import {Client, Message, Snowflake} from "discord.js";
import {GatewayIntentBits} from "discord-api-types/v10";
import {ParsedMessageRequest} from "./parsed-message-request";

// Inits
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.DirectMessageReactions,
		GatewayIntentBits.GuildEmojisAndStickers,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.GuildPresences,
		GatewayIntentBits.GuildMessageTyping
	]
});

global.client = <Client> client;

client.login(process.env.DISCORD_TOKEN);

client.on("ready", () => {
	console.log(`Logged in as ${client.user.tag}!`);
});

const RouterByGuildId = new Map<Snowflake, MusicRouter>();

client.on("messageCreate", (msg: Message) => {
	var argObj: ParsedMessageRequest = parseMessage(msg);
	if (!argObj.success) {
		return;
	}

	const guildId = argObj.guildId;
	if (!RouterByGuildId.has(guildId)) {
		RouterByGuildId.set(guildId, new MusicRouter(guildId));
	}


	RouterByGuildId.get(guildId).execute(argObj);
});

process.on('uncaughtException', function(err) {
	console.error('Caught exception: ' + err.message);
});
