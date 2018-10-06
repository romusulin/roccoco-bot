import { TextChannel, Message } from "discord.js";


export type SongId = string;

export interface Song {
	id: SongId;
	kind: string;
	snippet: Snippet;
	contentDetails: ContentDetails;
	progressInfo: ProgressInfo;
}

export interface ProgressInfo {

}
export interface UnparsedSong {
	id: {
		videoId: SongId;
		kind: string;
	};
	kind: string;
	snippet: Snippet;
	contentDetails: ContentDetails;
}
export interface Snippet {
	title: string;
	description: string;
	thumbnails: any;
	channelTitle: string;
}

export interface ContentDetails {
	duration: string;
}

export interface Request {
	userId: string;
	textChannel: TextChannel;
}

export interface ArgumentPassObject {
	success: boolean;
	command?: string;
	args?: string[];
	channel?: TextChannel;
	authorId?: string;
	message?: Message
}

export enum Commands {
	PLAY = "play",
	JOIN = "join",
	LEAVE = "leave",
	SKIP = "skip",
	QUEUE = "queue",
	AUTOPLAY_THIS = "autoplaythis",
	AUTOPLAY_OFF = "autoplayoff",
	USE_THIS_TEXT_CHANNEL = "usethistextchannel",
	NOW_PLAYING = "np",
	CLEAR_QUEUE = "cl",
	AUTOPLAY = "autoplay",
	REMOVE = "rm",
	SHOW_PLAYED_HISTORY = "history",
}

export enum Constants {
	PREFIX = "prefix",
	CHANNEL_TYPE_VOICE = "voice",
	CHANNEL_TYPE_TEXT = "text",
	PAUSE = "pause",
	RESUME = "resume",
	YOUTUBE_KIND_VIDEO = "youtube#video",
	DISPATCHER_EVENT_END = "end",
	DISPATCHER_EVENT_SPEAKING = "speaking"
};