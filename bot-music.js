(function() {
    // Libs
    var _ = require("lodash");
    var ytdl = require('ytdl-core');
    var bhttp = require('bhttp');
    var Promise = require('bluebird');

    //Imports
    var EmbedBuilder = require("./bot-music-embed.js");
    var Controller = require("./bot-music-ctrl.js");
    var Constants = require("./bot-constants.js");
    var auth = require("./auth.json");

    /* PUBLIC METHODS */
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
        searchYoutube(argObj.args);   
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
        searchYoutube(argObj.args, true);
    }

    var pingTextChannel = function() {
        Controller.request.textChannel.send("<@" + Controller.request.userId + "> Here I am!");
    };

    var showPlayedHistory = function() {
        let queueString = "Full history:";
        let no = 0;

        _.each(Controller.ytAudioHistory, function(elem) {
            queueString += "\n" + ++no + ". " +  elem.snippet.title;
        });
        
        return Controller.request.textChannel.send(queueString); 
    }

    var useThisTextChannel = function(argObj) {
        Controller.setRequest(argObj.authorId, argObj.channel);
    };

    var turnAutoplayOff = function turnAutoplayOff() {
        Controller.isAutoPlayOn = false;
        Controller.autoplayPointer = {};
    };
    /* PRIVATE METHODS */

    function searchYoutube(searchKeyWords) {
        searchYoutube(searchKeyWords, false);
    };


    
    function searchYoutube(searchKeywords, isAutoplayed) {
        let requestUrl = 'https://www.googleapis.com/youtube/v3/search' 
            + `?part=snippet&q=${escape(searchKeywords)}`
            + `&key=${auth.youtube_api_key}`;

        Promise.try(function() {
            return bhttp.get(requestUrl);

        }).then(function(response) {
            let body = response.body;
            if (body.items.length === 0) {
                throw Error("Query returned 0 results.");
            }
            
            let item = body.items[0];
            if (item.id.kind === Constants.YOUTUBE_KIND_VIDEO) {
                console.log("Added " + item.snippet.title + " to queue.");
                let retObj = {
                    id: item.id.videoId,
                    snippet: item.snippet
                };

                let embed = EmbedBuilder.getPushedToQueue(retObj);
                if(Controller.isCurrentlyPlaying) Controller.request.textChannel.send({embed});

                return retObj;
            }
        }).then(function(retObj) {
            Controller.pushToQueue(retObj, isAutoplayed);
            return retObj;
        }).then(function(retObj) {
            let requestUrl = 'https://www.googleapis.com/youtube/v3/videos?'
            + `id=${retObj.id}`
            + `&key=${auth.youtube_api_key}`
            + `&part=contentDetails`;
            return bhttp.get(requestUrl);         
        }).then(function(response) {
            Controller.ytAudioQueue
                .find( x => x.id === response.body.items[0].id)
                .contentDetails = response.body.items[0].contentDetails;
            return;
        }).then(function(isFound) { 
            return playStream();
        });
    };

    function searchYoutubeRelated() {
        var requestUrl = "https://www.googleapis.com/youtube/v3/search"
            + `?part=snippet&relatedToVideoId=${Controller.autoplayPointer.id}`
            + `&type=video&key=${auth.youtube_api_key}`;

        
        Promise.try(function() {
            return bhttp.get(requestUrl);
        }).then(function(response) {
            let body = response.body;
            if (body.items.length === 0) {
                Controller.request.textChannel.send("Query returned 0 results.");
            }

            var item;
            for (i = 0; i < body.items.length; i++) {
                  if (Controller.shouldPlayThisSong(body.items[i])) {
                      item = body.items[i];
                      break;
                  }
            }

            if (item.id.kind === Constants.YOUTUBE_KIND_VIDEO) {
                console.log("Added " + item.snippet.title + " to queue.");
                return {
                    id: item.id.videoId,
                    snippet: item.snippet
                };
            }
        }).then(function(retObj) {
            Controller.pushToQueue(retObj, true);
            return retObj;
        }).then(function(retObj) {
            let requestUrl = 'https://www.googleapis.com/youtube/v3/videos?'
            + `id=${retObj.id}`
            + `&key=${auth.youtube_api_key}`
            + `&part=contentDetails`;
            return bhttp.get(requestUrl);         
        }).then(function(response) {
            return Controller.ytAudioQueue
                .find( x => x.id === response.body.items[0].id)
                .contentDetails = response.body.items[0].contentDetails;
        }).then(function() { 
            return playStream();
        });
    }

    function playStream() {
        if (Controller.ytAudioQueue.length === 0
            || Controller.isCurrentlyPlaying) {
            return;
        }

        

        Promise.try(function() {
            return Controller.shiftQueue();
        }).then(function() {
            return ytdl(Controller.nowPlaying.id, { filter: 'audioonly' });
        }).then(function(stream) {
            Controller.dispatcher = client.voiceConnections.first()
            .playStream(stream, { seek: 0, volume: 0.1 })
            .on('start', () => {
                console.log("--> Dispatcher started speaking.")
            })
            .on('speaking', (isSpeaking) => {
                if (!isSpeaking) {
                    Controller.isCurrentlyPlaying = false;
                    Controller.dispatcher.end();
                    return;
                }
            })
            .on('end', (reason) => {
                console.log("--> Dispatcher ended:" + reason);
                Controller.isCurrentlyPlaying = false;
                if (reason === Constants.LEAVE) {
                    return;
                }
                if (!Controller.isAutoPlayOn || Controller.ytAudioQueue.length !== 0) {
                    return playStream();   
                } else {
                    return searchYoutubeRelated();
                }     
            })
        });
        
        console.log("Streaming audio from " + Controller.nowPlaying.id + " (" + Controller.nowPlaying.snippet.title + ")");

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
        turnAutoplayOff: turnAutoplayOff,
        showPlayedHistory: showPlayedHistory,
        useThisTextChannel: useThisTextChannel,
        pingTextChannel: pingTextChannel
    };
    module.exports = music_module;
})();