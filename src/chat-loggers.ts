import { TextChannel, RichEmbed } from "discord.js";
import { EmbedBuilder } from "./embed-builder";
import { Song } from "./interfaces";

export class ChatLogger {
	isEnabled: boolean;
	textChannel: TextChannel;

	sendChangedAutoplayPointer(song: Song): void {
		const embed: RichEmbed = EmbedBuilder.getChangedAutoplayPointer(song);
		this.textChannel.send({embed});
	}

	sendTextMessage(text: string): void {
		this.textChannel.send(text);
	}

	sendMessage(text: string): void {
		const embed = EmbedBuilder.getMessageTemplate(text);
		this.textChannel.send({embed});
	}

	sendEnqueuedSong(song: Song): void {
		const embed: RichEmbed = EmbedBuilder.getEnqueuedSong(song);
		this.textChannel.send({embed});
	}

	sendRemovedSong(song: Song): void {
		const embed: RichEmbed = EmbedBuilder.getRemovedSong(song);
		this.textChannel.send({embed});
	}

	sendNowStartedPlaying(song: Song): void {
		const embed: RichEmbed = EmbedBuilder.getNowPlaying(song);
		this.textChannel.send({embed});
	}
}