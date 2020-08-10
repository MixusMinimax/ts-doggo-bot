"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("discord.js");
const discord_js_1 = require("discord.js");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const process_1 = require("process");
const package_json_1 = __importDefault(require("../package.json"));
const config_json_1 = __importDefault(require("./config.json"));
const doggoPath = path_1.default.join(__dirname, './images/doggos');
const mods = ["Administrator", "Admin", "Moderator"];
const client = new discord_js_1.Client();
client.on('ready', () => {
    var _a;
    console.log(`Bot has started, with ${client.users.cache.size} users, in ${client.channels.cache.size} channels of ${client.guilds.cache.size} guilds.`);
    // Example of changing the bot's playing game to something useful. `client.user` is what the
    // docs refer to as the "ClientUser".
    (_a = client.user) === null || _a === void 0 ? void 0 : _a.setActivity(`Serving ${client.guilds.cache.size} servers`);
});
client.on('guildCreate', guild => {
    var _a;
    // This event triggers when the bot joins a guild.
    console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
    (_a = client.user) === null || _a === void 0 ? void 0 : _a.setActivity(`Serving ${client.guilds.cache.size} servers`);
});
client.on('guildDelete', guild => {
    var _a;
    // this event triggers when the bot is removed from a guild.
    console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`);
    (_a = client.user) === null || _a === void 0 ? void 0 : _a.setActivity(`Serving ${client.guilds.cache.size} servers`);
});
client.on('message', async (message) => {
    // This event will run on every single message received, from any channel or DM.
    var _a;
    // It's good practice to ignore other bots. This also makes your bot ignore itself
    // and not get into a spam loop (we call that "botception").
    if (message.author.bot)
        return;
    if (message.guild === null)
        return;
    if (message.content.toLowerCase().includes("doggo")) {
        fs_1.default.readdir(doggoPath, function (err, files) {
            //handling error
            if (err) {
                return console.log('Unable to scan directory: ' + err);
            }
            var file = files[Math.floor(Math.random() * files.length)];
            message.channel.send({ files: [path_1.default.join(doggoPath, file)] });
        });
    }
    //if (message.content.replace(/ *\<[^>]*\) */g, "").includes("69")) {
    //	message.reply("nice");
    //}
    if (message.content.toLowerCase().includes('good boi')) {
        const emoji = message.guild.emojis.cache.find(emoji => emoji.name === 'goodboi');
        if (emoji != null)
            message.react(emoji);
        else
            console.error('Emoji "goodboi" not found!');
    }
    else if (message.content.toLowerCase().includes('bad boi')) {
        const emoji = message.guild.emojis.cache.find(emoji => emoji.name === 'angeryboi');
        if (emoji != null)
            message.react(emoji);
        else
            console.error('Emoji "angeryboi" not found!');
    }
    else if (message.content.toLowerCase().includes('boi')) {
        const emoji = message.guild.emojis.cache.find(emoji => emoji.name === 'boiiiiii');
        if (emoji != null)
            message.react(emoji);
        else
            console.error('Emoji "boiiiiii" not found!');
    }
    // Also good practice to ignore any message that does not start with our prefix,
    // which is set in the configuration file.
    if (message.content.indexOf(config_json_1.default.prefix) !== 0)
        return;
    // Here we separate our "command" name, and our "arguments" for the command.
    // e.g. if we have the message "+say Is this the real life?" , we'll get the following:
    // command = say
    // args = ["Is", "this", "the", "real", "life?"]
    const args = message.content.slice(config_json_1.default.prefix.length).replace('\n', ' ').trim().split(/ +/g);
    const cmd = (_a = args.shift()) === null || _a === void 0 ? void 0 : _a.toLowerCase();
    if (cmd == null) {
        console.error('no command supplied');
        return;
    }
    // Let's go with a few common example commands! Feel free to delete or change those.
    switch (cmd) {
        case 'ping':
            // Calculates ping between sending a message and editing it, giving a nice round-trip latency.
            // The second ping is an average latency between the bot and the websocket server (one-way, not round-trip)
            message.channel.send('Pinging...').then(m => {
                var ping = m.createdTimestamp - message.createdTimestamp;
                m.edit(`**Pong!** API latency: ${ping}ms`);
            });
            break;
        case 'say':
            // makes the bot say something and delete the message. As an example, it's open to anyone to use.
            // To get the "message" itself we join the `args` back into a string with spaces:
            const sayMessage = args.join(" ");
            // Then we delete the command message (sneaky, right?). The catch just ignores the error with a cute smiley thing.
            message.delete().catch(O_o => { });
            // And we get the bot to say the thing:
            message.channel.send(sayMessage);
            break;
        case 'help':
            message.channel.send(fs_1.default.readFileSync('help.txt').toString());
            break;
        case 'time':
            const today = new Date();
            const date = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
            const time = `${today.getHours()}:${today.getMinutes()}`;
            return message.channel.send(`The current time is: ${time} on ${date}`);
        case 'info':
            const embed = new discord_js_1.MessageEmbed()
                .setColor('#0099ff')
                .setTitle(config_json_1.default.info.name)
                .setURL(config_json_1.default.info.url)
                .setAuthor(config_json_1.default.info.author.name, config_json_1.default.info.author.icon, config_json_1.default.info.author.url)
                .setDescription(config_json_1.default.info.description)
                .addField('Version', package_json_1.default.version)
                .setImage('https://cdn.discordapp.com/avatars/642869958635683851/780e2ba65003b8f8538c93bf7d8d431b.png?size=128')
                .setTimestamp();
            return message.channel.send(embed);
        case 'links':
            return message.reply("I don't handle links anymore!\nUse `$links` to access links.\nType `$man links` to learn more!");
        case "linkremove":
            return message.reply("This functionality has been moved to PythonBot!");
        case "purge":
            // This command removes all messages from all users in the channel, up to 100.
            // get the delete count, as an actual number.
            const deleteCount = parseInt(args[0], 10);
            // Ooooh nice, combined conditions. <3
            if (!deleteCount || deleteCount < 2 || deleteCount > 100)
                return message.reply("Please provide a number between 2 and 100 for the number of messages to delete");
            // So we get our messages, and delete them. Simple enough, right?
            const fetched = await message.channel.messages.fetch({ limit: deleteCount });
            return message.channel.bulkDelete(fetched)
                .catch(error => message.reply(`Couldn't delete messages because of: ${error}`));
    }
});
const token = process.env.DISCORD_TOKEN;
console.log(`Token: {${token}}`);
if (token == null) {
    console.error("token not found! make sure to define it in the environment variable \"DISCORD_TOKEN\"!");
    process_1.exit(-1);
}
client.login(token);
