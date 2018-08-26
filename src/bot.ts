declare const console;
declare const require;
declare const global;



// Libs
import * as Discord from "discord.js";
var auth = require("../auth.json");

// Imports
import { PrefixUtils } from "./bot-prefix";
import { MusicManagement } from "./bot-music";
import { Constants } from "./interfaces";
import { Message, Client } from "discord.js";

// Inits
const client = new Discord.Client();
const MusicManager = new MusicManagement();

global.client = <Client> client;
global.Discord = Discord;

client.login(auth.token);

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on("message", (msg: Message) => {
    var argObj = PrefixUtils.parseMessage(msg);
    if (!argObj.success) {
        return;
    }

    var cmd = argObj.cmd;
    var args = argObj.args;
    
    if (cmd === Constants.PING) {
        return msg.channel.send("<@" + msg.author.id + "> WSPing:" + client.ping);
    } else if (cmd === Constants.JOIN) {
        return msg.channel.send(MusicManager.init(argObj));
    } else if (cmd === Constants.LEAVE) {
        return msg.channel.send(MusicManager.leave());
    } else if (cmd === Constants.PLAY) {
        MusicManager.play(argObj);
    } else if (cmd === Constants.USE_THIS_TEXT_CHANNEL) {
        MusicManager.useThisTextChannel(argObj);
        return msg.react("🍆");
    } else if (cmd === Constants.PING_TEXT_CHANNEL) {
        return MusicManager.pingTextChannel();
    } else if (cmd === Constants.SKIP) {
        MusicManager.skip();
    } else if (cmd === Constants.QUEUE) {
        MusicManager.showQueue();
    } else if (cmd === Constants.SHUT_DOWN) {
        // TODO
    } else if (cmd === Constants.RESUME) {
        MusicManager.resume();
    } else if (cmd === Constants.PAUSE) {
        MusicManager.pause();
    } else if (cmd === Constants.NOW_PLAYING) {
        MusicManager.nowPlaying();
    } else if (cmd === Constants.CLEAR_QUEUE) {
        MusicManager.clearQueue();
    } else if (cmd === Constants.REMOVE) {
        MusicManager.removeFromQueue(argObj.args);
    } else if (cmd === Constants.AUTOPLAY) {
        MusicManager.autoPlay(argObj);
    } else if (cmd === Constants.AUTOPLAY_THIS) {
        MusicManager.autoPlayThis();
    } else if (cmd === Constants.AUTOPLAY_OFF) {
        MusicManager.turnAutoplayOff();
    } else if (cmd === Constants.SHOW_PLAYED_HISTORY) {
        MusicManager.showPlayedHistory();
    } else if (cmd === Constants.NUDGE) {
        return new Promise((resolve, reject) => {
            return MusicManager.reset();
        }).then(function() {
            return client.destroy();
        });
    }
});

