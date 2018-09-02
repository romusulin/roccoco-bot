// Libs
import * as ytdl from "ytdl-core";

// Imports
import { VoiceConnection, StreamDispatcher } from "discord.js";
import { Settings } from "./settings";
import { SongId } from "./interfaces";

export class MusicPlayer {
    private voiceConnection: VoiceConnection;
    streamDispatcher: StreamDispatcher;
    progressInfo: any;

    setVoiceConnection(vc: VoiceConnection) {
        this.voiceConnection = vc;
    }

    getProgressInfo() {
        return this.progressInfo;
    }

    getStream(songId: SongId): StreamDispatcher {
        const stream = ytdl(String(songId), { filter: 'audioonly' })
        .on("progress", (response) => {
            this.progressInfo = response;
        });
        this.streamDispatcher = this.voiceConnection.playStream(stream, Settings.StreamDispatcherOptions); 

        return this.streamDispatcher;
    }
}