import { VoiceChannel, TextChannel, Message, User } from "discord.js";
import { Constants, ArgumentPassObject } from "./interfaces";
import { Settings } from "./settings";

declare const client;

export namespace Utils {
	export function getVoiceChannelByUserId(userId: string): VoiceChannel {
		return client.channels.find(channel => {
			const isVoiceChannel = channel.type === Constants.CHANNEL_TYPE_VOICE;
			const isUserInside = channel['members'] && channel['members'].keyArray().includes(String(userId));
			return isVoiceChannel && isUserInside;
		});
	}

	export function parseMessage(msg: Message): ArgumentPassObject {
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

	export function getAuthValue(key: string): string {
		let tokenValue: string = process.env[key];
		if (!tokenValue) {
			const token = require("../auth.json")[key];
			if (!token) {
				throw new Error(`Missing "${key}" token.`);
			}
			tokenValue = token;
		}

		return tokenValue;
	}
}
