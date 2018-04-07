(function() {
    var auth = require("./auth.json");
    var bhttp = require('bhttp');
    var Promise = require("bluebird");
    var Constants = require("./bot-constants.js");

    var ytApiCaller = {
        getVideoIdByKeywords: function(searchKeywords, index = 0) {
            let requestUrl = 'https://www.googleapis.com/youtube/v3/search' 
            + `?part=id&q=${searchKeywords.join(' ')}`
            + `&key=${auth.youtube_api_key}`;
    
            
            return Promise.try(function() {
                return bhttp.get(requestUrl);
            }).then(function(response) {
                return Promise.resolve(response.body.items[index].id.videoId);
            });
        },
        getVideoWrapperById: function(videoId, isQueriedAutoplay) {
            let requestUrl = 'https://www.googleapis.com/youtube/v3/videos?'
            + `id=${videoId}`
            + `&key=${auth.youtube_api_key}`
            + `&part=id,snippet,contentDetails`;
    
            return Promise.try(function() {
                return bhttp.get(requestUrl);
            }).then(function(response) {
                let body = response.body;
                if (body.items.length === 0) {
                    throw Error("Query returned 0 results.");
                }
                
                let item = body.items[0];
                if (item.id.kind === Constants.YOUTUBE_KIND_VIDEO) {
                    throw Error("Found result is not a video.");
                }
        
                console.log("Added " + item.snippet.title + " to queue.");
                return Promise.resolve({
                    id: item.id,
                    snippet: item.snippet,
                    contentDetails: item.contentDetails
                });
            });  
        },

        getRelatedVideosById: function(videoId) {
            var requestUrl = "https://www.googleapis.com/youtube/v3/search"
            + `?part=id&relatedToVideoId=${videoId}`
            + `&type=video&key=${auth.youtube_api_key}`;

            return Promise.try(function() {
                return bhttp.get(requestUrl);
            }).then(function(response) {
                if (!response.body.items.length) { reject("Query returned 0 results.") }
                return Promise.resolve(response.body.items);
            });
        }
    };

    module.exports = ytApiCaller;
})();