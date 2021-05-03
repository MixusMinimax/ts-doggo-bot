import { Const } from 'argparse'
import { Message } from 'discord.js'
import config from '../../../config/config.json'
import { dlog } from '../../tools/log'
import { nameDescription, reply } from '../../tools/string.utils'
import { NumberRange, ThrowingArgumentParser } from '../../tools/throwingArgparse'
import { Handler, HandlerContext } from '../types'

export class HelpHandler extends Handler {

    tab: number = 16
    description = 'Print help'

    async execute(args: { command: string[] }, body: string, message: Message, context: HandlerContext): Promise<string> {

        if (!context.handlers) {
            throw new Error('Handlers not initialized')
        }

        let command = args.command.shift()

        if (command?.startsWith(config.prefix)) {
            command = command.substring(config.prefix.length)?.replace(/^\s*/, '')
        }

        if (command) {
            dlog('HANDLER.help', 'command: ' + args.command)
            const result = context.handle ? await context.handle([command, '-h', ...args.command], body, message) : null
            if (result) {
                return result
            } else {
                throw new Error('No handle method supplied')
            }
        } else {
            return reply(
                message,
                '```yml\n' +
                'Avaiable commands:\n' +
                Object.keys(context.handlers)
                    .map(key => nameDescription(key, context.handlers?.[key].parser.description || '---', {
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
            nargs: Const.ZERO_OR_MORE
        })
    }
}