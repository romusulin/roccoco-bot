import * as _ from "lodash";
import { Song, Request, Constants } from "./interfaces";
import { VoiceChannel, TextChannel, StreamDispatcher } from "discord.js";

declare const client;
declare const console;
export class MusicService {
    currentVoiceChannel: VoiceChannel;
    isCurrentlyPlaying: boolean;
    isAutoPlayOn: Boolean;
    ytAudioQueue : Song[] = [];
    ytAudioHistory: Song[] = [];
    autoplayPointer: Song;
    dispatcher: StreamDispatcher;
    request: Request = <Request> {};
    nowPlaying: Song;

    setRequest(authorId: string, textChannel: TextChannel): void {
        this.request.userId = authorId;
        this.request.textChannel = textChannel;
    }

    getVoiceChannelByUserId(): VoiceChannel {
        return client.channels.find(x => { 
            return x['members'].keyArray().includes(String(this.request.userId))
                && x.type === Constants.CHANNEL_TYPE_VOICE; 
        });
    };

    pushToQueue(song: Song, isAutoplayed: Boolean): Promise<Song> {
        this.ytAudioQueue.push(song);
        this.ytAudioHistory.push(song);
        if (isAutoplayed) {
            this.autoplayPointer = song;
        }
        return Promise.resolve(song);
    };
    
    shiftQueue(): Song {
        let retObj = this.ytAudioQueue.shift();
        this.nowPlaying = retObj;
        return retObj;
    };

    shouldPlayThisSong(item): Boolean {
        if (item === undefined || _.isEmpty(item) || item.id === undefined) {
            return false;
        }
        
        for (let ytHistoryElem of this.ytAudioHistory) {
            if (item.id.videoId === ytHistoryElem.id) {
                return false;
            }
        }

        return true;
    };
}