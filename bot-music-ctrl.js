(function() {
    var Constants = require("./bot-constants.js");
    var _ = require("lodash");
    
    var Config = {
        currentVoiceChannel: {},
        isCurrentlyPlaying: false,
        isAutoPlayOn: false,
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
        },
        shouldPlayThisSong: function(item) {
            let retVal = true;
    
            if (item === undefined || _.isEmpty(item) || item.id === undefined) {
                return false;
            }
            // Gets n last elements of yt audio history to check
            _.each(this.ytAudioHistory.slice(Constants.CHECKED_HISTORY_SIZE * -1), function(ytElem) {
                if(item.id.videoId === ytElem.id) {
                    retVal = false;
                }
            });
            return retVal;
        }
    };
    module.exports = Config;
})();