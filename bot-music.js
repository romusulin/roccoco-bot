(function() {
    // Libs
    var _ = require("lodash");
    var ytdl = require('ytdl-core');
    var bhttp = require('bhttp');
    var Promise = require('bluebird');
    var reload = require("require-reload");

    //Imports
    var EmbedBuilder = require("./bot-music-embed.js");
    var YoutubeApiCaller = require("./bot-music-yt-api.js");
    var Controller = require("./bot-music-ctrl.js");
    var Constants = require("./bot-constants.js");
    var auth = require("./auth.json");
var isBotReset;
    /* PUBLIC METHODS */
    var reset = function() {
        return Promise.try(function() {
            Controller.dispatcher.end(Constants.LEAVE)
        }).then(function() {
            leave();
            Controller.nowPlaying = {};
            Controller.ytAudioQueue = [];
            Controller.ytAudioQueue.isCurrentlyPlaying = false;
            Controller.ytAudioQueue.isAutoPlayOn = false;
            Controller.request.userId = "";
            Controller.request.textChannel = {};
            Controller.nowPlaying.id = "";
            Controller.nowPlaying.snippet = {};
            Controller.currentVoiceChannel = {};
            return Promise.resolve(true);
        });
    };

    var init = function(argObj) {
        Controller.setRequest(argObj.authorId, argObj.channel);
        let vc = Controller.getVoiceChannelByUserId(argObj.authorId);
        if (Controller.currentVoiceChannel && Controller.currentVoiceChannel.name === vc.name) {
            return "I'm already in that channel.";
        }

        Controller.currentVoiceChannel = vc;

        if (Controller.currentVoiceChannel) {
            Controller.currentVoiceChannel.join();
            return "Joined voice channel: " + Controller.currentVoiceChannel.name;
        } else {
            return "Failed joining channel.";
        }
    }


    var leave = function() {
        if (!_.isEmpty(Controller.currentVoiceChannel)) {
            Controller.currentVoiceChannel.leave(Constants.LEAVE);
            let vcName = Controller.currentVoiceChannel.name;
            Controller.currentVoiceChannel = null;
            return "Left voice channel: " + vcName + ".";
        } else {
            return "I'm not in a channel.";
        }  
    }

    var play = function(argObj) {
        if (_.isEmpty(Controller.currentVoiceChannel)) {
            init(argObj);
        }

        return Promise.try(function() {
            return Promise.resolve(searchYoutube(argObj.args));
        }).then(function(obj) {
            let embed = EmbedBuilder.getPushedToQueue(obj);
            if(Controller.isCurrentlyPlaying) Controller.request.textChannel.send({embed});
            playStream();
            Promise.resolve(true);
        });
    };

    var skip = function() {
        Controller.dispatcher.end();
        return;
    };

    var showQueue = function() {
        let queueString = "Full queue:";
        let no = 0;
        _.each(Controller.ytAudioQueue, function(elem) {
            queueString += "\n" + ++no + ". " +  elem.snippet.title;
        });
        Controller.request.textChannel.send(queueString);
        return queueString;
    };

    var resume = function() {
        //TODO
        if (Controller.dispatcher) {
            Controller.dispatcher.resume();
        }
    };

    var pause = function() {
        //TODO
        if (Controller.dispatcher) {
            Controller.dispatcher.pause();
        }
    };

    var removeFromQueue = function(args) {
        let index = args[0] - 1;
        if (index => 0 && index < Controller.ytAudioQueue.length) {
            let obj = Controller.ytAudioQueue.splice(index, 1);
            let embed;
            if (obj.length === 0 ) {
                embed = EmbedBuilder.sendMessage("Index out of bounds.");
            } else {
                embed = EmbedBuilder.sendMessage("Removed " + obj[0].snippet.title + " from queue.");
            }
            Controller.request.textChannel.send({embed});
        }
    };

    var nowPlaying = function() {
        let embed = EmbedBuilder.getNowPlaying(Controller.nowPlaying);
        Controller.request.textChannel.send({embed});
    };

    var clearQueue = function() {
        Controller.ytAudioQueue = [];
        return Controller.request.textChannel.send("Queue cleared.");
    }

    var autoPlay = function(argObj) {
        if (_.isEmpty(Controller.currentVoiceChannel )) {
            init(argObj);
        }
        Controller.isAutoPlayOn = true;
        Promise.try(function() {
            return searchYoutube(argObj.args, true);
        }).then(function() {
            playStream();
        });
    };

    var autoPlayThis = function() {
        Controller.isAutoPlayOn = true;
        if (Controller.isCurrentlyPlaying) {
            Controller.autoplayPointer = Controller.nowPlaying;
            let embed = EmbedBuilder.sendMessage("Autoplay pointer set on: " + Controller.nowPlaying.snippet.title);
            Controller.request.textChannel.send({embed});
        }
    }

    var pingTextChannel = function() {
        Controller.request.textChannel.send("<@" + Controller.request.userId + "> Here I am!");
    };

    var showPlayedHistory = function() {
        let no = 0,
            page = 0,
            queueStrings = [];

        _.each(Controller.ytAudioHistory, function(elem) {
            if (page % 20 === 0) { page++ }
            queueString[page] += "\n" + ++no + ". " +  elem.snippet.title;
        });
        
        _.each(queueStrings, function(elem) {
            Controller.request.textChannel.send(elem); 
        });
        return Promise.resolve(); 
    }

    var useThisTextChannel = function(argObj) {
        Controller.setRequest(argObj.authorId, argObj.channel);
    };

    var turnAutoplayOff = function turnAutoplayOff() {
        Controller.isAutoPlayOn = false;
        Controller.autoplayPointer = {};
    };


    /* PRIVATE METHODS */
    function searchYoutube(searchKeywords, isAutoplayed) {
        // Allows the 2nd param to be dropped
        let isAutoPlayed = isAutoplayed ? isAutoplayed : false;

        return Promise.try(function() {
            return YoutubeApiCaller.getVideoIdByKeywords(searchKeywords);
        }).then(function(videoId) {
            return YoutubeApiCaller.getVideoWrapperById(videoId);
        }).then(function(retObj) {
            return Promise.resolve(Controller.pushToQueue(retObj));
        });
    };

    function findIdOfNextSongToPlay(array) {
        var item;
        for (i = 0; i < array.length; i++) {
              if (Controller.shouldPlayThisSong(array[i])) {
                let item = array[i];
                if (item.id.kind === Constants.YOUTUBE_KIND_VIDEO) {
                    return Promise.resolve(item.id.videoId);
                }   
                break;
            }
        }
        return Promise.reject("No suitable video found.");
    };

    function searchYoutubeRelated() {        
        return Promise.try(function() {
            return YoutubeApiCaller.getRelatedVideosById(Controller.autoplayPointer.id);
        }).then(function(arrayOfVideoWrappers) {
            return findIdOfNextSongToPlay(arrayOfVideoWrappers)
        }).then(function(videoId) {
            return YoutubeApiCaller.getVideoWrapperById(videoId);
        }).then(function(retObj) {
            return Promise.resolve(Controller.pushToQueue(retObj, true));      
        });
    }

    function playStream() {
        if (Controller.ytAudioQueue.length === 0
            || Controller.isCurrentlyPlaying
            || isBotReset
            || client.voiceConnections.first() === undefined) {
            return;
        }

        

        Promise.try(function() {
            if (Controller.shiftQueue() === undefined) {
                return Promise.reject("end of queue");
            }

            const stream = ytdl(Controller.nowPlaying.id, { filter: 'audioonly' });
            
            console.log("Streaming audio from " + Controller.nowPlaying.id + " (" + Controller.nowPlaying.snippet.title + ")");
            Controller.dispatcher = client.voiceConnections.first()
            .playStream(stream, { seek: 0, volume: 0.1 })
            .on('speaking', (isSpeaking) => {
                if (!isSpeaking) {
                    Controller.isCurrentlyPlaying = false;
                    Controller.dispatcher.end();
                    return;
                } else {
                    console.log("--> Dispatcher started speaking.");
                }
            })
            .on('end', (reason) => {
                console.log("--> Dispatcher ended:" + reason);
                Controller.isCurrentlyPlaying = false;
                if (reason === Constants.LEAVE) {
                    return Promise.resolve(true);
                }
                if (!Controller.isAutoPlayOn || Controller.ytAudioQueue.length !== 0) {
                    return playStream();   
                } else {
                    return Promise.try(function() {
                        return searchYoutubeRelated();
                    }).then(function() {
                        playStream();
                    });
                }     
            })
        })
        .catch(function(e) {
            console.log(e);
        });

        Controller.isCurrentlyPlaying = true;
        let embed = EmbedBuilder.getNowPlaying(Controller.nowPlaying);
        Controller.request.textChannel.send({embed});
    };

    /* EXPORTS */
    var music_module = {
        init: init,
        leave: leave,
        play: play,
        skip: skip,
        showQueue: showQueue,
        pause: resume,
        resume: resume,
        nowPlaying: nowPlaying,
        clearQueue: clearQueue,
        autoPlay: autoPlay,
        removeFromQueue: removeFromQueue,
        turnAutoplayOff: turnAutoplayOff,
        showPlayedHistory: showPlayedHistory,
        useThisTextChannel: useThisTextChannel,
        pingTextChannel: pingTextChannel,
        autoPlayThis: autoPlayThis,
        reset: reset
    };
    module.exports = music_module;
})();