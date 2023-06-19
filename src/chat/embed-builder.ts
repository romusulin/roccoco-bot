import { EmbedBuilder as DjsEmbedBuilder } from "@discordjs/builders";
import { Song } from "../interfaces/song";

declare const Discord: any;

export class EmbedBuilder {

	static getBasicSongTemplate(song: Song): DjsEmbedBuilder {
		const embed = new DjsEmbedBuilder()
		.setTitle("Military Spec Battle Worn Bot")
		.setAuthor({
			name: "Roccoco Bot",
			iconURL: "https://i.redditmedia.com/21uJy-0Ptmt1HLSnkPar37ScvmUCeOXyj1DeqZ-JURY.jpg?w=432&s=e7fdfac555c5fbcc68a36fad051bb7d0" })
		.setColor(0x7851a9)
		.setThumbnail(song.snippet.thumbnails.high.url)
		.setTimestamp()
		.addFields(<any> { name: "Song:", value: song.snippet.title },
			<any>{ name: "Channel:", value: song.snippet.channelTitle },
			<any> { name: "Duration:", value: song.contentDetails.duration }
		)
		.setFooter({ text: "Roccoco Bot", iconURL: "https://i.redditmedia.com/21uJy-0Ptmt1HLSnkPar37ScvmUCeOXyj1DeqZ-JURY.jpg?w=432&s=e7fdfac555c5fbcc68a36fad051bb7d0" });

		return embed;
	}

	static getEnqueuedSong(song: Song): DjsEmbedBuilder {
		const embed = EmbedBuilder.getBasicSongTemplate(song)
		.setTitle("Enqueued song:");

		return embed;
	}

	static getChangedAutoplayPointer(song: Song): DjsEmbedBuilder {
		const embed = EmbedBuilder.getBasicSongTemplate(song)
		.setTitle("Autoplay pointer is set to:");

		return embed;
	}

	static getNowPlaying(song: Song): DjsEmbedBuilder {
		const embed = EmbedBuilder.getBasicSongTemplate(song)
		.setTitle("RoccocoBot is now playing:");

		return embed;
	}

	static getRemovedSong(song: Song): DjsEmbedBuilder {
		const embed = EmbedBuilder.getBasicSongTemplate(song)
		.setTitle("Removed the following song:");

		return embed;
	}

	static getMessageTemplate(message: string) {
		const embed = new DjsEmbedBuilder()
		.setTitle("Military Spec Battle Worn Bot")
		.setAuthor({name: "Roccoco Bot", iconURL: "https://i.redditmedia.com/21uJy-0Ptmt1HLSnkPar37ScvmUCeOXyj1DeqZ-JURY.jpg?w=432&s=e7fdfac555c5fbcc68a36fad051bb7d0"})
		.setColor(0x7851a9)
		.setThumbnail("https://picsum.photos/200/200/?image=" + Math.floor(Math.random() * 1000))
		.setDescription(message)
		.setTimestamp()
		.setFooter({
			text: "Roccoco Bot",
			iconURL: "https://i.redditmedia.com/21uJy-0Ptmt1HLSnkPar37ScvmUCeOXyj1DeqZ-JURY.jpg?w=432&s=e7fdfac555c5fbcc68a36fad051bb7d0"
		});

		return embed;
	}
}