import { Song } from "./interfaces";
import { RichEmbed } from "discord.js";

declare const Discord: any;

export class EmbedBuilder {

    static getBasicSongTemplate(song: Song): RichEmbed {
        const embed = new Discord.RichEmbed()
        .setAuthor("Military Spec Battle Worn Bot", "https://i.redditmedia.com/21uJy-0Ptmt1HLSnkPar37ScvmUCeOXyj1DeqZ-JURY.jpg?w=432&s=e7fdfac555c5fbcc68a36fad051bb7d0")
        .setColor(0x7851a9)
        .setThumbnail(song.snippet.thumbnails.high.url)
        .setTimestamp()
        .addField("Song:", song.snippet.title)
        .addField("Channel:", song.snippet.channelTitle)
        .addField("Duration", song.contentDetails.duration)
        .setFooter("RoccocoBot", 
        "https://i.redditmedia.com/21uJy-0Ptmt1HLSnkPar37ScvmUCeOXyj1DeqZ-JURY.jpg?w=432&s=e7fdfac555c5fbcc68a36fad051bb7d0"
        );

        return embed;
    }

    static getEnqueuedSong(song: Song): RichEmbed {
        const embed = EmbedBuilder.getBasicSongTemplate(song)
        .setTitle("Enqueued song:");

        return embed;
    }

    static getChangedAutoplayPointer(song: Song): RichEmbed {
        const embed = EmbedBuilder.getBasicSongTemplate(song)
        .setTitle("Autoplay pointer is set to:");

        return embed;
    }

    static getNowPlaying(song: Song): RichEmbed {
        const embed = EmbedBuilder.getBasicSongTemplate(song)
        .setTitle("RoccocoBot is now playing:");
        
        return embed;
    }

    static getRemovedSong(song: Song): RichEmbed {
        const embed = EmbedBuilder.getBasicSongTemplate(song)
        .setTitle("Removed the following song:");
        
        return embed;
    }

    static getMessageTemplate(message: string) {
        const embed = new Discord.RichEmbed()
        .setAuthor("Military Spec Battle Worn Bot", "https://i.redditmedia.com/21uJy-0Ptmt1HLSnkPar37ScvmUCeOXyj1DeqZ-JURY.jpg?w=432&s=e7fdfac555c5fbcc68a36fad051bb7d0")
        .setColor(0x7851a9)
        .setThumbnail("https://picsum.photos/200/200/?image=" + Math.floor(Math.random() * 1000))
        .setDescription(message)
        .setTimestamp()
        .setFooter("RoccocoBot", 
        "https://i.redditmedia.com/21uJy-0Ptmt1HLSnkPar37ScvmUCeOXyj1DeqZ-JURY.jpg?w=432&s=e7fdfac555c5fbcc68a36fad051bb7d0"
        );

        return embed;
    }
}