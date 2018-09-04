import { StreamOptions } from "discord.js";

export class Settings {
	static CommandPrefix: string = "!";
	static RunSamples: boolean = false;
	static HistoryDepthCheck: number = 15;
	static StreamDispatcherOptions = <StreamOptions> {
		volume: 0.1,
		passes: 1,
		bitrate: "auto"
	}
}

