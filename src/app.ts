import * as express from 'express';
import { parseMessage } from "./parse-message";

declare const global;

import {MusicRouter} from "./router";
import {Client, Message, Snowflake} from "discord.js";
import {GatewayIntentBits} from "discord-api-types/v10";
import {ParsedMessageRequest} from "./parsed-message-request";
import * as path from "path";

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

const app = express();
app.use(express.static('client/dist'));
app.get('/', (req, res) => {
	const indexPath = path.join(__dirname, 'client/dist/index.html');
	res.sendFile(indexPath);
});

const PORT = parseInt(process.env.PORT) || 8080;
app.listen(PORT, () => {
	console.log(`App running on port ${PORT}`);
});