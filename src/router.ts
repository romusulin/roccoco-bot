import {Song} from "./music/music-yt-api";

declare const client;

import {MusicController} from "./music/controller";
import {ParsedMessageRequest} from "./parsed-message-request";
import {ChatLogger} from "./chat/logger";
import {TaskExecutorBuilder} from "./task-executor";
import { Snowflake} from "discord.js";
import {Commands} from "./commands";
import {Player} from "./music/player";

export class MusicRouter {
	private Controller: MusicController;
	private messager: ChatLogger;
	private taskExecutor: TaskExecutorBuilder;
	private player: Player;

	constructor(guildId: Snowflake) {
		this.messager = new ChatLogger();
		this.player = new Player();
		this.taskExecutor = new TaskExecutorBuilder(this)
		.register(Commands.JOIN, this.joinVoiceChannel)
		.register(Commands.LEAVE, this.leave)
		.register(Commands.PLAY, this.play)
		.register(Commands.AUTOPLAY, this.play)
		.register(Commands.USE_THIS_TEXT_CHANNEL, this.useThisTextChannel)
		.register(Commands.SKIP, this.skip)
		.register(Commands.QUEUE, this.showQueue)
		.register(Commands.NOW_PLAYING, this.nowPlaying)
		.register(Commands.CLEAR_QUEUE, this.clearQueue)
		.register(Commands.REMOVE, this.removeFromQueue)
		.register(Commands.AUTOPLAY_THIS, this.autoplayCurrentSong)
		.register(Commands.AUTOPLAY_OFF, this.turnAutoplayOff)
		.register(Commands.SHOW_PLAYED_HISTORY, this.showPlayedHistory)
		.register(Commands.CLEAR_HISTORY, this.cleanHistory);

		this.Controller = new MusicController(guildId)
		.on(MusicController.STARTED_SPEAKING, async () => {
			client.user.setActivity(this.Controller.currentSong.snippet.title);
			await this.messager.sendNowStartedPlaying(this.Controller.currentSong);
		})
		.on(MusicController.STOPPED_SPEAKING, () => {
			client.user.setActivity(this.Controller.isAutoplayOn ? "Finding another song..." : "");
		});
	}

	async execute(argObj: ParsedMessageRequest): Promise<void> {
		if (!this.messager.textChannel) {
			this.messager.textChannel = argObj.channel;
		}

		await this.taskExecutor.execute(argObj);
	}

	 async joinVoiceChannel(argObj: ParsedMessageRequest): Promise<void> {
		const voiceChannel = argObj.message.member.voice?.channel;
		if (!voiceChannel) {
			await argObj.message.react('🚫');
			return;
		}

		if (voiceChannel.full) {
			throw new Error(`Channel is full.`);
		}

		if (!voiceChannel.joinable) {
			throw new Error(`Channel is not joinable.`);
		}

		await this.Controller.setVoiceChannel(voiceChannel.id, voiceChannel.guild.voiceAdapterCreator);
		await argObj.message.react('👌');
	}

	async nowPlaying() {
		await this.messager.sendNowStartedPlaying(this.Controller.currentSong);
	}

	async clearQueue() {
		const noOfRemovedSongs: number = this.Controller.clearQueue();
		await this.messager.sendTextMessage(`Queue cleared.\nRemoved ${noOfRemovedSongs} song ${(noOfRemovedSongs !== 1 ? "s" : "")}.`);
	}

	async cleanHistory() {
		this.Controller.clearAudioHistory();
		await this.messager.sendTextMessage(`History cleared.`);
	}

	async autoplayCurrentSong() {
		this.Controller.autoplayCurrentSong();
		await this.messager.sendChangedAutoplayPointer(this.Controller.currentSong);
	}

	async useThisTextChannel(argObj: ParsedMessageRequest) {
		this.messager.textChannel = argObj.channel;
		await argObj.message.react("🍆");
	}

	async turnAutoplayOff() {
		this.Controller.isAutoplayOn = false;
		await this.messager.sendMessage("Autoplay is turned off");
	}

	async skip() {
		await this.messager.sendMessage(`Skipping song... Autoplay is turned ${this.Controller.isAutoplayOn ? 'on' : 'off'}`);
		return this.Controller.skip();
	}

	async leave() {
		if (this.Controller.leaveVoiceChannel()) {
			await this.messager.sendMessage("Left the channel.");
		}
	}

	async play(argObj?: ParsedMessageRequest): Promise<void> {
		let enqueuedSong: Song;
		try {
			if (argObj) {
				const isAutoplay: boolean = Commands.AUTOPLAY.some(a => a === argObj.command);
				const searchKeywords: string[] = argObj.args;
				enqueuedSong = await this.Controller.play(searchKeywords, isAutoplay);
			} else {
				enqueuedSong = await this.Controller.play();
			}
		} catch (err) {
			await this.messager.sendMessage(`Error occured while trying to play a song: ${err.message}:\n${err.stack}`);
		}

		if (this.Controller.isPlaying) {
			await this.messager.sendEnqueuedSong(enqueuedSong);
		}
	}

	removeFromQueue(args): void {
		const index: number = args[0] - 1;
		try {
			const removedSong: Song = this.Controller.removeIndex(index);
			this.messager.sendRemovedSong(removedSong);
		} catch (error) {
			this.messager.sendMessage(error.message);
		}
	}


	outputSongArray(songArray: Song[]): void {
		let message: string = "";
		let i: number = 1;

		// use string builder class here

		for (let song of songArray) {
			message += `${i++}. ${song.snippet.title} | ${song.contentDetails.duration} | From: ${song.snippet.channelTitle}\n`;

			if (i === songArray.length || (i > 0 && i % 100 === 0)) {
				this.messager.sendTextMessage(message);
				message = "";
			}
		}
	}

	showPlayedHistory(): void {
		const playedSongs: Song[] = this.Controller.audioHistory;
		if (!playedSongs.length) {
			this.messager.sendTextMessage("Audio history is empty.");
			return;
		}

		this.outputSongArray(playedSongs);
	}

	showQueue(): void {
		const queue: Song[] = this.Controller.audioQueue;
		if (!queue.length) {
			this.messager.sendTextMessage("Queue is empty.");
			return;
		}

		this.outputSongArray(queue);
	}
}
