import { HandlerContext, ParentHandler, SubHandler } from './handler.type'
import config from '../../config/config.json'
import { Message } from 'discord.js'
import ThrowingArgumentParser from '../tools/throwingArgparse'

export class SettingsHandler extends ParentHandler {
    constructor(prog: string) {
        super(prog, {
            update: new SettingsUpdateHandler(prog, 'update')
        }, {
            defaultSubCommand: 'list',
            description: 'Manage Settings for this Guild!',
            usage: [
                config.prefix + 'settings <command> [<args>]',
                '',
                '  list      List settings.',
                '  update    Update a setting.',
            ].join('\n')
        })
    }
}

export class SettingsListHandler extends SubHandler {
    async execute(
        args: { page: number, pageLength: number, searchTerm: string },
        body: string, message: Message, context: HandlerContext
    ): Promise<string> {
        return ''
    }

    get parser() {
        const _parser = new ThrowingArgumentParser(
            {
                prog: this.prog
            }
        )

        // TODO

        return _parser
    }
}

export class SettingsUpdateHandler extends ParentHandler implements SubHandler {
    constructor(prog: string, sub: string) {
        super(prog)
    }
}