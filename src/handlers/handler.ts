import { Message } from 'discord.js';
import config from '../../config/config.json';
import { dlog } from '../tools/log';
import parseMessage from '../tools/messageParser';
import { Indexable, ISimpleMessage, PermissionLevelException } from '../tools/types';
import { Handler } from './handler.type';
import { HelpHandler } from './helpHandler';
import { LinksHandler } from './linksHandler';

interface IndexableHandlers extends Indexable<Handler> {
    links: LinksHandler
}

export const handlers: IndexableHandlers = {
    help: new HelpHandler('help'),
    links: new LinksHandler('links')
}

export const handle = async function (tokens: string[], body: string, message: ISimpleMessage): Promise<string | undefined> {
    const cmd: string | undefined = tokens.shift()

    if (cmd) {
        const handler: Handler = handlers[cmd]
        if (handler) {
            try {
                const args = handler.parser.parseKnownArgs(tokens)

                dlog('HANDLER..args', args)

                if (args[0].help && args[0].command?.[0]) {
                    args[0].help = false
                    args[0].command.splice(1, 0, '-h')
                }

                if (args[0].help) {
                    return `<@${message.author.id}>\n`
                        + `> Help for the command \`${config.prefix}${cmd}\`:\n`
                        + '```\n' + handler.formatHelp(args[0]) + '\n```'
                } else {
                    return (await handler.execute(args[0], body, message, {
                        handlers,
                        handle
                    })) || undefined
                }

            } catch (error) {
                if (error instanceof PermissionLevelException) {
                    return `> ${error.message}`
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

export const handleMessage = async function (message: Message): Promise<string | undefined> {
    if (!message || !message.guild || !message.channel) {
        throw new Error('Invalid message!')
    }

    const parsed = parseMessage(message)

    if (!parsed.isCommand) return

    dlog('HANDLER', `executing: "${config.prefix}${parsed.tokens.join(' ')}"`)

    return await handle(parsed.tokens, parsed.body, message)
}