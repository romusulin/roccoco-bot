import { Player } from "./player";
import { MusicQueuer } from "./queuer";
import { InternalDiscordGatewayAdapterCreator } from "discord.js";
import {
	AudioPlayerStatus,
	getVoiceConnection as djsGetVoiceConnection,
	joinVoiceChannel,
	VoiceConnection
} from "@discordjs/voice";
import { AsyncEmitter } from "../utilities/async-emitter";
import { Song } from "../interfaces/song";

export class MusicController extends AsyncEmitter {
	private queuer: MusicQueuer;
	private player: Player;
	private _isPlaying: boolean;
	private guildId: string;

	isAutoplayOn: boolean;
	static EVENT = {
		STARTED_SPEAKING: 'STARTED_SPEAKING',
		STOPPED_SPEAKING: 'STOPPED SPEAKING',
		QUEUE_ADD: 'QUEUE_ADD',
		HISTORY_ADD: 'HISTORY_ADD'
	};

	constructor(guildId: string) {
		super();
		this.queuer = new MusicQueuer();
		this.player = new Player();
		this.isAutoplayOn = false;
		this.guildId = guildId;
	}

	get isPlaying() {
		return this._isPlaying && !!this.getVoiceConnection();
	}

	get currentSong(): Song {
		return this.queuer.nowPlaying;
	}

	get audioQueue(): Song[] {
		return this.queuer.audioQueue;
	}

	get audioHistory(): Song[] {
		return this.queuer.audioHistory;
	}

	clearAudioHistory(): void {
		return this.queuer.clearHistory();
	}

	private getVoiceConnection(): VoiceConnection {
		return djsGetVoiceConnection(this.guildId);
	}

	async setVoiceChannel(voiceChannelId: string, voiceAdapterCreator: InternalDiscordGatewayAdapterCreator): Promise<void> {
		try {
			joinVoiceChannel({
				guildId: this.guildId,
				channelId: voiceChannelId,
				adapterCreator: voiceAdapterCreator
			});
		} catch (error) {
			throw new Error(`Failed joining channel:\n${error.message}`);
		}
	}

	autoplayCurrentSong(): void {
		this.isAutoplayOn = true;
		if (this.isPlaying) {
			this.queuer.autoplayCurrentSong();
		}
	}

	removeIndex(index: number): Song {
		return this.queuer.remove(index);
	}

	clearQueue(): number {
		return this.queuer.clearQueue();
	}

	leaveVoiceChannel(): boolean {
		const vc = this.getVoiceConnection();
		if (!vc) {
			return false;
		}

		this.getVoiceConnection()?.destroy();
		this._isPlaying = false;

		return true;
	}

	async play(searchKeywords?: string[], isAutoplayed?: boolean): Promise<Song> {
		if (!this.getVoiceConnection()) {
			throw new Error(`I'm not in a voice channel.`);
		}

		let encounteredSong: Song;
		if (searchKeywords) {
			this.isAutoplayOn = isAutoplayed ? isAutoplayed : this.isAutoplayOn;
			encounteredSong = await this.queuer.pushByKeywords(searchKeywords, isAutoplayed);
		}

		// Queue, leave the current song to finish, and return the song for logging
		if (this.isPlaying) {
			return encounteredSong;
		}

		encounteredSong = await this.queuer.getNextSong(this.isAutoplayOn);
		if (!encounteredSong || !encounteredSong.id) {
			return;
		}


		await this.runStream(encounteredSong);
		return encounteredSong;
	}

	async runStream(song: Song) {
		this.player = await this.player.playSong(this.getVoiceConnection(), song.id);
		this.player.once(AudioPlayerStatus.Playing, (status) => {
			console.log(`--> Dispatcher started speaking: ${song.snippet.title} #${song.id}`);
			this._isPlaying = true;
			this.emit(MusicController.EVENT.STARTED_SPEAKING, this.queuer.nowPlaying);
		})
		.once(AudioPlayerStatus.Idle, async (status) => {
			console.log("--> Dispatcher ended.");
			this._isPlaying = false;
			this.emit(MusicController.EVENT.STOPPED_SPEAKING);
			if (this.isAutoplayOn) {
				await this.play();
			}
		});
	}

	async skip(): Promise<void> {
		if (!this.isPlaying) {
			return;
		}

		console.log(`Skipping song: ${this.currentSong.snippet.title}`);
		return new Promise<void>((resolve) => {
			this.player.once(AudioPlayerStatus.Idle, () => {
				resolve();
			});
			this.player.stop();
		});
	}
}
