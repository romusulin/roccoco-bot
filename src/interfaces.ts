import { TextChannel } from "discord.js";

export interface Song {
    id: string;
    kind: string;
    snippet: Snippet;
    contentDetails: ContentDetails;
}

export interface SongRaw {
    id: string;
    kind: string;
    snippet: Snippet;
    contentDetails: ContentDetails;
}


export interface Snippet {
    title: string;
    description: string;
    thumbnail: string;
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
    CHECKED_HISTORY_SIZE = 15,
    SHOW_PLAYED_HISTORY = "playedhistory",
    USE_THIS_TEXT_CHANNEL = "usethistextchannel",
    PING_TEXT_CHANNEL = "pingtextchannel",
    YOUTUBE_KIND_VIDEO = "youtube#video",
    REMOVE = "rm",
    NUDGE = "nudge"
};