// Libs
import * as _ from "lodash";

//Imports
import { MusicController } from "./music-ctrl";
import { ArgumentPassObject, Song, Constants } from "./interfaces";
import { Utils } from "./utils";
import { ChatLogger } from "./chat-loggers";

export class MusicRouter {
	Controller: MusicController;
	Messager: ChatLogger;

	 async init(argObj: ArgumentPassObject): Promise<void> {
		this.Messager = new ChatLogger();
		this.Messager.textChannel = argObj.channel;

		await this.Controller.setVoiceConnection(await Utils.getVoiceChannelByUserId(argObj.authorId));

		this.Controller.streamDispatcherListeners.push((isSpeaking) => {
			if (isSpeaking) {
				this.Messager.sendNowStartedPlaying(this.Controller.currentSong);
			}
		});
	}

	nowPlaying(): void {
		this.Messager.sendTextMessage(`Skipping song: ${this.Controller.currentSong.snippet.title}`);
	}

	clearQueue(): void {
		const noOfRemovedSongs: number = this.Controller.clearQueue();
		this.Messager.sendTextMessage(`Queue cleared.\nRemoved ${noOfRemovedSongs} song ${(noOfRemovedSongs > 1 ? "s" : "")}.`);
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
		 this.Controller.setIsAutoplayOn(false);
		 this.Messager.sendMessage("Autoplay is turned off");
	}

	skip(): void {
		this.Controller.skip();
	}

	leave(): void {
		if (!_.isEmpty(this.Controller.voiceConnection)) {
			this.Controller.leaveVoiceChannel();
		}
	}

	async play(argObj: ArgumentPassObject, isAutoplay: boolean): Promise<void> {
		let enqueuedSong: Song;
		try {
			enqueuedSong = await this.Controller.pushToQueue(argObj.args, isAutoplay);
		} catch (err) {
			this.Messager.sendMessage(`Exception occured during enqueueing: ${err.message}`);
		}
		if (this.Controller.isNowPlaying) {
			this.Messager.sendEnqueuedSong(enqueuedSong);
		} else {
			this.Controller.play();
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