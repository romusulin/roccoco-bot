declare const require;
declare const console;

// Imports
import * as bhttp from "bhttp";
import { Constants, Song, SongId } from "../interfaces";
import { Utils } from "../utils";

const YT_TOKEN = Utils.getAuthValue("YOUTUBE_API_KEY");

export namespace YoutubeApiCaller {
	const YT_ENDPOINT = "https://www.googleapis.com/youtube/v3/";

	// TODO interface http response
	export async function getVideoIdByKeywords(searchKeywords: string[], index: number = 0): Promise<SongId> {
		const searchQuery: string = searchKeywords.join(" ");
		let requestUrl = `${YT_ENDPOINT}search?part=id&q=${searchQuery}&key=${YT_TOKEN}`;

		console.log("Searching for:"  + searchKeywords.join(' '));

		const response = await bhttp.get(requestUrl);
		if (!response.body.items) {
			throw Error("Query returned 0 results.");
		}

		return response.body.items[index].id.videoId;
	}

	export async function getRelatedVideoIds(videoId: SongId): Promise<SongId[]> {
		const requestUrl = `${YT_ENDPOINT}search?part=id&relatedToVideoId=${videoId}&type=video&key=${YT_TOKEN}`;

		const response = await bhttp.get(requestUrl);

		const songIds: SongId[] = response.body.items.reduce(function(array, currentId) {
			array.push(currentId.id.videoId);
			return array;
		}, []);

		console.log(`YoutubeAPI:getRelatedVideoIds: searching with "${videoId}"; found ${songIds.length} songs: [${songIds.toString()}]`);
		return songIds;
	}

	export async function getVideoWrapperByKeywords(searchKeywords: string[]): Promise<Song> {
		const videoId: SongId = await this.getVideoIdByKeywords(searchKeywords);
		const song: Song = await this.getVideoWrapperById(videoId);

		console.log(`YoutubeAPI:getVideoWrapperByKeywords: searching "${searchKeywords.toString()}"; found "${song.snippet.title}"#${song.id}`);
		return song;
	}

	export async function getVideoWrapperById(songId: SongId): Promise<Song> {
		let requestUrl = `${YT_ENDPOINT}videos?id=${songId}&key=${YT_TOKEN}&part=id,snippet,contentDetails`;

		const response = await bhttp.get(requestUrl);
		const body = response.body;

		if (body.items.length === 0) {
			throw Error(`Query returned 0 results for #${songId}`);
		}

		const item = body.items[0];
		if (item.id.kind === Constants.YOUTUBE_KIND_VIDEO) {
			throw Error("Found result is not a video.");
		}

		console.log(`YoutubeAPI:getVideoWrapperById: searching "${songId}"; found "${item.id}"#${item.snippet.title}`)
		return <Song> {
			id: item.id,
			snippet: item.snippet,
			contentDetails: item.contentDetails
		};
	}
}

export interface Snippet {
	title: string;
	description: string;
	thumbnails: any;
	channelTitle: string;
}
