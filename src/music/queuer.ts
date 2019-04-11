import { Song, SongId } from "../interfaces";

export class MusicQueuer {
	private autoplayPointerId: SongId;
	private nowPlaying: Song;

	private ytAudioQueue : Song[];
	private ytAudioHistory: Song[];

	constructor() {
		this.ytAudioQueue = [];
		this.ytAudioHistory = [];
	}

	get currentSong(): Song {
		return this.nowPlaying;
	}

	get audioQueue(): Song[] {
		return this.ytAudioQueue;
	}

	get audioHistory(): Song[] {
		return this.ytAudioHistory;
	}

	get autoplayPointer(): Song {
		return this.ytAudioHistory.find((song) => {
			if (!song || !song.id) {
				return;
			}

			return song.id === this.autoplayPointerId;
		});
	}

	clearQueue(): number {
		const queueLength: number = this.ytAudioQueue.length;
		this.ytAudioQueue = [];

		return queueLength;
	}

	autoplayCurrentSong(): void {
		this.autoplayPointerId = this.nowPlaying.id;
	}

	push(song: Song, isAutoplayed: boolean): Song {
		if (!song) {
			return;
		}

		this.ytAudioQueue.push(song);
		if (isAutoplayed) {
			this.autoplayPointerId = song.id;
		}

		return song;
	}

	remove(index: number = 0): Song {
		if (index => 0 && index <  this.ytAudioQueue.length) {
			return this.ytAudioQueue.splice(index, 1)[0];
		} else {
			throw new Error("Index out of bounds.");
		}
	}

	getNextSong(): Song {
		this.nowPlaying = this.ytAudioQueue.shift();
		if (this.nowPlaying) {
		   this.ytAudioHistory.push(this.nowPlaying);
		}

		return this.nowPlaying;
	}
}