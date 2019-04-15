declare const client;
declare const console;

//Imports
import { MusicController } from "./music/controller";
import { ArgumentPassObject, Song, Commands } from "./interfaces";
import { Utils } from "./utils";
import { ChatLogger } from "./chat/logger";
import { TaskExecutorBuilder } from "./task-executor";
import { TextChannel, VoiceChannel } from "discord.js";

export class MusicRouter {
	Controller: MusicController;
	Messager: ChatLogger;
	TaskExecutor: TaskExecutorBuilder;

	constructor() {
		this.Messager = new ChatLogger();
		this.TaskExecutor = new TaskExecutorBuilder(this)
		.register(Commands.JOIN, this.init)
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
		.register(Commands.SHOW_PLAYED_HISTORY, this.showPlayedHistory);

		this.Controller = new MusicController()
		.on(MusicController.STARTED_SPEAKING, () => {
			this.Messager.sendNowStartedPlaying(this.Controller.currentSong);
			client.user.setActivity(this.Controller.currentSong.snippet.title);
		})
		.on(MusicController.STOPPED_SPEAKING, () => {
			client.user.setActivity(this.Controller.isAutoplayOn ? "Finding another song..." : "");
		})
		.on(MusicController.DISPATCHER_END, (reason) => {
			if (reason !== Commands.LEAVE) {
				this.play();
			}
		});
	}

	async execute(argObj: ArgumentPassObject): Promise<void> {
		if (!this.Controller || !this.Controller.voiceConnection) {
			await this.init(argObj);
		}

		await this.TaskExecutor.execute(argObj);
	}

	 async init(argObj: ArgumentPassObject): Promise<void> {
		this.Messager.textChannel = argObj.channel as TextChannel;
		const foundVoiceChannel: VoiceChannel = Utils.getVoiceChannelByUserId(argObj.authorId);
		await this.Controller.setVoiceConnection(foundVoiceChannel);
	}

	nowPlaying(): void {
		this.Messager.sendNowStartedPlaying(this.Controller.currentSong);
	}

	clearQueue(): void {
		const noOfRemovedSongs: number = this.Controller.clearQueue();
		this.Messager.sendTextMessage(`Queue cleared.\nRemoved ${noOfRemovedSongs} song ${(noOfRemovedSongs !== 1 ? "s" : "")}.`);
	}

	autoplayCurrentSong(): void {
		this.Controller.autoplayCurrentSong();
		this.Messager.sendChangedAutoplayPointer(this.Controller.currentSong);
	}

	useThisTextChannel(argObj: ArgumentPassObject): void {
		this.Messager.textChannel = argObj.channel;
		argObj.message.react("🍆");
	}

	turnAutoplayOff(): void {
		this.Controller.isAutoplayOn = false;
		this.Messager.sendMessage("Autoplay is turned off");
	}

	skip(): Promise<void> {
		return this.Controller.skip();
	}

	leave(): void {
		if (!this.Controller.voiceConnection) {
			this.Controller.leaveVoiceChannel();
		}
	}

	// TODO: promisify with a .once(resolve)
	async play(argObj?: ArgumentPassObject): Promise<void> {
		let enqueuedSong: Song;
		try {
			if (argObj) {
				const isAutoplay: boolean = argObj.command === Commands.AUTOPLAY;
				const searchKeywords: string[] = argObj.args;
				enqueuedSong = await this.Controller.play(searchKeywords, isAutoplay);
			} else {
				enqueuedSong = await this.Controller.play();
			}
		} catch (err) {
			this.Messager.sendMessage(`Exception occured during play: ${err.message}:\n${err.stack}`);
		}

		if (this.Controller.isPlaying) {
			this.Messager.sendEnqueuedSong(enqueuedSong);
		}
	}

	removeFromQueue(args): void {
		const index: number = args[0] - 1;
		try {
			const removedSong: Song = this.Controller.removeIndex(index);
			this.Messager.sendRemovedSong(removedSong);
		} catch (error) {
			this.Messager.sendMessage(error.message);
		}
	}


	outputSongArray(songArray: Song[]): void {
		let message: string = "";
		let i: number = 1;

		// use string builder class here

		for (let song of songArray) {
			message += `${i++}. ${song.snippet.title} | ${song.contentDetails.duration} | From: ${song.snippet.channelTitle}\n`;

			if (i === songArray.length || (i > 0 && i % 100 === 0)) {
				this.Messager.sendTextMessage(message);
				message = "";
			}
		}
	}

	showPlayedHistory(): void {
		const playedSongs: Song[] = this.Controller.audioHistory;
		if (!playedSongs.length) {
			this.Messager.sendTextMessage("Audio history is empty.");
			return;
		}

		this.outputSongArray(playedSongs);
	}

	showQueue(): void {
		const queue: Song[] = this.Controller.audioQueue;
		if (!queue.length) {
			this.Messager.sendTextMessage("Queue is empty.");
			return;
		}

		this.outputSongArray(queue);
	}
}
