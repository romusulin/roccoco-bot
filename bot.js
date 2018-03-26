// Libs
var Discord = require("discord.js");
var auth = require("./auth.json");
var _ = require("lodash");

// Imports
var Constants = require("./bot-constants.js");
var PrefixManager = require("./bot-prefix.js");
var MusicManager = require("./bot-music.js");

// Didscord client
const client = new Discord.Client();
client.login(auth.token);
client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on("message", msg => {
    var message = msg.content;
    var argObj = PrefixManager.checkPrefix(message);
    if (!argObj.status) {
        return;
    }

    var cmd = argObj.cmd;
    var args = argObj.args;
    
    if (cmd === Constants.PING) {
        msg.reply("nemoj biti dugetantan");
    } else if (cmd === Constants.PREFIX) {
        //msg.reply(prefixManager.parseArgs(args).body);
        var response = PrefixManager.parseArgs(args);
        if (response.status === false) {
            msg.reply(response.body);
        } else if (response.status === true) {
            msg.reply(response.body);
        }
    } else if (cmd === Constants.JOIN) {
        return msg.channel.send(MusicManager.init(client, msg));
    } else if (cmd === Constants.LEAVE) {
        return msg.channel.send( MusicManager.leave());
    } else if (cmd === Constants.PLAY) {
        MusicManager.play(args.join(" "));
    } else if (cmd === Constants.SKIP) {
        MusicManager.skip();
    } else if (cmd === Constants.QUEUE) {
        MusicManager.showQueue();
    }
});

