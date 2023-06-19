import { stream as streamYt } from "play-dl";
import { AudioPlayer, createAudioResource, VoiceConnection } from "@discordjs/voice";

export class Player extends AudioPlayer {
	constructor() {
		super();
	}

	async playSong(voiceConnection: VoiceConnection, songId: string) {
		const { stream } = await streamYt(songId, {
			discordPlayerCompatibility: true
		});

		const resource = createAudioResource(stream);
		voiceConnection.subscribe(this);
		this.play(resource);

		return this;
	}
}