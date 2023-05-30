import * as ytdl from "ytdl-core";
import {
	AudioPlayer,
	createAudioResource,
	VoiceConnection
} from "@discordjs/voice";

export class Player extends AudioPlayer {
	constructor() {
		super();
	}

	playSong(voiceConnection: VoiceConnection, songId: string) {
		const stream = ytdl(songId, {filter: 'audioonly', quality: 'highest'});
		const resource = createAudioResource(stream);
		voiceConnection.subscribe(this);
		this.play(resource);

		return this;
	}
}