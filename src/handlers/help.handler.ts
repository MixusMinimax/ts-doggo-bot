import { Const } from 'argparse'
import { Message } from 'discord.js'
import config from '../../config/config.json'
import { dlog } from '../tools/log'
import { nameDescription, reply } from '../tools/stringTools'
import ThrowingArgumentParser from '../tools/throwingArgparse'
import { Handler, HandlerContext } from './handler.type'

export class HelpHandler extends Handler {

    tab: number = 16
    description = 'Print help'

    async execute(args: { command: string }, body: string, message: Message, context: HandlerContext): Promise<string> {

        if (!context.handlers) {
            throw new Error('Handlers not initialized')
        }


        if (args.command?.startsWith(config.prefix)) {
            args.command = args.command.substring(config.prefix.length)?.replace(/^\s*/, '')
        }

        if (args.command) {
            dlog('HANDLER.help', 'command: ' + args.command)
            const result = context.handle ? await context.handle([args.command, '-h'], body, message) : null
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
            nargs: Const.OPTIONAL
        })
    }
}