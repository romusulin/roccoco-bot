import { TextChannel, RichEmbed } from "discord.js";
import { EmbedBuilder } from "./embed-builder";
import { Song } from "./interfaces";

export class ChatLogger {
    isEnabled: boolean;
    textChannel: TextChannel;

    sendChangedAutoplayPointer(song: Song): void {
        let embed: RichEmbed = EmbedBuilder.getChangedAutoplayPointer(song);
        this.textChannel.send({embed});
    }

    sendTextMessage(text: string) {
        this.textChannel.send(text);
    }

    sendMessage(text: string) {
        let embed = EmbedBuilder.getMessageTemplate(text);
        this.textChannel.send({embed});
    }

    sendEnqueuedSong(song: Song) {
        let embed: RichEmbed = EmbedBuilder.getEnqueuedSong(song);
        this.textChannel.send({embed});
    }

    sendRemovedSong(song: Song) {
        let embed: RichEmbed = EmbedBuilder.getRemovedSong(song);
        this.textChannel.send({embed});
    }

    sendNowStartedPlaying(song: Song) {
        let embed: RichEmbed = EmbedBuilder.getNowPlaying(song);
        this.textChannel.send({embed});
    }

    getSkippedSong(song: Song) {

    }
}