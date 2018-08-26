declare const console;
declare const client;

// Libs
import * as _ from "lodash";
import * as ytdl from "ytdl-core";

//Imports
import { EmbedBuilder } from "./bot-music-embed";
import { YoutubeApiCaller } from "./bot-music-yt-api";
import { MusicService } from "./bot-music-ctrl";
import { Constants, Song } from "./interfaces";



export class MusicManagement {
    private Controller = new MusicService();

    /* PUBLIC METHODS */
    async init(argObj) {
        this.Controller.setRequest(argObj.authorId, argObj.channel);
        let vc = this.Controller.getVoiceChannelByUserId();
        if (this.Controller.currentVoiceChannel &&  this.Controller.currentVoiceChannel.name === vc.name) {
            return "I'm already in that channel.";
        }

         this.Controller.currentVoiceChannel = vc;

        if ( this.Controller.currentVoiceChannel) {
             this.Controller.currentVoiceChannel.join();
            return "Joined voice channel: " +  this.Controller.currentVoiceChannel.name;
        } else {
            return "Failed joining channel.";
        }
    }

    leave() {
        if (!_.isEmpty( this.Controller.currentVoiceChannel)) {
            this.Controller.currentVoiceChannel.leave();
            let vcName =  this.Controller.currentVoiceChannel.name;
            this.Controller.currentVoiceChannel = null;
            return "Left voice channel: " + vcName + ".";
        } else {
            return "I'm not in a channel.";
        }  
    }
    
    async autoPlay(argObj) {
        if (_.isEmpty( this.Controller.currentVoiceChannel )) {
            this.init(argObj);
        }
        this.Controller.isAutoPlayOn = true;

        const obj = await this.searchYoutube(argObj.args, true);
        this.playStream();
    };

    async play(argObj) {
        if (_.isEmpty(this.Controller.currentVoiceChannel)) {
            this.init(argObj);
        }

        const obj = await this.searchYoutube(argObj.args);
        let embed = EmbedBuilder.getPushedToQueue(obj);
        if (this.Controller.isCurrentlyPlaying) {
            this.Controller.request.textChannel.send({ embed });
        }
        
        this.playStream();
    };

    skip() {
         this.Controller.dispatcher.end();
        return;
    };

    showQueue() {
        let queueString = "Full queue:";
        let no = 0;
        _.each( this.Controller.ytAudioQueue, function(elem) {
            queueString += "\n" + ++no + ". " +  elem.snippet.title;
        });
         this.Controller.request.textChannel.send(queueString);
        return queueString;
    };
    //TODO
    resume() {
        if ( this.Controller.dispatcher) {
             this.Controller.dispatcher.resume();
        }
    };
    //TODO
    pause() {
        if ( this.Controller.dispatcher) {
             this.Controller.dispatcher.pause();
        }
    };

    removeFromQueue(args) {
        let index = args[0] - 1;
        if (index => 0 && index <  this.Controller.ytAudioQueue.length) {
            let obj =  this.Controller.ytAudioQueue.splice(index, 1);
            let embed;
            if (obj.length === 0 ) {
                embed = EmbedBuilder.sendMessage("Index out of bounds.");
            } else {
                embed = EmbedBuilder.sendMessage("Removed " + obj[0].snippet.title + " from queue.");
            }
             this.Controller.request.textChannel.send({embed});
        }
    };

    nowPlaying() {
        let embed = EmbedBuilder.getNowPlaying( this.Controller.nowPlaying);
         this.Controller.request.textChannel.send({embed});
    };

    clearQueue() {
         this.Controller.ytAudioQueue = [];
        return  this.Controller.request.textChannel.send("Queue cleared.");
    }

    autoPlayThis() {
        this.Controller.isAutoPlayOn = true;
        if ( this.Controller.isCurrentlyPlaying) {
            this.Controller.autoplayPointer =  this.Controller.nowPlaying;
            let embed = EmbedBuilder.sendMessage("Autoplay pointer set on: " +  this.Controller.nowPlaying.snippet.title);
            this.Controller.request.textChannel.send({embed});
        }
    }

    pingTextChannel() {
         this.Controller.request.textChannel.send("<@" +  this.Controller.request.userId + "> Here I am!");
    };

