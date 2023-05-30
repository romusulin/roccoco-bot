import {getRelatedVideoIds, getVideoWrapperByKeywords, getVideoWrapperById, Song, SongId} from "./music-yt-api";

export class MusicQueuer {
	private static HISTORY_DEPTH_CHECK = 50;
	private autoplayPointerId: SongId;
	private ytAudioHistory: Song[];

	nowPlaying: Song;
	audioQueue : Song[];

	constructor() {
		this.audioQueue = [];
		this.ytAudioHistory = [];
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
		const queueLength: number = this.audioQueue.length;
		this.audioQueue = [];

		return queueLength;
	}

	autoplayCurrentSong(): void {
		this.autoplayPointerId = this.nowPlaying.id;
	}

	async pushByKeywords(searchKeywords: string[], isAutoplayed: boolean) {
		const song = await getVideoWrapperByKeywords(searchKeywords);
		return this.push(song, isAutoplayed);
	}

	pushToHistory(song: Song, isAutoplayed: boolean) {
		this.audioHistory.push(song);
		this.autoplayPointerId = isAutoplayed ? song.id : this.autoplayPointerId;
	}

	remove(index: number = 0): Song {
		if (index >= 0 && index < this.audioQueue.length) {
			return this.audioQueue.splice(index, 1)[0];
		} else {
			throw new Error("Index out of bounds.");
		}
	}

	private push(song: Song, isAutoplayed: boolean): Song {
		if (!song) {
			return;
		}

		this.audioQueue.push(song);
		if (isAutoplayed) {
			this.autoplayPointerId = song.id;
		}

		return song;
	}

	async getNextSong(isAutoplayActive: boolean): Promise<Song> {
		let foundSong: Song = this.audioQueue.shift();
		 if (isAutoplayActive && !foundSong){
			foundSong = await this.findRelatedToPointer();
		}

		this.pushToHistory(foundSong, isAutoplayActive);

		this.nowPlaying = foundSong;
		return this.nowPlaying;
	}

	private async findRelatedToPointer(): Promise<Song> {
		const songIds: SongId[] = await getRelatedVideoIds(this.autoplayPointer.id);

		const id: SongId = songIds.find((songId: SongId) => {
			if (!songId) {
				return false;
			}

			let checkedIncrement: number = 0;
			let isValidSong: boolean = true;

			const playedHistory = this.audioHistory;
			// If song was already played, try finding next one
			for (let i = playedHistory.length - 1; i >= 0; i--) {
				const playedSong = playedHistory[i];

				if (checkedIncrement++ >= MusicQueuer.HISTORY_DEPTH_CHECK) break;
				if (playedSong === undefined) continue;
				if (songId === playedSong.id) isValidSong =  false;
			}

			return isValidSong;
		});

		return getVideoWrapperById(id);
	}
}
