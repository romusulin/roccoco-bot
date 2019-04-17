declare const console;

import { MusicPlayer } from "./player";
import { MusicQueuer } from "./queuer";
import { Song, Constants, Commands } from "../interfaces";
import { VoiceConnection, VoiceChannel, StreamDispatcher } from "discord.js";
import { AsyncEmitter } from "../async-emitter";

export class MusicController extends AsyncEmitter {
	static STARTED_SPEAKING = "STARTED_SPEAKING";
	static STOPPED_SPEAKING = "STOPPED_SPEAKING";
	static DISPATCHER_END = "DISPATCHER_END";

	private MusicQueuer: MusicQueuer
	private activeStreamDispatcher: StreamDispatcher;

	voiceConnection: VoiceConnection;
	isAutoplayOn: boolean;
	isPlaying: boolean;

	constructor() {
		super();
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

	async setVoiceChannel(destinationVoiceChannel: VoiceChannel): Promise<MusicController> {
		// Check if bot is already in this channel, do nothing and return
		if (this.voiceConnection) {
			const isTheSameChannel = this.voiceConnection.channel.id === destinationVoiceChannel.id;
			if (this.voiceConnection && isTheSameChannel) {
				throw new Error("Already in that channel");
			}
		}

		if (destinationVoiceChannel.full) {
			throw new Error(`Channel is full.`);
		}

		if (!destinationVoiceChannel.joinable) {
			throw new Error(`Channel is not joinable. \n ${destinationVoiceChannel.id}`);
		}

		try {
			this.voiceConnection = await destinationVoiceChannel.join();
		} catch (error) {
			throw new Error(`Failed joining channel.\n ${error.message}`);
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
		this.voiceConnection.channel.leave();
		this.voiceConnection = <VoiceConnection> undefined;
	}

	async play(searchKeywords?: string[], isAutoplayed?: boolean): Promise<Song> {
		let encounteredSong: Song;
		if (searchKeywords) {
			this.isAutoplayOn = isAutoplayed ? isAutoplayed : this.isAutoplayOn;
			encounteredSong = await this.MusicQueuer.pushByKeywords(searchKeywords, isAutoplayed);
		}

		// Queue, return the song for logging, leave the current song to finish
		if (this.isPlaying) {
			return encounteredSong;
		}

		encounteredSong = await this.MusicQueuer.getNextSong(this.isAutoplayOn);
		if (!encounteredSong || !encounteredSong.id) {
			return;
		}

		setImmediate(() => {
			this.runStream(encounteredSong);
		});
		return encounteredSong;
	}

	async runStream(song: Song) {
		this.activeStreamDispatcher = new MusicPlayer(this.voiceConnection, song.id)
		.getStream()
		.on(Constants.DISPATCHER_EVENT_SPEAKING, (isSpeaking) => {
			this.isPlaying = !!isSpeaking;
			if (isSpeaking) {
				console.log(`--> Dispatcher started speaking: ${song.snippet.title}#${song.id}`);;
				this.emit(MusicController.STARTED_SPEAKING);
			} else {
				console.log("--> Dispatcher stopped speaking.");
				this.emit(MusicController.STOPPED_SPEAKING);
			}
		})
		.once(Constants.DISPATCHER_EVENT_END, (reason: string) => {
			console.log("--> Dispatcher ended.");
			this.isPlaying = false;
			// Called in router.ts, subscription queues play() to execution
			this.emit(MusicController.DISPATCHER_END, reason);
		});
	}

	async skip(): Promise<void> {
		if (!this.isPlaying) {
			return;
		}

		console.log(`Skipping song: ${this.currentSong.snippet.title}`);
		return new Promise<void>((resolve) => {
			this.once(MusicController.STOPPED_SPEAKING, () => {
				resolve();
			});
			this.activeStreamDispatcher.end(Commands.SKIP);
		});
	}
}
