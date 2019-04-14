declare const console;
declare const require;
declare const global;
declare const process;
var auth = require("../auth.json");

import * as Discord from "discord.js";
import { Utils } from "./utils";
import { MusicRouter } from "./router";
import { Message, Client, Snowflake } from "discord.js";
import { ArgumentPassObject } from "./interfaces";

// Inits
const client = new Discord.Client();

global.client = <Client> client;
global.Discord = Discord;

client.login(auth.token);

client.on("ready", () => {
	console.log(`Logged in as ${client.user.tag}!`);
});

const RouterByGuildId = new Map<Snowflake, MusicRouter>();

client.on("message", (msg: Message) => {
	var argObj: ArgumentPassObject = Utils.parseMessage(msg);
	if (!argObj.success) {
		return;
	}
	if (!RouterByGuildId.has(argObj.guildId)) {
		RouterByGuildId.set(argObj.guildId, new MusicRouter());
	}


	RouterByGuildId.get(argObj.guildId).execute(argObj);
});

process.on('uncaughtException', function(err) {
	console.log('Caught exception: ' + JSON.stringify(err));
});
