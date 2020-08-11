import { Message } from 'discord.js';
import config from '../../config/config.json';
import parseMessage from '../tools/messageParser';
import { Indexable, PermissionLevelException } from '../tools/types';
import { Handler } from './handler.type';
import { LinksHandler } from './linksHandler';

interface IndexableHandlers extends Indexable<Handler> {
    links: LinksHandler
}

export var handlers: IndexableHandlers = {
    links: new LinksHandler('links')
}

export const handle = async function (message: Message): Promise<string | undefined> {
    if (!message || !message.guild || !message.channel) {
        throw new Error('Invalid message!')
    }

    const parsed = parseMessage(message)

    if (!parsed.isCommand) return

    const cmd: string | undefined = parsed.tokens.shift()

    if (cmd) {
        const handler: Handler = handlers[cmd]
        if (handler) {
            try {
                const args = handler.parser.parseKnownArgs(parsed.tokens)

                console.log(args)

                if (args[0].help) {
                    return `<@${message.author.id}>\n`
                        + `> Help for the command \`${config.prefix}${cmd}\`:\n`
                        + '```\n' + handler.formatHelp(args[0]) + '\n```'
                } else {
                    return (await handler.execute(args[0], parsed.body, message)) || undefined
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
            return `> Command not found: ${cmd}`
        }
    } else {
        return '> No command supplied!'
    }
}