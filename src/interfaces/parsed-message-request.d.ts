import { Message, Snowflake, TextChannel } from "discord.js";

export interface ParsedMessageRequest {
	success: boolean;
	command?: string;
	guildId?: Snowflake;
	args?: string[];
	channel?: TextChannel;
	authorId?: string;
	message?: Message;
}