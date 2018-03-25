var Discord = require("discord.js");
var auth = require("./auth.json");
var _ = require("lodash");

var Constants = require("./bot-constants.js");
var PrefixManager = require("./bot-prefix.js");
var MusicManager = require("./bot-music.js");


const client = new Discord.Client();
client.login(auth.token);

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on("message", msg => {
    var message = msg.content;
    var checkObj = PrefixManager.checkPrefix(message);
    if (!checkObj.status) {
        return;
    }

    var allArgs = message.substring(checkObj.prefix.length).split(" ");
    var cmd = allArgs[0];

    var args = allArgs.splice(1);
    
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
        console.log(args);
        var voiceChannel = client.channels.find('name', args[0]);
        return voiceChannel.join();
    } else if (cmd === Constants.LEAVE) {
        var voiceChannel = client.channels.find('name', args[0]);
        return voiceChannel.leave();
    }
});