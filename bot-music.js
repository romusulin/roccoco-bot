(function() {
    // Libs
    var _ = require("lodash");
    var ytdl = require('ytdl-core');
    var request = require('superagent');

    //Imports
    var Controller = require("./bot-music-ctrl.js");
    var Constants = require("./bot-constants.js");
    var auth = require("./auth.json");

    var isAutoPlayOn = false;


    /* PUBLIC METHODS */
    var init = function(argObj) {
        Controller.init(argObj.authorId, argObj.channel);
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
        if (!Controller.currentVoiceChannel) {
            init(argObj);
        }
        searchYoutube(argObj.args, function() { playStream(Controller.ytAudioQueue) });   
    };

    var skip = function() {
        console.log("Skip");
        playStream([], true);
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
        searchYoutube(argObj.args, function() {
            playStream(Controller.ytAudioQueue);
        });
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

    /* PRIVATE METHODS */
    function searchYoutubeAutoplay(videoId, callback) {
        var requestUrl = "https://www.googleapis.com/youtube/v3/search" + `?part=snippet&relatedToVideoId=${videoId}&type=video&key=${auth.youtube_api_key}`;
        request(requestUrl, (error, response) => {
            if (!error && response.statusCode == 200) {
                let body = response.body;
                var retObj = {id: "", snippet: {}};
                if (body.items.length === 0) {
                    return Controller.request.channel.send("Query returned 0 results.");
                }

                var item;
                console.log(body.items.length + " related items found.")
                for (i = 0; i < body.items.length; i++) {
                      if (shouldPlayThisSong(body.items[i])) {
                          item = body.items[i];
                          break;
                      }
                }
    
                //console.log(item);
                if (item.id.kind === 'youtube#video') {
                    console.log("Added " + item.snippet.title + " to queue.");
                    retObj.id = item.id.videoId;
                    retObj.snippet = item.snippet;
                    Controller.ytAudioQueue.push(retObj);
                    Controller.ytAudioHistory.push(retObj);
                    if (!isAutoPlayOn) Controller.request.textChannel.send("Pushed " + item.snippet.title + " to queue.");
                    
                }
            } else {
                console.log("Unexpected error when searching YouTube");
                return;
            }
    
            if (typeof callback === "function") {
                callback(retObj);
            }
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

    function searchYoutube(searchKeywords, callback) {
        var requestUrl = 'https://www.googleapis.com/youtube/v3/search' + `?part=snippet&q=${escape(searchKeywords)}&key=${auth.youtube_api_key}`;
        var retObj = {id: "", snippet: {} };

        request(requestUrl, (error, response) => {
            if (!error && response.statusCode == 200) {
                let body = response.body;
                if (body.items.length === 0) {
                    return Controller.request.textChannel.send("Query returned 0 results.");
                }

                let item = body.items[0];
                if (item.id.kind === 'youtube#video') {
                    console.log("Added " + item.snippet.title + " to queue.");
                    retObj.id = item.id.videoId;
                    retObj.snippet = item.snippet;
                    Controller.ytAudioQueue.push(retObj);
                    Controller.ytAudioHistory.push(retObj);
                    if (!isAutoPlayOn) Controller.request.textChannel.send("Pushed " + item.snippet.title + " to queue.");
                    
                }
            } else {
                console.log("Unexpected error when searching YouTube");
                return;
            }
    
            if (typeof callback === "function") {
                callback(retObj);
            }
        });
        return retObj;
    };

    function playStream(queue) {
        playStream(queue, false);
    };

    function playStream(queue, isSkipInitiated) {
        if (isSkipInitiated) {
            Controller.dispatcher.end();
            return;
        }
        if (Controller.isCurrentlyPlaying) {
            return;
        }

        if (queue.length === 0 && Controller.request !== undefined) {
            Controller.request.textChannel.send("<@" + Controller.request.userId + "> Queue is empty.");
            return;
        }

        let audioQueueElement = queue.shift();
        let streamUrl = audioQueueElement.id;
        let snippet = audioQueueElement.snippet;
        Controller.nowPlaying = audioQueueElement;

        if (!streamUrl) {
            return;
        }

        const stream = ytdl(streamUrl, { filter: 'audioonly' });
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
                Controller.isCurrentlyPlaying = false;
                if (reason === Constants.LEAVE) {
                    return;
                }

                
                console.log("--> Dispatcher ended:" + reason);
                if (isAutoPlayOn === false) {
                    playStream(Controller.ytAudioQueue);
                    return;   
                } else {
                    searchYoutubeAutoplay(Controller.nowPlaying.id, function() {
                        playStream(Controller.ytAudioQueue);
                    });

                }
                    
            })
            .on('error', (e) => {
                console.log("--> Dispatcher encountered error: " + e);
            });

        console.log("Streaming audio from " + streamUrl + " (" + snippet.title + ")");

        Controller.isCurrentlyPlaying = true;
        Controller.request.textChannel.send(
            "Playing: " + snippet.title 
            + "\nChannel: " + snippet.channelTitle
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
        showPlayedHistory: showPlayedHistory
    };
    module.exports = music_module;
})();