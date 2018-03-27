(function() {
    var Constants = require("./bot-constants.js");
    var Config = {
        currentVoiceChannel: {},
        isCurrentlyPlaying: false,
        ytAudioQueue : [],
        ytAudioHistory: [],
        nowPlaying: {},
        dispatcher: {},
        request: {
            userId: "",
            textChannel: {}
        },
        nowPlaying : {
            id: "",
            snippet : {}
        },
        init: function(authorId, textChannel) {
            this.request.userId = authorId;
            this.request.textChannel = textChannel;
        },
        getVoiceChannelByUserId: function (authorId) {
            return client.channels.find(x => { 
                return x['members'].keyArray().includes(String(this.request.userId))
                    && x.type === Constants.CHANNEL_TYPE_VOICE; 
            });
        }
    };
    module.exports = Config;
})();