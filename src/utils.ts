import { VoiceChannel, TextChannel, Message } from "discord.js";
import { Constants, ArgumentPassObject } from "./interfaces";
import { Settings } from "./settings";

declare const client;

export class Utils {
	static getVoiceChannelByUserId(userId: string): VoiceChannel {
		return client.channels.find(x => {
			return x['members'] && x['members'].keyArray().includes(String(userId))
				&& x.type === Constants.CHANNEL_TYPE_VOICE;
		});
	}

	static parseMessage(msg: Message): ArgumentPassObject {
		let sourceMsg = msg.content;
		var retObj: ArgumentPassObject = {
			success: false
		};

		if (sourceMsg.startsWith(Settings.CommandPrefix)) {
			var allArgs = sourceMsg.substring(Settings.CommandPrefix.length).split(" ");

			retObj.success = true;
			retObj.command = allArgs[0];
			retObj.args = allArgs.splice(1);
			retObj.guildId = msg.guild.id;
			retObj.channel = <TextChannel> msg.channel;
			retObj.authorId = msg.author.id;
			retObj.message = msg;
		}

		return retObj;
	}
}