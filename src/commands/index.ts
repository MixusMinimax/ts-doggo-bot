import { Message } from 'discord.js'
import config from '../../config/config.json'
import { dlog } from '../tools/log'
import parseMessage from '../tools/messageParser'
import { reply } from '../tools/string.utils'
import { PrintHelpException } from '../tools/throwingArgparse'
import { ClearTextError, CommandNotFoundError, Indexable } from '../tools/types'
import { AliasHandler } from './handlers/alias'
import { EchoHandler } from './handlers/echo'
import { HelpHandler } from './handlers/help'
import { InfoHandler } from './handlers/info'
import { LinksHandler } from './handlers/links'
import { PermissionError, PermissionHandler } from './handlers/permission'
import { PingHandler } from './handlers/ping'
import { PurgeHandler } from './handlers/purge'
import { SayHandler } from './handlers/say'
import { SearchMemberHandler } from './handlers/searchMember'
import { maybeHandleMessage, SessionsHandler } from './handlers/sessions'
import { SettingsHandler } from './handlers/settings'
import { TimeHandler } from './handlers/time'
import { Handler } from './types'
import * as nonCommands from '../non-commands'
import { EvalHandler } from './handlers/eval'

export const handlers = {
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
    alias: new AliasHandler('alias'),
    sessions: new SessionsHandler('sessions'),

    // eval: new EvalHandler('eval'),

    echo: new EchoHandler('echo'),
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
    {
        const { replaced, bypassed } = { tokens } = await AliasHandler.apply(tokens, message.guild!)
        if (replaced || bypassed) {
            dlog('HANDLER', `replaced with: "${config.prefix}${tokens.join(' ')}"`)
        }
    }

    const cmd: string | undefined = tokens.shift()

    const debug = true

    if (cmd) {
        try {
            const handler: Handler = (handlers as Indexable<Handler>)[cmd]
            if (handler) {
                try {
                    try {
                        const args = handler.parser.parseKnownArgs(tokens)

                        dlog('HANDLER..args', '', args)

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
                    if (error instanceof CommandNotFoundError) {
                        throw error
                    } else if (error instanceof PrintHelpException) {
                        return reply(message,
                            `> Help for the command \`${config.prefix}${handler.prog}\`:\n`
                            + '```yml\n' + error.handler.formatHelp({ command: error.words }) + '\n```'
                        )
                    } else if (error instanceof PermissionError) {
                        return reply(
                            message, `> ${error.message || 'Permission Error:'
                            } Required: \`${error.required}\`; Actual: \`${error.actual}\``
                        )
                    } else if (error instanceof ClearTextError) {
                        return error.message
                    } else if (error instanceof Error) {
                        return reply(message, '```\n' + error.message + '\n```')
                    } else {
                        return reply(message, '> Unknown Error')
                    }
                }
            } else {
                throw new CommandNotFoundError(`${config.prefix}${cmd}`)
            }
        } catch (error) {
            if (error instanceof CommandNotFoundError) {
                return reply(message, `> Command not found: \`${error.message}\``)
            }
        }
    } else {
        return reply(message, '> No command supplied!')
    }
}

export async function handleMessage(message: Message): Promise<string | void> {

    if (!message || !message.guild || !message.channel) {
        throw new Error('Invalid message!')
    }

    const parsed = parseMessage(message)

    if (!parsed.isCommand) {
        const didExecute = await maybeHandleMessage(message)
        if (!didExecute) {
            await nonCommands.handleMessage(message)
        }
        return
    }

    return await handle(parsed.tokens, parsed.body, message, { commandLine: parsed.commandLine })
}