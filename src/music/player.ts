// Libs
import * as ytdl from "ytdl-core";

// Imports
import { VoiceConnection, StreamDispatcher } from "discord.js";
import { Settings } from "../settings";

export class MusicPlayer {
	private voiceConnection: VoiceConnection;
	streamDispatcher: StreamDispatcher;
	progressInfo: any;

	constructor(voiceConnection: VoiceConnection, songId: string) {
		this.voiceConnection = voiceConnection;
		const stream = ytdl(songId, { filter: 'audioonly', quality: "highestaudio" });
		this.streamDispatcher = this.voiceConnection.playStream(stream, Settings.StreamDispatcherOptions);
	}

	setVoiceConnection(vc: VoiceConnection) {
		this.voiceConnection = vc;
	}

	getProgressInfo() {
		// WIP
		return this.progressInfo;
	}

	getStream(): StreamDispatcher {
		return this.streamDispatcher;
	}
}
