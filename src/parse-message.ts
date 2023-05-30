import {Message, TextChannel} from "discord.js";
import {ParsedMessageRequest} from "./parsed-message-request";
export function parseMessage(msg: Message): ParsedMessageRequest {
	const sourceMsg = msg.content;
	const retObj: ParsedMessageRequest = {
		success: false
	};

	if (sourceMsg.startsWith("!")) {
		var allArgs = sourceMsg.substring(1).split(" ");

		retObj.success = true;
		retObj.command = allArgs[0];
		retObj.args = allArgs.splice(1);
		retObj.guildId = msg.guild.id;
		retObj.channel = <TextChannel>msg.channel;
		retObj.authorId = msg.author.id;
		retObj.message = msg;
	}

	return retObj;
}
