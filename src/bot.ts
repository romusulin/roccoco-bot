declare const console;
declare const require;
declare const global;

var auth = require("../auth.json");

// Libs
import * as _ from "lodash";
import * as Discord from "discord.js";


// Imports
import { Utils } from "./utils";
import { MusicRouter } from "./music-router";
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

