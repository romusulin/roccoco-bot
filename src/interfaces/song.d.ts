export type SongId = string;
export interface Song {
	id: SongId;
	kind: string;
	snippet: Snippet;
	contentDetails: ContentDetails;
	progressInfo: ProgressInfo;
}

export interface ProgressInfo {
}

export interface ContentDetails {
	duration: string;
}

export interface Snippet {
	title: string;
	description: string;
	thumbnails: {
		high: Thumbnail;
		standard: Thumbnail;
		medium: Thumbnail;
	};
	channelTitle: string;
}

interface Thumbnail {
	url: string;
	width: number;
	height: number;
}
