// Libs
import * as _ from "lodash";

//Imports
import { MusicController } from "./music-ctrl";
import { ArgumentPassObject, Song } from "./interfaces";
import { Utils } from "./utils";
import { ChatLogger } from "./chat-loggers";

export class MusicRouter {
    Controller: MusicController;
    Messager: ChatLogger;
    
    async init(argObj: ArgumentPassObject): Promise<void> {
        this.Messager = new ChatLogger();
        this.Messager.textChannel = argObj.channel;

        await this.Controller.setVoiceConnection(await Utils.getVoiceChannelByUserId(argObj.authorId));

        this.Controller.streamDispatcherListeners.push((isSpeaking) => {
            if (isSpeaking) {
                this.Messager.sendNowStartedPlaying(this.Controller.currentSong);
            }
        });
    }

    nowPlaying() {
        this.Messager.sendTextMessage(`Skipping song: ${this.Controller.currentSong.snippet.title}`);
    }

    clearQueue() {
        const noOfRemovedSongs: number = this.Controller.clearQueue();
        this.Messager.sendTextMessage(`Queue cleared.\nRemoved ${noOfRemovedSongs} song${(noOfRemovedSongs > 1 ? "s" : "")}.`);
    }

    autoplayCurrentSong() {
        this.Controller.autoplayCurrentSong();
        this.Messager.sendChangedAutoplayPointer(this.Controller.currentSong);
    }

    useThisTextChannel(argObj) {
        this.Messager.textChannel = argObj.channel;
    }

    turnAutoplayOff() {
         this.Controller.setIsAutoplayOn(false);
         this.Messager.sendMessage("Autoplay is turned off");
    }

    skip() {
        this.Controller.skip();
    }

    leave() {
        if (!_.isEmpty(this.Controller.voiceConnection)) {
            this.Controller.leaveVoiceChannel();
        }
    }

    async play(argObj: ArgumentPassObject, isAutoplay: boolean) {
        const enqueuedSong: Song = await this.Controller.pushToQueue(argObj.args, isAutoplay);
        if (this.Controller.isNowPlaying) {
            this.Messager.sendEnqueuedSong(enqueuedSong);
        } else {
            this.Controller.play();
        }
    };
    
    removeFromQueue(args) {
        let index: number = args[0] - 1;
        try {
            const removedSong: Song = this.Controller.removeIndex(index);
            this.Messager.sendRemovedSong(removedSong);
        } catch (error) {
            this.Messager.sendMessage(error.message);
        }
    }
    
    showPlayedHistory() {
        const queue: Song[] = this.Controller.audioHistory;
        let message: string = "";
        let i: number = 1;

        for (let song of queue) {
            message += `${i++}. ${song.snippet.title} | ${song.contentDetails.duration} | From: ${song.snippet.channelTitle}`;

            if (i === queue.length || (i > 0 && i % 100 === 0)) {
                this.Messager.sendTextMessage(message);
                message = "";
            }
        }
    }

    showQueue() {
        const queue: Song[] = this.Controller.audioQueue;
        let message: string = "";
        let i: number = 1;

        for (let song of queue) {
            message += `${i}. ${song.snippet.title} | ${song.contentDetails.duration}`;

            if (i === queue.length || (i > 0 && i % 100 === 0)) {
                this.Messager.sendTextMessage(message);
                message = "";
            }
        }
    }
}