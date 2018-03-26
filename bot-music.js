(function() {
    // Libs
    var _ = require("lodash");
    var ytdl = require('ytdl-core');
    var request = require('superagent');

    //Imports
    var Constants = require("./bot-constants.js");
    var auth = require("./auth.json");


    // Vars
    var voiceChannel = null;
    var reqestedInfo = {};
    var isCurrentlyPlaying = false;
    var ytAudioQueue = [];
    var nowPlaying;
    var dispatcher;

    /* PUBLIC METHODS */
    var init = function(argObj) {
        reqestedInfo = {userId: argObj.authorId, channel: argObj.channel};
        let vc = getSenderVoiceChannel(argObj.authorId);
        if (voiceChannel && voiceChannel.name === vc.name) {
            return "I'm already in that channel.";
        }

        voiceChannel = vc;

        if (voiceChannel) {
            voiceChannel.join();
            return "Joined voice channel: " + voiceChannel.name;
        } else {
            return "Failed joining channel.";
        }
    }


    var leave = function() {
        if (voiceChannel) {
            voiceChannel.leave();
            let vcName = voiceChannel.name;
            voiceChannel = null;
            return "Left voice channel: " + vcName + ".";
        } else {
            return "I'm not in a channel.";
        }  
    }

    var play = function(argObj) {
        if (!voiceChannel) {
            init(argObj);
        }
        searchYoutube(argObj.args, function() { playStream(ytAudioQueue) });   
    };

    var skip = function() {
        console.log("Skip");
        playStream([], true);
    };

    var showQueue = function() {
        let queueString = "Full queue:";
        let no = 0;
        _.each(ytAudioQueue, function(elem) {
            queueString += "\n" + ++no + ". " +  elem.snippet.title;
        });
        reqestedInfo.channel.send(queueString);
        return queueString;
    };

    var resume = function() {
        //TODO
        if (dispatcher) {
            dispatcher.resume();
        }
    };

    var pause = function() {
        //TODO
        if (dispatcher) {
            dispatcher.pause();
        }
    };

    var nowPlaying = function() {
        reqestedInfo.channel.send(
            "Now playing:"
            + "\nTitle: " + nowPlaying.snippet.title
            + "\nDescription: " + nowPlaying.snippet.description
        );
    };

    var clearQueue = function() {
        ytAudioQueue = [];
        return reqestedInfo.channel.send("Queue cleared.");
    }

    /* PRIVATE METHODS */
    function getSenderVoiceChannel(authorId) {
        return client.channels.find(x => { 
            return x['members'].keyArray().includes(String(authorId))
                && x.type === Constants.CHANNEL_TYPE_VOICE; 
        });
    };

    function searchYoutube(searchKeywords, callback) {
        var requestUrl = 'https://www.googleapis.com/youtube/v3/search' + `?part=snippet&q=${escape(searchKeywords)}&key=${auth.youtube_api_key}`;

        request(requestUrl, (error, response) => {
            if (!error && response.statusCode == 200) {
                let body = response.body;
                if (body.items.length === 0) {
                    return reqestedInfo.channel.send("Query returned 0 results.");
                }

                let item = body.items[0];
                if (item.id.kind === 'youtube#video') {
                    console.log("Added " + item.snippet.title + " to queue.");
                    ytAudioQueue.push({id: item.id.videoId, snippet: item.snippet});
                    reqestedInfo.channel.send("Pushed " + item.snippet.title + " to queue.");
                    
                }
            } else {
                console.log("Unexpected error when searching YouTube");
                return;
            }
            callback();
            return;
        });
        return;
    };

    function playStream(queue) {
        playStream(queue, false);
    };

    function playStream(queue, isSkipInitiated) {
        if (isSkipInitiated) {
            dispatcher.end();
            return;
        }
        if (isCurrentlyPlaying) {
            return;
        }

        if (queue.length === 0) {
            reqestedInfo.channel.send("Queue is empty.");
            return;
        }

        let audioQueueElement = queue.shift();
        let streamUrl = audioQueueElement.id;
        let snippet = audioQueueElement.snippet;
        nowPlaying = audioQueueElement;

        if (!streamUrl) {
            return;
        }

        const stream = ytdl(streamUrl, { filter: 'audioonly' });
        dispatcher = client.voiceConnections.first()
            .playStream(stream, { seek: 0, volume: 1 })
            .on('start', () => {
                console.log("--> Dispatcher started speaking.")
            })
            .on('speaking', (isSpeaking) => {
                if (!isSpeaking) {
                    isCurrentlyPlaying = false;
                    dispatcher.end();
                    return;
                }
            })
            .on('end', (reason) => {
                isCurrentlyPlaying = false;
                console.log("--> Dispatcher ended:" + reason);
                playStream(ytAudioQueue);
                return;       
            })
            .on('error', (e) => {
                console.log("--> Dispatcher encountered error: " + e);
            });

        console.log("Streaming audio from " + streamUrl + " (" + snippet.title + ")");

        isCurrentlyPlaying = true;
        reqestedInfo.channel.send(
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
        clearQueue: clearQueue
    };
    module.exports = music_module;
})();