(function() {
    var Constants = require("./bot-constants.js");
    var Config = {
        currentVoiceChannel: {},
        isCurrentlyPlaying: false,
        ytAudioQueue : [],
        ytAudioHistory: [],
        nowPlaying: {},
        autoplayPointer: {},
        dispatcher: {},
        request: {
            userId: "",
            textChannel: {}
        },
        nowPlaying : {
            id: "",
            snippet : {}
        },
        setRequest: function(authorId, textChannel) {
            this.request.userId = authorId;
            this.request.textChannel = textChannel;
        },
        getVoiceChannelByUserId: function (authorId) {
            return client.channels.find(x => { 
                return x['members'].keyArray().includes(String(this.request.userId))
                    && x.type === Constants.CHANNEL_TYPE_VOICE; 
            });
        },
        pushToQueue: function(obj) {
            this.ytAudioQueue.push(obj);
            this.ytAudioHistory.push(obj);
        },
        shiftQueue: function() {
            let retObj = this.ytAudioQueue.shift();
            this.nowPlaying = retObj;
            return retObj;
        }
    };
    module.exports = Config;
})();