import { Client } from 'discord.js'
import { exit } from 'process'
import config from '../config/config.json'
import * as commands from './commands'
import * as database from './database'
import { dlog } from './tools/log'

const client = new Client()

client.on('ready', () => {
    dlog('BOT.ready', `Bot has started, with ${client.users.cache.size} users, in ${client.channels.cache.size} channels of ${client.guilds.cache.size} guilds.`)
    client.user?.setActivity(`Barking at fucking nothing`)
})

client.on('guildCreate', guild => {
    // This event triggers when the bot joins a guild.
    dlog('BOT.guildCreate', `New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`)
})

client.on('guildDelete', guild => {
    // this event triggers when the bot is removed from a guild.
    dlog('BOT.guildDelete', `I have been removed from: ${guild.name} (id: ${guild.id})`)
})

client.on('message', async message => {
    // This event will run on every single message received, from any channel or DM.

    // Ignore other bots
    if (message.author.bot) return
    if (message.guild == null) return

    const result = await commands.handleMessage(message)

    if (result) {
        return message.channel.send(result)
    }
})

const token: string | undefined = process.env.DISCORD_TOKEN
dlog('BOT.token', `Token: {${token}}`)
if (token == null) {
    console.error('token not found! make sure to define it in the environment variable "DISCORD_TOKEN"!')
    exit(-1)
}

dlog('BOT.owner', `Owner Tag: {${process.env.OWNER_TAG}}`);

(async () => {
    await database.connect()
    await client.login(token)
})()