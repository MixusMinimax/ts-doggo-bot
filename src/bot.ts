import "discord.js";
import { Client } from "discord.js";

const client = new Client();

client.on('ready', () => {
    console.log(`Bot has started, with ${client.users.cache.size} users, in ${client.channels.cache.size} channels of ${client.guilds.cache.size} guilds.`);
    // Example of changing the bot's playing game to something useful. `client.user` is what the
    // docs refer to as the "ClientUser".
    client.user?.setActivity(`Serving ${client.guilds.cache.size} servers`);
})

client.on('message', msg => {
    if (msg.content === '!ping') {
        msg.reply('pong');
    }
});

const token: string | undefined = process.env.DISCORD_TOKEN

console.log(`Token: {${token}}`)

client.login(token);