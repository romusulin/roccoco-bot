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
import { Message, Client } from "discord.js";
import { MusicController } from "./music-ctrl";
import { Constants, ArgumentPassObject } from "./interfaces";

// Inits
const client = new Discord.Client();
const Router = new MusicRouter();

global.client = <Client> client;
global.Discord = Discord;

client.login(auth.token);

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
    Router.Controller = new MusicController();
});

client.on("message", async (msg: Message) => {
    var argObj: ArgumentPassObject = Utils.parseMessage(msg);
    if (!argObj.success) {
        return;
    }

    if (_.isEmpty(Router.Controller)) {
        Router.Controller = new MusicController();
    }

    if (_.isEmpty(Router.Controller.voiceConnection)) {
        await Router.init(argObj);
    }
    
    var cmd: string = argObj.cmd;
    if (cmd === Constants.JOIN) {
        Router.init(argObj);
    } else if (cmd === Constants.LEAVE) {
        Router.leave();
    } else if (cmd === Constants.PLAY) {
        Router.play(argObj, false);
    } else if (cmd === Constants.AUTOPLAY) {
        Router.play(argObj, true);
    } else if (cmd === Constants.USE_THIS_TEXT_CHANNEL) {
        Router.useThisTextChannel(argObj);
        return msg.react("🍆");
    } else if (cmd === Constants.SKIP) {
        Router.skip();
    } else if (cmd === Constants.QUEUE) {
        Router.showQueue();
    } else if (cmd === Constants.NOW_PLAYING) {
        Router.nowPlaying();
    } else if (cmd === Constants.CLEAR_QUEUE) {
        Router.clearQueue();
    } else if (cmd === Constants.REMOVE) {
        Router.removeFromQueue(argObj.args);
    } else if (cmd === Constants.AUTOPLAY_THIS) {
        Router.autoplayCurrentSong();
    } else if (cmd === Constants.AUTOPLAY_OFF) {
        Router.turnAutoplayOff();
    } else if (cmd === Constants.SHOW_PLAYED_HISTORY) {
        Router.showPlayedHistory();
    } else if(cmd === "eval") {
        // Might pose a security issue
        eval(argObj.args.join(" "));
    }
});

