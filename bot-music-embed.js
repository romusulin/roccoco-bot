(function() {
    var getNowPlaying = function(nowPlaying) {
        const embed = new Discord.RichEmbed()
        .setTitle("RoccocoBot is now playing:")
        .setAuthor("Military Spec Battle Worn Bot", "https://i.redditmedia.com/21uJy-0Ptmt1HLSnkPar37ScvmUCeOXyj1DeqZ-JURY.jpg?w=432&s=e7fdfac555c5fbcc68a36fad051bb7d0")
        .setColor(0x7851a9)
        .setThumbnail(nowPlaying.snippet.thumbnails.high.url)
        .setTimestamp()
        .setURL("https://discord.js.org/#/docs/main/indev/class/RichEmbed")
        .addField("Song:", nowPlaying.snippet.title)
        .addField("Channel:", nowPlaying.snippet.channelTitle)
        .setFooter("RoccocoBot", 
        "https://i.redditmedia.com/21uJy-0Ptmt1HLSnkPar37ScvmUCeOXyj1DeqZ-JURY.jpg?w=432&s=e7fdfac555c5fbcc68a36fad051bb7d0"
        );

        return embed;
    }
 
    var EmbedBuilder = {
        getNowPlayingEmbed: getNowPlayingEmbed

    };
    module.exports = EmbedBuilder;
})();