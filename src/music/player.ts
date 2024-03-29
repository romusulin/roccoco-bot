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
		const channelId = voiceConnection.joinConfig.channelId;
		const channel = global.client.channels?.cache?.get(channelId);

		const stream = ytdl(songId, {quality: 'highest', filter: 'audioonly'});

		const resource = createAudioResource(stream);
		voiceConnection.subscribe(this);
		this.play(resource);

		return this;
	}
}