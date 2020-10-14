import { HandlerContext, IntermediateHandler, ParentHandler, SubHandler } from './handler.type'
import config from '../../config/config.json'
import { Message } from 'discord.js'
import ThrowingArgumentParser from '../tools/throwingArgparse'
import { Indexable } from '../tools/types'

export class SettingsHandler extends ParentHandler {

    description = 'Manage Settings for this Guild.'
    defaultSubCommand = 'list'

    constructor(prog: string) {
        super(prog)
        this.subHandlers = {
            update: new SettingsUpdateHandler(prog, 'update')
        }
    }
}

export class SettingsListHandler extends SubHandler {

    description = 'List settings.'

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

export class SettingsUpdateHandler extends IntermediateHandler {

    description = 'Update a setting.'
    subHandlers: Indexable<SubHandler>

    constructor(parent: string, sub: string) {
        super(parent, sub)
        this.subHandlers = {

        }
    }
}

// TODO: update set, update insert, update prepend, update append, update remove, update unset