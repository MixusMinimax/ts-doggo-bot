import { Message } from 'discord.js'
import config from '../../config/config.json'
import { dlog } from '../tools/log'
import parseMessage from '../tools/messageParser'
import { reply } from '../tools/stringTools'
import { PrintHelpError } from '../tools/throwingArgparse'
import { ClearTextError, Indexable, PermissionLevelException } from '../tools/types'
import { Handler } from './handler.type'
import { HelpHandler } from './help.handler'
import { InfoHandler } from './info.handler'
import { LinksHandler } from './links.handler'
import { PermissionHandler } from './permission.handler'
import { PingHandler } from './ping.handler'
import { PurgeHandler } from './purge.handler'
import { SayHandler } from './say.handler'
import { SearchMemberHandler } from './searchMember.handler'
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
}

export async function handle(tokens: string[], body: string, message: Message): Promise<string | undefined> {

    const cmd: string | undefined = tokens.shift()

    if (cmd) {
        const handler: Handler = handlers[cmd]
        if (handler) {
            try {
                const args = handler.parser.parseKnownArgs(tokens)

                dlog('HANDLER..args', `${args}`)

                return (await handler.execute(args[0], body, message, {
                    handlers,
                    handle
                })) || undefined
            } catch (error) {
                if (error instanceof PermissionLevelException) {
                    return `> ${error.message}`
                } else if (error instanceof PrintHelpError) {
                    return reply(message.author,
                        `> Help for the command \`${config.prefix}${cmd}\`:\n`
                        + '```\n' + error.message + '\n```'
                    )
                } else if (error instanceof ClearTextError) {
                    return error.message
                } else if (error instanceof Error) {
                    return '```\n' + error.message + '\n```'
                } else {
                    return '> Unknown Error'
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

    dlog('HANDLER', `executing: "${config.prefix}${parsed.tokens.join(' ')}"`)

    return await handle(parsed.tokens, parsed.body, message)
}