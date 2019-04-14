declare const console;

import { MusicPlayer } from "./player";
import { MusicQueuer } from "./queuer";
import { Song, Constants, Commands } from "../interfaces";
import { VoiceConnection, VoiceChannel, StreamDispatcher } from "discord.js";

export class MusicController {
	private MusicQueuer: MusicQueuer
	private voiceConn: VoiceConnection;
	private activeStreamDispatcher: StreamDispatcher;

	isAutoplayOn: boolean;
	isPlaying: boolean;
	streamDispatcherListener: Function;
	
	constructor() {
		this.MusicQueuer = new MusicQueuer();
		this.isAutoplayOn = false;
	}

	get currentSong(): Song {
		return this.MusicQueuer.nowPlaying;
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
		} catch (error) {
			throw new Error("Failed joining channel.");
		}

		return this;
	}

	autoplayCurrentSong(): void {
		this.isAutoplayOn = true;
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
		this.voiceConn.channel.leave();
		this.voiceConn = <VoiceConnection> undefined;
	}

	async handleSearch(searchKeywords: string[], isAutoplayed: boolean): Promise<Song> {
		this.isAutoplayOn = !this.isAutoplayOn ? isAutoplayed : false;
		return await this.MusicQueuer.pushByKeywords(searchKeywords, isAutoplayed);
	}

	async play(searchKeywords?: string[], isAutoplayed?: boolean): Promise<Song> {
		let encounteredSong: Song;
		if (searchKeywords) {
			encounteredSong = await this.handleSearch(searchKeywords, isAutoplayed);
		}
		
		if (this.isPlaying) {
			return encounteredSong;
		}

		encounteredSong = await this.MusicQueuer.getNextSong(this.isAutoplayOn);
		if (!encounteredSong || !encounteredSong.id) {
			return;
		}

		this.runStream(encounteredSong);
		return encounteredSong;
	}

	async runStream(song: Song) {
		this.activeStreamDispatcher = new MusicPlayer(this.voiceConnection, song.id)
		.getStream()
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
			this.isPlaying = false;
			if (reason !== Commands.LEAVE) {
				this.play();
			}
		});
	}

	async skip(): Promise<void> {
		console.log(`Skipping song: ${this.currentSong.snippet.title}`);
		return new Promise<void>((resolve) => {
			this.activeStreamDispatcher.once(Constants.DISPATCHER_EVENT_SPEAKING, (isSpeaking) => {
				if (!isSpeaking) {
					resolve();
				}
			});
			this.activeStreamDispatcher.end(Commands.SKIP);
		});
	}
}