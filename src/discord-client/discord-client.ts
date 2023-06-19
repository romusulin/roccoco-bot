import { Client, Message, Snowflake } from "discord.js";
import { ParsedMessageRequest } from "../interfaces/parsed-message-request";
import { parseMessage } from "../chat/parse-message";
import { MusicController } from "../music/controller";
import { MusicControllerWrapper } from "./music-controller-wrapper";
import { INTENTS } from "./intents";

export const controllerWrapperByGuildId = new Map<Snowflake, MusicControllerWrapper>();
export const controllerByGuildId = new Map<Snowflake, MusicController>();


const client = new Client({intents: INTENTS});

client.on("ready", () => {
	console.log(`Logged in as ${client.user.tag}!`);
});

client.on("messageCreate", (msg: Message) => {
	var argObj: ParsedMessageRequest = parseMessage(msg);
	if (!argObj.success) {
		return;
	}

	const guildId = argObj.guildId;
	if (!controllerWrapperByGuildId.has(guildId)) {
		const controller = new MusicController(guildId);
		controllerByGuildId.set(guildId, controller);
		controllerWrapperByGuildId.set(guildId, new MusicControllerWrapper(controller));
	}


	controllerWrapperByGuildId.get(guildId).execute(argObj);
});

client.login(process.env.DISCORD_TOKEN);