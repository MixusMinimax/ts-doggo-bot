import { Message } from 'discord.js'
import config from '../../config/config.json'
import { dlog } from '../tools/log'
import parseMessage from '../tools/messageParser'
import { reply, tokenize } from '../tools/string.utils'
import { PrintHelpError } from '../tools/throwingArgparse'
import { ClearTextError, Indexable, PermissionLevelException } from '../tools/types'
import { Handler } from './handler.type'
import { HelpHandler } from './help.handler'
import { InfoHandler } from './info.handler'
import { LinksHandler } from './links.handler'
import { PermissionError, PermissionHandler } from './permission.handler'
import { PingHandler } from './ping.handler'
import { PurgeHandler } from './purge.handler'
import { SayHandler } from './say.handler'
import { SearchMemberHandler } from './searchMember.handler'
import { SettingsHandler } from './settings.handler'
import { TimeHandler } from './time.handler'

export const handlers: Indexable<Handler> = {
    info: new InfoHandler('info'),
    help: new HelpHandler('help'),
    ping: new PingHandler('ping'),
    time: new TimeHandler('time'),
    say: new SayHandler('say'),
    purge: new PurgeHandler('purge'),
    links: new LinksHandler('links'),
    permission: new PermissionHandler('permission'),
    search: new SearchMemberHandler('search'),
    settings: new SettingsHandler('settings'),
}

export async function handle(
    tokens: string[], body: string, message: Message,
    { commandLine }: { commandLine?: string } = {}
): Promise<string | undefined> {

    if (!commandLine) {
        commandLine = tokens.join(' ')
    }

    const permissionLevel = await PermissionHandler.calculatePermissionLevel(message.author, message.guild!)

    dlog('HANDLER', `executing: "${config.prefix}${tokens.join(' ')}"`)

    const cmd: string | undefined = tokens.shift()

    const debug = true

    if (cmd) {
        const handler: Handler = handlers[cmd]
        if (handler) {
            try {
                try {
                    const args = handler.parser.parseKnownArgs(tokens)

                    dlog('HANDLER..args', `${args}`)

                    return (await handler.execute(args[0], body, message, {
                        handlers,
                        handle,
                        permissionLevel,
                        commandLine
                    })) || undefined
                } catch (error) {
                    if (debug) {
                        console.error(error)
                    }
                    throw error
                }
            } catch (error) {
                if (error instanceof PermissionLevelException) {
                    return `> ${error.message}`
                } else if (error instanceof PrintHelpError) {
                    return reply(message.author,
                        `> Help for the command \`${error.prog}\`:\n`
                        + '```\n' + error.message + '\n```'
                    )
                } else if (error instanceof PermissionError) {
                    return reply(
                        message.author, `> ${error.message || 'Permission Error:'
                        } Required: \`${error.required}\`; Actual: \`${error.actual}\``
                    )
                } else if (error instanceof ClearTextError) {
                    return error.message
                } else if (error instanceof Error) {
                    return reply(message.author, '```\n' + error.message + '\n```')
                } else {
                    return reply(message.author, '> Unknown Error')
                }
            }
        } else {
            return `> Command not found: \`${config.prefix}${cmd}\``
        }
    } else {
        return '> No command supplied!'
    }
}

export async function handleMessage(message: Message): Promise<string | void> {

    if (!message || !message.guild || !message.channel) {
        throw new Error('Invalid message!')
    }

    const parsed = parseMessage(message)

    if (!parsed.isCommand) return

    return await handle(parsed.tokens, parsed.body, message, { commandLine: parsed.commandLine })
}