import { TextChannel } from "discord.js";
import { EmbedBuilder } from "./embed-builder";
import { Song } from "../interfaces/song";

export class ChatLogger {
	isEnabled: boolean;
	textChannel: TextChannel;

	sendChangedAutoplayPointer(song: Song) {
		const embed = EmbedBuilder.getChangedAutoplayPointer(song);

		return this.textChannel.send({embeds: [embed]});
	}

	sendTextMessage(text: string) {
		return this.textChannel.send(text);
	}

	sendMessage(text: string) {
		const embed = EmbedBuilder.getMessageTemplate(text);

		return this.textChannel.send({embeds: [embed]});
	}

	sendEnqueuedSong(song: Song) {
		const embed = EmbedBuilder.getEnqueuedSong(song);

		return this.textChannel.send({embeds: [embed]});
	}

	sendRemovedSong(song: Song) {
		const embed = EmbedBuilder.getRemovedSong(song);

		return this.textChannel.send({embeds: [embed]});
	}

	sendNowStartedPlaying(song: Song) {
		const embed = EmbedBuilder.getNowPlaying(song);

		return this.textChannel.send({embeds: [embed]});
	}
}