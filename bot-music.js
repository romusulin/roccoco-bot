(function() {
    var _ = require("lodash");
    var ytdl = require('ytdl-core');
    var request = require('superagent');


    var Constants = require("./bot-constants.js");
    var auth = require("./auth.json");
    var client;
    var voiceChannel = null;
    var reqestedInfo = {};

    var isCurrentlyPlaying = false;
    var ytAudioQueue = [];
    var dispatcher;
    /* PUBLIC METHODS */


    var init = function(dcClient, msg) {
        reqestedInfo = {userId: msg.author.id, channel: msg.channel};
        client = dcClient;
        var vc = client.channels.find(x => { 
            return x['members'].keyArray().includes(String(msg.author.id)) > 0 
            && x.type === Constants.CHANNEL_TYPE_VOICE; 
        });

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

    var play = function(args) {
        searchYoutube(args, function() { playStream(ytAudioQueue) });   
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

    /* PRIVATE METHODS */
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
                    callback();
                    return;
                    
                }
            } else {
                console.log("Unexpected error when searching YouTube");
                return null;
            }
        });
        return null;
    };

    function playStream(queue) {
        playStream(queue, false);
    }

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

        let audioQueueElement = queue.pop();
        let streamUrl = audioQueueElement.id;
        let snippet = audioQueueElement.snippet;

        if (!streamUrl) {
            return;
        }

        const stream = ytdl(streamUrl, { filter: 'audioonly' });
        dispatcher = client.voiceConnections.first()
            .playStream(stream, { seek: 0, volume: 1 })
            .on('speaking', (isSpeaking) => {
                if (!isSpeaking) {
                    console.log("Dispatcher ended speaking. Queue:" + showQueue());
                    isCurrentlyPlaying = false;
                    dispatcher.end();
                    return;
                }
            })
            .on('end', (reason) => {
                isCurrentlyPlaying = false;
                console.log("Dispatcher ended." + reason);
                playStream(ytAudioQueue);
                return;       
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
        showQueue: showQueue
    };
    module.exports = music_module;
})();