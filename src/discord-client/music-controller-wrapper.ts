import { MusicController } from "../music/controller";
import { ParsedMessageRequest } from "../interfaces/parsed-message-request";
import { ChatLogger } from "../chat/logger";
import { TaskExecutorBuilder } from "../utilities/task-executor";
import { Commands } from "../chat/commands";
import { Song } from "../interfaces/song";

export class MusicControllerWrapper {
	private musicController: MusicController;
	private messager: ChatLogger;
	private taskExecutor: TaskExecutorBuilder;

	constructor(musicController: MusicController) {
		this.musicController = musicController;
		this.messager = new ChatLogger();
		this.taskExecutor = new TaskExecutorBuilder(this)
		.register(Commands.JOIN, this.joinVoiceChannel)
		.register(Commands.LEAVE, this.leave)
		.register(Commands.PLAY, this.playSong)
		.register(Commands.AUTOPLAY, this.playSong)
		.register(Commands.USE_THIS_TEXT_CHANNEL, this.useThisTextChannel)
		.register(Commands.SKIP, this.skipSong)
		.register(Commands.QUEUE, this.showQueue)
		.register(Commands.NOW_PLAYING, this.nowPlaying)
		.register(Commands.CLEAR_QUEUE, this.clearSongQueue)
		.register(Commands.REMOVE, this.removeFromQueue)
		.register(Commands.AUTOPLAY_THIS, this.autoplayThis)
		.register(Commands.AUTOPLAY_OFF, this.turnAutoplayOff)
		.register(Commands.SHOW_PLAYED_HISTORY, this.showPlayedHistory)
		.register(Commands.CLEAR_HISTORY, this.cleanHistory);

		this.musicController.on(MusicController.EVENT.STARTED_SPEAKING, () => {

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

		await this.musicController.setVoiceChannel(voiceChannel.id, voiceChannel.guild.voiceAdapterCreator);
		await argObj.message.react('👌');
	}

	async nowPlaying() {
		await this.messager.sendNowStartedPlaying(this.musicController.currentSong);
	}

	async clearSongQueue() {
		const noOfRemovedSongs: number = this.musicController.clearQueue();
		await this.messager.sendTextMessage(`Queue cleared.\nRemoved ${noOfRemovedSongs} song ${(noOfRemovedSongs !== 1 ? "s" : "")}.`);
	}

	async cleanHistory() {
		this.musicController.clearAudioHistory();
		await this.messager.sendTextMessage(`History cleared.`);
	}

	async autoplayThis() {
		await this.musicController.autoplayCurrentSong();
		await this.messager.sendChangedAutoplayPointer(this.musicController.currentSong);
	}

	async useThisTextChannel(argObj: ParsedMessageRequest) {
		this.messager.textChannel = argObj.channel;
		await argObj.message.react("🍆");
	}

	async turnAutoplayOff() {
		this.musicController.isAutoplayOn = false;
		await this.messager.sendMessage("Autoplay is turned off");
	}

	async skipSong() {
		await this.messager.sendMessage(`Skipping song... Autoplay is turned ${this.musicController.isAutoplayOn ? 'on' : 'off'}`);
		await this.musicController.skip();
	}

	async leave() {
		if (this.musicController.leaveVoiceChannel()) {
			await this.messager.sendMessage("Left the channel.");
		}
	}

	async playSong(argObj?: ParsedMessageRequest): Promise<void> {
		let enqueuedSong: Song;
		try {
			if (argObj) {
				const isAutoplay: boolean = Commands.AUTOPLAY.some(a => a === argObj.command);
				const searchKeywords: string[] = argObj.args;
				enqueuedSong = await this.musicController.play(searchKeywords, isAutoplay);
			} else {
				enqueuedSong = await this.musicController.play();
			}
		} catch (err) {
			await this.messager.sendMessage(`Error occured while trying to play a song: ${err.message}:\n${err.stack}`);
		}

		if (this.musicController.isPlaying) {
			await this.messager.sendEnqueuedSong(enqueuedSong);
		}
	}

	removeFromQueue(args): void {
		const index: number = args[0] - 1;
		try {
			const removedSong: Song = this.musicController.removeIndex(index);
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
		const playedSongs: Song[] = this.musicController.audioHistory;
		if (!playedSongs.length) {
			this.messager.sendTextMessage("Audio history is empty.");
			return;
		}

		this.outputSongArray(playedSongs);
	}

	showQueue(): void {
		const queue: Song[] = this.musicController.audioQueue;
		if (!queue.length) {
			this.messager.sendTextMessage("Queue is empty.");
			return;
		}

		this.outputSongArray(queue);
	}
}
