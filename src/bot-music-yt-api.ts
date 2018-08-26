declare const require;
declare const console;

import * as bhttp from "bhttp";
import { Constants, Song } from "./interfaces";

var auth = require("../auth.json");

export class YoutubeApiCaller {
    // TODO interface http response
    static async getVideoIdByKeywords(searchKeywords: string[], index: number = 0): Promise<string> {
        let requestUrl = 'https://www.googleapis.com/youtube/v3/search' 
        + `?part=id&q=${searchKeywords.join(' ')}`
        + `&key=${auth.youtube_api_key}`;

        
        const response = await bhttp.get(requestUrl);
        if (!response.body.items) {
            throw Error("Query returned 0 results.");
        }
         
        return response.body.items[index].id.videoId;
    }

    static async getVideoWrapperById(videoId: string): Promise<Song> {
        let requestUrl = 'https://www.googleapis.com/youtube/v3/videos?'
            + `id=${videoId}`
            + `&key=${auth.youtube_api_key}`
            + `&part=id,snippet,contentDetails`;

        const response = await bhttp.get(requestUrl);
        const body = response.body;
        if (body.items.length === 0) {
            throw Error("Query returned 0 results.");
        }
        const item = body.items[0];
        if (item.id.kind === Constants.YOUTUBE_KIND_VIDEO) {
            throw Error("Found result is not a video.");
        }
        
        return <Song> {
            id: item.id,
            snippet: item.snippet,
            contentDetails: item.contentDetails
        };
    }

    // make this return video id only
    static async getRelatedVideosById(videoId): Promise<Song[]> {
        const requestUrl = "https://www.googleapis.com/youtube/v3/search"
        + `?part=id&relatedToVideoId=${videoId}`
        + `&type=video&key=${auth.youtube_api_key}`;

        const response = await bhttp.get(requestUrl);

        return response.body.items;
    }
}

