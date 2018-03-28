(function() {
    // Libs
    var _ = require("lodash");
    var ytdl = require('ytdl-core');
    var bhttp = require('bhttp');
    var Promise = require('bluebird');

    //Imports
    var Controller = require("./bot-music-ctrl.js");
    var Constants = require("./bot-constants.js");
    var auth = require("./auth.json");

    var isAutoPlayOn = false;


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
        console.log("Skipped.");
        playStream(true);
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
        Controller.request.textChannel.send(
            "Now playing:"
            + "\nTitle: " + Controller.nowPlaying.snippet.title
            + "\nDescription: " + Controller.nowPlaying.snippet.description
        );
    };

    var clearQueue = function() {
        Controller.ytAudioQueue = [];
        return Controller.request.textChannel.send("Queue cleared.");
    }

    var autoPlay = function(argObj) {
        if (_.isEmpty(Controller.currentVoiceChannel )) {
            init(argObj);
        }
        isAutoPlayOn = true;
        searchYoutube(argObj.args);
    }

    var showPlayedHistory = function() {
        let queueString = "Full history:";
        let no = 0;
        _.each(Controller.ytAudioHistory, function(elem) {
            queueString += "\n" + ++no + ". " +  elem.snippet.title;
        });
        Controller.request.textChannel.send(queueString);
        return queueString;
    }

    var useThisTextChannel = function(argObj) {
        Controller.setRequest(argObj.authorId, argObj.channel);
    }
    /* PRIVATE METHODS */

    function searchYoutube(searchKeywords) {
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
            if (item.id.kind === 'youtube#video') {
                console.log("Added " + item.snippet.title + " to queue.");
                return {
                    id: item.id.videoId,
                    snippet: item.snippet
                };
                if (!isAutoPlayOn) Controller.request.textChannel.send("Pushed " + item.snippet.title + " to queue.");
            }
        }).then(function(retObj) {
            Controller.pushToQueue(retObj);
        }).then(function(isFound) { 
            playStream();
        });
    };

    function searchYoutubeRelated() {
        var requestUrl = "https://www.googleapis.com/youtube/v3/search"
            + `?part=snippet&relatedToVideoId=${Controller.nowPlaying.id}`
            + `&type=video&key=${auth.youtube_api_key}`;

        
        Promise.try(function() {
            return bhttp.get(requestUrl);
        }).then(function(response) {
            let body = response.body;
            if (body.items.length === 0) {
                throw Error("Query returned 0 results.");
            }

            var item;
            for (i = 0; i < body.items.length; i++) {
                  if (shouldPlayThisSong(body.items[i])) {
                      item = body.items[i];
                      break;
                  }
            }

            if (item.id.kind === 'youtube#video') {
                console.log("Added " + item.snippet.title + " to queue.");
                return {
                    id: item.id.videoId,
                    snippet: item.snippet
                };
            }
        }).then(function(retObj) {
            Controller.pushToQueue(retObj);
        }).then(function(isFound) { 
            playStream();
        });
    }

    function shouldPlayThisSong(item) {
        let retVal = true;

        if (item === undefined || _.isEmpty(item) || item.id === undefined) {
            return false;
        }
        // Gets n last elements of yt audio history to check
        _.each(Controller.ytAudioHistory.slice(Constants.CHECKED_HISTORY_SIZE * -1), function(ytElem) {
            if(item.id.videoId === ytElem.id) {
                retVal = false;
            }
        });

        return retVal;
    };

    function playStream() {
        playStream(false);
    };

    function playStream(isSkipInitiated) {
        if (isSkipInitiated) {
            Controller.dispatcher.end();
            return;
        }
        if (Controller.ytAudioQueue.length === 0
            || Controller.shiftQueue() === undefined
            || Controller.isCurrentlyPlaying
            ) {
            return;
        }

        const stream = ytdl(Controller.nowPlaying.id, { filter: 'audioonly' });
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
                if (!isAutoPlayOn) {
                    playStream();
                    return;   
                } else {
                    Promise.try(function() {
                        return searchYoutubeRelated();
                    }).then(function() {
                        return playStream();
                    });
                }     
            })
            .on('error', (e) => {
                console.log("--> Dispatcher encountered error: " + e);
            });

        console.log("Streaming audio from " + Controller.nowPlaying.id + " (" + Controller.nowPlaying.snippet.title + ")");

        Controller.isCurrentlyPlaying = true;
        Controller.request.textChannel.send(
            "Playing: " + Controller.nowPlaying.snippet.title 
            + "\nChannel: " + Controller.nowPlaying.snippet.channelTitle
        );
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
        showPlayedHistory: showPlayedHistory,
        useThisTextChannel: useThisTextChannel
    };
    module.exports = music_module;
})();