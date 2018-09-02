import { TextChannel } from "discord.js";


export enum SongId { }

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
    cmd?: string;
    args?: string[];
    channel?: TextChannel;
    authorId?: string;
}

export enum Constants {
    PREFIX = "prefix",
    PING = "ping",
    PLAY = "play",
    JOIN = "join",
    LEAVE = "leave",
    SKIP = "skip",
    QUEUE = "queue",
    CHANNEL_TYPE_VOICE = "voice",
    CHANNEL_TYPE_TEXT = "text",
    PAUSE = "pause",
    RESUME = "resume",
    SHUT_DOWN = "shutdown",
    GAME = "game",
    NOW_PLAYING = "np",
    CLEAR_QUEUE = "cl",
    AUTOPLAY = "autoplay",
    AUTOPLAY_THIS = "autoplaythis",
    AUTOPLAY_OFF = "autoplayoff",
    SHOW_PLAYED_HISTORY = "history",
    USE_THIS_TEXT_CHANNEL = "usethistextchannel",
    PING_TEXT_CHANNEL = "pingtextchannel",
    YOUTUBE_KIND_VIDEO = "youtube#video",
    REMOVE = "rm",
    NUDGE = "nudge",
    DISPATCHER_EVENT_END = "end",
    DISPATCHER_EVENT_SPEAKING = "speaking"
};