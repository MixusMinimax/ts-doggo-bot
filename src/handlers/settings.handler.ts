import { HandlerContext, IntermediateHandler, ParentHandler, SubHandler } from './handler.type'
import config from '../../config/config.json'
import { Message } from 'discord.js'
import ThrowingArgumentParser, { NumberRange } from '../tools/throwingArgparse'
import { Indexable } from '../tools/types'
import { GuildSettingsModel } from '../database/models/settings'
import { nameDescription, reply } from '../tools/stringTools'

export class SettingsHandler extends ParentHandler {

    description = 'Manage Settings for this Guild.'
    defaultSubCommand = 'list'

    constructor(prog: string) {
        super(prog)
        this.subHandlers = {
            list: new SettingsListHandler(prog, 'list'),
            update: new SettingsUpdateHandler(prog, 'update')
        }
    }
}

export class SettingsListHandler extends SubHandler {

    description = 'List settings.'

    async execute(
        { page, pageLength, searchTerm }: { page: number, pageLength: number, searchTerm: string },
        body: string, message: Message, context: HandlerContext
    ): Promise<string> {
        if (!message.guild) {
            throw new Error('No guild')
        }
        const settings = await GuildSettingsModel.findOneOrCreate(message.guild)
        const keysOnPage = [...settings.settings.keys()].slice(page * pageLength, (page + 1) * pageLength)
        if (!keysOnPage.length) {
            if (!page) {
                return reply(message.author, '> No settings for this Guild!')
            } else {
                return reply(message.author, `> No settings for this Guild on page \`${page}\``)
            }
        }
        return reply(
            message.author,
            `\`\`\`${keysOnPage.map(key =>
                nameDescription(key, `[${[...settings.settings.get(key)?.values() || []]
                    .map(e => (typeof e === 'string') ? `"${e}"` : `${e}`)
                    .join(', ')}]`, {
                    tab: 32,
                    delim: ':',
                    maxLength: 96,
                })
            ).join('\n')
            }\`\`\``
        )
    }

    defineArguments(_parser: ThrowingArgumentParser) {
        _parser.addArgument(['-p', '--page'], {
            defaultValue: 0,
            type: NumberRange(0),
            help: 'What page of settings to show.'
        })
        _parser.addArgument(['-l', '--length'], {
            defaultValue: 16,
            type: NumberRange(1, 64),
            dest: 'pageLength',
            help: 'How many settings per page to show.'
        })
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