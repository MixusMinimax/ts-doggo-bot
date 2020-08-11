import argparse from 'argparse';
import ThrowingArgumentParser from '../tools/throwingArgparse';
import { Indexable, ISimpleMessage } from '../tools/types';
import { Handler } from './handler.type';

interface IndexableSubHandlers extends Indexable<Handler> {
    list: LinksListHandler
}

export class LinksHandler extends Handler {

    subHandlers: IndexableSubHandlers = {
        list: new LinksListHandler('list')
    }

    async execute(args: any, body: string, context: ISimpleMessage): Promise<void | string> {
        const tokens = (args.command && args.command.length > 0 && args.command) || ['list']
        const command = tokens[0]

        return command
    }

    get parser() {
        const _parser = new ThrowingArgumentParser({
            prog: 'links',
            description: 'Manage Links for Channel!',
            usage: [
                'links <command> [<args>]',
                '',
                '  list      List links of current channel.',
                '  add       Add links to current channel.',
                '  remove    Remove links from current channel'
            ].join('\n')
        })
        _parser.addArgument('command', {
            help: 'Subcommand to run',
            nargs: argparse.Const.REMAINDER,
            choices: Object.keys(this.subHandlers)
        })
        console.log(argparse.Const.REMAINDER)

        return _parser
    }

    formatHelp(args?: any): string {
        const subCommand = args?.command?.join(' ')
        if (subCommand) {
            const subHandler = this.subHandlers[subCommand]
            if (subHandler) {
                return subHandler.formatHelp(args)
            } else {
                return `Invalid command: ${subCommand}`
            }
        } else {
            return super.formatHelp()
        }
    }
}

class LinksListHandler extends Handler {

    async execute(args: any, body: string, context: ISimpleMessage): Promise<void> {

    }

    get parser() {
        const _parser = new ThrowingArgumentParser({
            description: 'Manage Links for Channel!'
        })

        return _parser
    }
}