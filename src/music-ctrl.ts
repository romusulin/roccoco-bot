declare const console;

import { Settings } from "./settings";
import { MusicPlayer } from "./music-player";
import { MusicQueuer } from "./music-queuer";
import { YoutubeApiCaller } from "./music-yt-api";
import { Song, SongId, Constants, Commands } from "./interfaces";
import { VoiceConnection, VoiceChannel, StreamDispatcher } from "discord.js";

export class MusicController {
	private MusicPlayer: MusicPlayer;
	private MusicQueuer: MusicQueuer;

	private isPlaying: boolean;
	private voiceConn: VoiceConnection;
	private isAutoPlayOn: Boolean;

	streamDispatcherListener: Function;

	constructor() {
		this.MusicPlayer = new MusicPlayer();
		this.MusicQueuer = new MusicQueuer();
		this.isAutoPlayOn = false;
	}

	get isNowPlaying(): boolean {
		return Boolean(this.isPlaying);
	}

	set isNowPlaying(isPlaying: boolean) {
		this.isPlaying = isPlaying;
	}

	get currentSong(): Song {
		return this.MusicQueuer.currentSong;
	}

	get audioQueue(): Song[] {
		return this.MusicQueuer.audioQueue;
	}

	get audioHistory(): Song[] {
		return this.MusicQueuer.audioHistory;
	}

	get voiceConnection(): VoiceConnection {
		return this.voiceConn;
	}

	async setVoiceConnection(voiceChannel: VoiceChannel): Promise<MusicController> {
		// Check if bot is already in this channel, do nothing and return
		if (this.voiceConnection &&  this.voiceConnection.channel.name === voiceChannel.name) {
			return;
		}

		try {
			this.voiceConn = await voiceChannel.join();
			this.MusicPlayer.setVoiceConnection(this.voiceConn);
		} catch (error) {
			throw new Error("Failed joining channel.");
		}

		return this;
	}

	setIsAutoplayOn(status: boolean): void {
		this.isAutoPlayOn = status;
	}

	autoplayCurrentSong(): void {
		this.isAutoPlayOn = true;
		if (this.isPlaying) {
			this.MusicQueuer.autoplayCurrentSong();
		}
	}

	removeIndex(index: number): Song {
		return this.MusicQueuer.remove(index);
	}

	clearQueue(): number {
		return this.MusicQueuer.clearQueue();
	}

	leaveVoiceChannel(): void {
		//this.MusicPlayer.streamDispatcher.pause();
		this.voiceConn.channel.leave();
		this.voiceConn = <VoiceConnection> undefined;
	}

	async pushToQueue(searchKeywords: string[], isAutoplayed: boolean): Promise<Song> {
		const song = await YoutubeApiCaller.getVideoWrapperByKeywords(searchKeywords);
		if (!this.isAutoPlayOn) {
			this.setIsAutoplayOn(isAutoplayed);
		}

		return this.MusicQueuer.push(song, isAutoplayed);
	}

	private async pushNewRelatedSong(): Promise<Song> {
		const songIds: SongId[] = await YoutubeApiCaller.getRelatedVideoIds(this.MusicQueuer.autoplayPointer.id);

		const id: SongId = songIds.find((songId: SongId) => {
			if (!songId) {
				return false;
			}

			let checkedIncrement: number = 0;
			let isValidSong: boolean = true;

			const playedHistory = this.MusicQueuer.audioHistory;
			// If song was already played, try finding next one
			for (let i = playedHistory.length - 1; i >= 0; i--) {
				const playedSong = playedHistory[i];

				if (checkedIncrement++ >= Settings.HistoryDepthCheck) break;
				if (playedSong === undefined) continue;
				if (songId === playedSong.id) isValidSong =  false;
			}

			return isValidSong;
		});

		const song: Song = await YoutubeApiCaller.getVideoWrapperById(id);

		return this.MusicQueuer.push(song, true);
	}


	async play(): Promise<StreamDispatcher> {
		if (this.isPlaying) {
			return;
		}

		let song: Song = this.MusicQueuer.getNextSong();

		if (!song && this.isAutoPlayOn) {
			// Queue is empty, find related song if autoplay is on
			await this.pushNewRelatedSong();
			song = this.MusicQueuer.getNextSong();
		}

		if (!song || !song.id) {
			return;
		}


		return this.MusicPlayer.getStream(song.id)
		.once(Constants.DISPATCHER_EVENT_SPEAKING, (isSpeaking) => {
			this.isPlaying = !!isSpeaking;
			if (isSpeaking) {
				console.log(`--> Dispatcher started speaking: ${song.snippet.title}#${song.id}`);
				this.streamDispatcherListener(isSpeaking);
			} else {
				console.log("--> Dispatcher stopped speaking.");
			}
		})
		.once(Constants.DISPATCHER_EVENT_END, (reason: string) => {
			// Passing the functions as FCC would result in wrong context when executing
			this.isPlaying = false;
			if (reason !== Commands.LEAVE) {
				this.play();
			}
		});
	}

	async skip(): Promise<void> {
		console.log(`Skipping song: ${this.currentSong.snippet.title}`);
		return new Promise<void>((resolve) => {
			this.MusicPlayer.streamDispatcher.once(Constants.DISPATCHER_EVENT_SPEAKING, (isSpeaking) => {
				if (!isSpeaking) {
					resolve();
				}
			});
			this.MusicPlayer.streamDispatcher.end(Commands.SKIP);
		});
	}
}