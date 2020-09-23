import argparse from 'argparse'
import config from '../../config/config.json'
import { dlog } from '../tools/log'
import { nameDescription, reply } from '../tools/stringTools'
import ThrowingArgumentParser from '../tools/throwingArgparse'
import { ISimpleMessage } from '../tools/types'
import { Handler, HandlerOptions } from './handler.type'

export class HelpHandler extends Handler {

    tab: number = 16

    async execute(args: any, body: string, message: ISimpleMessage, options: HandlerOptions): Promise<string> {

        if (!options.handlers) {
            throw new Error('Handlers not initialized')
        }

        let command: string | undefined = args.command?.shift()
        if (command?.startsWith(config.prefix)) {
            command = command?.substring(config.prefix.length)?.replace(/^\s*/, '')
        }

        if (command) {
            dlog('HANDLER.help', 'command: ' + command)
            const result = await options.handle?.call(null, [command, '-h'].concat(args.command || []), body, message)
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

    get parser() {
        const _parser = new ThrowingArgumentParser({
            prog: this.prog,
            description: 'Print help'
        })
        _parser.addArgument('command', {
            help: 'The command you need help on!',
            nargs: argparse.Const.REMAINDER
        })

        return _parser
    }
}