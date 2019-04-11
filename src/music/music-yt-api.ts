declare const require;
declare const console;

var auth = require("../../auth.json");

// Imports
import * as bhttp from "bhttp";
import { Constants, Song, SongId } from "../interfaces";

export class YoutubeApiCaller {
	// TODO interface http response
	private static async getVideoIdByKeywords(searchKeywords: string[], index: number = 0): Promise<SongId> {
		const searchQuery: string = searchKeywords.join(" ");
		let requestUrl = `https://www.googleapis.com/youtube/v3/search?part=id&q=${searchQuery}&key=${auth.youtube_api_key}`;

		console.log("Searching for:"  + searchKeywords.join(' '));

		const response = await bhttp.get(requestUrl);
		if (!response.body.items) {
			throw Error("Query returned 0 results.");
		}

		return response.body.items[index].id.videoId;
	}

	static async getRelatedVideoIds(videoId: SongId): Promise<SongId[]> {
		const requestUrl = `https://www.googleapis.com/youtube/v3/search?part=id&relatedToVideoId=${videoId}&type=video&key=${auth.youtube_api_key}`;

		const response = await bhttp.get(requestUrl);

		return response.body.items.reduce(function(array, currentId) {
			array.push(currentId.id.videoId);
			return array;
		}, []);
	}

	static async getVideoWrapperByKeywords(searchKeywords: string[]): Promise<Song> {
		const videoId: SongId = await this.getVideoIdByKeywords(searchKeywords);
		const song: Song = await this.getVideoWrapperById(videoId);

		return song;
	}

	static async getVideoWrapperById(songId: SongId): Promise<Song> {
		let requestUrl = 'https://www.googleapis.com/youtube/v3/videos?'
			+ `id=${songId}`
			+ `&key=${auth.youtube_api_key}`
			+ `&part=id,snippet,contentDetails`;

		const response = await bhttp.get(requestUrl);
		const body = response.body;

		if (body.items.length === 0) {
			throw Error(`Query returned 0 results for #${songId}`);
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
}

