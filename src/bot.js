"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("discord.js");
const discord_js_1 = require("discord.js");
const client = new discord_js_1.Client();
client.on('ready', () => {
    var _a;
    console.log(`Bot has started, with ${client.users.cache.size} users, in ${client.channels.cache.size} channels of ${client.guilds.cache.size} guilds.`);
    // Example of changing the bot's playing game to something useful. `client.user` is what the
    // docs refer to as the "ClientUser".
    (_a = client.user) === null || _a === void 0 ? void 0 : _a.setActivity(`Serving ${client.guilds.cache.size} servers`);
});
client.on('message', msg => {
    if (msg.content === '!ping') {
        msg.reply('pong');
    }
});
const token = process.env.DISCORD_TOKEN;
console.log(`Token: {${token}}`);
client.login(token);
