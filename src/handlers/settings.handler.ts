import { HandlerContext, IntermediateHandler, ParentHandler, SubHandler } from './handler.type'
import config from '../../config/config.json'
import { Message } from 'discord.js'
import ThrowingArgumentParser, { NumberRange } from '../tools/throwingArgparse'
import { Indexable } from '../tools/types'
import { GuildSettingsModel } from '../database/models/settings'
import { nameDescription, padStart, reply } from '../tools/stringTools'
import { Const } from 'argparse'
import { findBestMatch } from 'string-similarity'

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
        { page, pageLength, searchTerm }: { page: number, pageLength: number, searchTerm: string[] },
        body: string, message: Message, context: HandlerContext
    ): Promise<string> {
        if (!message.guild) {
            throw new Error('No guild')
        }
        page--
        const settings = await GuildSettingsModel.findOneOrCreate(message.guild)
        let keysOnPage: string[] | { key: string, similarity?: number }[] = [...settings.settings.keys()]
        const allLength = keysOnPage.length

        // Sort keys by similarity with searchTerm
        if (searchTerm.length) {
            const result = findBestMatch(searchTerm.join(' '), keysOnPage)
            keysOnPage = result.ratings
                .map(r => ({ key: r.target, similarity: r.rating }))
                .sort((a, b) => b.similarity - a.similarity)
                .slice(page * pageLength, (page + 1) * pageLength)
        } else {
            keysOnPage = keysOnPage
                .slice(page * pageLength, (page + 1) * pageLength)
                .map(key => ({ key }))
        }
        if (!keysOnPage.length) {
            if (!page) {
                return reply(message.author, '> No settings for this Guild!')
            } else {
                return reply(message.author, `> No settings for this Guild on page \`${page}\``)
            }
        }
        return reply(
            message.author,
            `> Page \`${page + 1
            }/${Math.ceil(allLength / pageLength)
            }\`, Results \`${page * pageLength + 1
            }-${page * pageLength + keysOnPage.length
            }/${allLength}\`\n\`\`\`${keysOnPage.map(key =>
                nameDescription(key.key, `[${[...settings.settings.get(key.key)?.values() || []]
                    .map(e => (typeof e === 'string') ? `"${e}"` : `${e}`)
                    .join(', ')}]`, {
                    tab: 32,
                    delim: ':',
                    maxLength: 96,
                    prefix: key.similarity !== undefined ? padStart(2, '0')`${Math.round(key.similarity * 100)}% ` : undefined
                })
            ).join('\n')
            }\`\`\``
        )
    }

    defineArguments(_parser: ThrowingArgumentParser) {
        _parser.addArgument(['-p', '--page'], {
            defaultValue: 1,
            type: NumberRange(1),
            help: 'What page of settings to show.'
        })
        _parser.addArgument(['-l', '--length'], {
            defaultValue: 16,
            type: NumberRange(1, 64),
            dest: 'pageLength',
            help: 'How many settings per page to show.'
        })
        _parser.addArgument('searchTerm', {
            nargs: Const.REMAINDER,
            help: 'Search for key names'
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