    showPlayedHistory() {
        let no = 0,
            page = 0,
            queueStrings = [];

        _.each( this.Controller.ytAudioHistory, function(elem) {
            if (no % 20 === 0 && no !== 0) { page++ }
            queueStrings[page] += "\n" + ++no + ". " +  elem.snippet.title;
        });
        
        _.each(queueStrings, function(elem) {
             this.Controller.request.textChannel.send(elem); 
        });
        return Promise.resolve(); 
    }

    useThisTextChannel(argObj) {
         this.Controller.setRequest(argObj.authorId, argObj.channel);
    };

    turnAutoplayOff() {
         this.Controller.isAutoPlayOn = false;
         this.Controller.autoplayPointer = <Song> null;
    };


    /* PRIVATE METHODS */
    async searchYoutube(searchKeywords: string[], isAutoplayed?: boolean) {
        if (isAutoplayed === undefined) {
            isAutoplayed = false;
        }

        const videoId = await YoutubeApiCaller.getVideoIdByKeywords(searchKeywords);
        const song: Song = await YoutubeApiCaller.getVideoWrapperById(videoId);
        return this.Controller.pushToQueue(song, isAutoplayed);
    };

    findIdOfNextSongToPlay(array: Song[]): string {
        for (let i = 0; i < array.length; i++) {
              if (this.Controller.shouldPlayThisSong(array[i])) {
                let item = array[i];
                if (item.id["kind"] === Constants.YOUTUBE_KIND_VIDEO) {
                    return item.id["videoId"];
                }   
                break;
            }
        }
        return "No suitable video found.";
    };

    async searchYoutubeRelated() {        
        const songs: Song[] = await YoutubeApiCaller.getRelatedVideosById(this.Controller.autoplayPointer.id);

        let id: string = await this.findIdOfNextSongToPlay(songs);
        let song: Song = await YoutubeApiCaller.getVideoWrapperById(id);

        return this.Controller.pushToQueue(song, true);  
    }

    playStream() {
        if ( this.Controller.ytAudioQueue.length === 0
            ||  this.Controller.isCurrentlyPlaying
            || client.voiceConnections.first() === undefined) {
            return;
        }

        if ( this.Controller.shiftQueue() === undefined) {
            throw new Error("end of queue");
        }

        const stream = ytdl(this.Controller.nowPlaying.id, { filter: 'audioonly' });
        
        this.Controller.isCurrentlyPlaying = true;
        let embed = EmbedBuilder.getNowPlaying( this.Controller.nowPlaying);
        this.Controller.request.textChannel.send({embed});

        console.log("Streaming audio from " +  this.Controller.nowPlaying.id + " (" +  this.Controller.nowPlaying.snippet.title + ")");
        this.Controller.dispatcher = client.voiceConnections.first()
        .playStream(stream, { seek: 0, volume: 0.1 })
        .on('speaking', (isSpeaking) => {
            if (!isSpeaking && this.Controller) {
                this.Controller.isCurrentlyPlaying = false;
                this.Controller.dispatcher.end();
            } else {
                console.log("--> Dispatcher started speaking.");
            }
        })
        .on('end', async (reason) => {
            console.log("--> Dispatcher ended:" + reason);

            this.Controller.isCurrentlyPlaying = false;

            if (reason === Constants.LEAVE) {
                return true;
            }

            if (!this.Controller.isAutoPlayOn ||  this.Controller.ytAudioQueue.length !== 0) {
                this.playStream();   
            } else {
                await this.searchYoutubeRelated();
                this.playStream();
            }     
        });
    };

    // TODO
    reset() {
        return new Promise((resolve, reject) => {
            if ( this.Controller.dispatcher !== undefined) {
                 this.Controller.dispatcher.end(Constants.LEAVE);
            }
        }).then(function() {
            this.leave();
             this. this.Controller.nowPlaying = {};
             this.Controller.ytAudioQueue = [];
             this.Controller.ytAudioQueue.isCurrentlyPlaying = false;
             this.Controller.ytAudioQueue.isAutoPlayOn = false;
             this.Controller.request.userId = "";
             this.Controller.request.textChannel = {};
             this.Controller.nowPlaying.id = "";
             this.Controller.nowPlaying.snippet = {};
             this.Controller.currentVoiceChannel = {};
            return true;
        });
    };
}