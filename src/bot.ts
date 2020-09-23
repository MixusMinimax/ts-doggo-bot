import { Client } from 'discord.js'
import fs from 'fs'
import path from 'path'
import { exit } from 'process'
import config from '../config/config.json'
import * as database from './database/database'
import * as handler from './handlers/handler'
import { dlog } from './tools/log'

const doggoPath = path.join(__dirname, '../assets/images/doggos')
const mods = ['Administrator', 'Admin', 'Moderator']

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

    // Non-commands
    if (message.content.indexOf(config.prefix) !== 0) {

        if (message.content.toLowerCase().includes('doggo')) {
            fs.readdir(doggoPath, function (err, files) {
                // handling error
                if (err) {
                    return console.error('Unable to scan directory: ' + err)
                }
                const file = files[Math.floor(Math.random() * files.length)]
                message.channel.send({ files: [path.join(doggoPath, file)] })
            })
        }


        if (message.content.toLowerCase().includes('good boi')) {
            const emoji = message.guild.emojis.cache.find(x => x.name === 'goodboi')
            if (emoji != null)
                message.react(emoji)
            else
                console.error('Emoji "goodboi" not found!')
        }
        else if (message.content.toLowerCase().includes('bad boi')) {
            const emoji = message.guild.emojis.cache.find(x => x.name === 'angeryboi')
            if (emoji != null)
                message.react(emoji)
            else
                console.error('Emoji "angeryboi" not found!')
        }
        else if (message.content.toLowerCase().includes('boi')) {
            const emoji = message.guild.emojis.cache.find(x => x.name === 'boiiiiii')
            if (emoji != null)
                message.react(emoji)
            else
                console.error('Emoji "boiiiiii" not found!')
        }
    } else {
        const result = await handler.handleMessage(message)

        if (result) {
            return message.channel.send(result)
        }
    }
})

const token: string | undefined = process.env.DISCORD_TOKEN
dlog('BOT.token', `Token: {${token}}`)
if (token == null) {
    console.error('token not found! make sure to define it in the environment variable "DISCORD_TOKEN"!')
    exit(-1)
}

(async () => {
    await database.connect()
    await client.login(token)
})()