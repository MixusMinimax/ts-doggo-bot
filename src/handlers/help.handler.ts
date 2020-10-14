import argparse from 'argparse'
import { Message } from 'discord.js'
import config from '../../config/config.json'
import { dlog } from '../tools/log'
import { nameDescription, reply } from '../tools/stringTools'
import ThrowingArgumentParser from '../tools/throwingArgparse'
import { Handler, HandlerContext } from './handler.type'

export class HelpHandler extends Handler {

    tab: number = 16
    description = 'Print help'

    async execute(args: { command: string[] }, body: string, message: Message, options: HandlerContext): Promise<string> {
        
        if (!options.handlers) {
            throw new Error('Handlers not initialized')
        }

        const command: string[] = []
        for (const token of args.command) {
            if (token.startsWith('-')) break
            command.push(token)
        }

        if (command.length && command[0].startsWith(config.prefix)) {
            command[0] = command[0].substring(config.prefix.length)?.replace(/^\s*/, '')
        }

        if (command.length) {
            dlog('HANDLER.help', 'command: ' + command.join(' '))
            const result = options.handle ? await options.handle([...command, '-h'], body, message) : null
            if (result) {
                return result
            } else {
                throw new Error('No handle method supplied')
            }
        } else {
            return reply(
                message.author,
                '```\n' +
                'Avaiable commands:\n' +
                Object.keys(options.handlers)
                    .map(key => nameDescription(key, options.handlers?.[key].parser.description || '---', {
                        tab: this.tab,
                        prefix: '  ' + config.prefix
                    }))
                    .join('\n') +
                '\n```'
            )
        }
    }

    defineArguments(_parser: ThrowingArgumentParser) {
        _parser.addArgument('command', {
            help: 'The command you need help on!',
            nargs: argparse.Const.REMAINDER
        })
    }
}