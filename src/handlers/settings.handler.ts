import { HandlerContext, IntermediateHandler, ParentHandler, SubHandler } from './handler.type'
import config from '../../config/config.json'
import { Message } from 'discord.js'
import ThrowingArgumentParser, { NumberRange } from '../tools/throwingArgparse'
import { Indexable } from '../tools/types'
import { GuildSettingsModel } from '../database/models/settings'
import { nameDescription, padStart, parseList, reply } from '../tools/stringTools'
import { Const } from 'argparse'
import { findBestMatch } from 'string-similarity'

export class SettingsHandler extends ParentHandler {

    description = 'Manage Settings for this Guild.'
    defaultSubCommand = 'list'

    constructor(prog: string) {
        super(prog)
        this.subHandlers = {
            list: new SettingsListHandler(prog, 'list')
        }
        for (const operation of Object.values(SettingsUpdateOperation)) {
            this.subHandlers[operation] = new SettingsUpdateOperationHandler(this.prog, operation)
        }
    }
}

class SettingsListHandler extends SubHandler {

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
        let keysOnPage: string[] | { key: string, similarity?: number }[] = settings.getNames()
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
            }/${allLength}\`\n\`\`\`${keysOnPage.map(key => {
                const val = settings.getOption(key.key)
                    .map(e => (typeof e === 'string') ? `"${e}"` : `${e}`)
                const valstr = val.length > 1 ?
                    `[${val.join(', ')}]` :
                    `${val[0]}`
                return nameDescription(key.key, valstr, {
                    tab: 32,
                    delim: ':',
                    maxLength: 96,
                    prefix: key.similarity !== undefined ? padStart(2, '0')`${Math.round(key.similarity * 100)}% ` : undefined
                })
            }
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

enum SettingsUpdateOperation {
    SET = 'set',
    INSERT = 'insert',
    PREPEND = 'prepend',
    APPEND = 'append',
    REMOVE = 'remove',
    UNSET = 'unset'
}

class SettingsUpdateOperationHandler extends SubHandler {

    static descriptions: {
        [key in SettingsUpdateOperation]: string
    } = {
            [SettingsUpdateOperation.SET]: 'Set the value or values.',
            [SettingsUpdateOperation.INSERT]: 'Insert values at specified index',
            [SettingsUpdateOperation.PREPEND]: 'Insert at beginning.',
            [SettingsUpdateOperation.APPEND]: 'Insert at end.',
            [SettingsUpdateOperation.REMOVE]: 'Remove specified values.',
            [SettingsUpdateOperation.UNSET]: 'Remove the key entirely.'
        }

    operation: SettingsUpdateOperation
    description: string

    constructor(parent: string, operation: SettingsUpdateOperation) {
        super(parent, operation)
        this.operation = operation
        this.description = SettingsUpdateOperationHandler.descriptions[operation]
    }

    async execute(
        { key, index, values = [] }: { key: string, index?: number, values?: string[] },
        body: string, message: Message, _context: HandlerContext = {}
    ): Promise<string> {
        if (!message.guild) {
            throw new Error('No guild')
        }
        const settings = await GuildSettingsModel.findOneOrCreate(message.guild)
        if (this.operation === SettingsUpdateOperation.UNSET) {
            await settings.deleteOption(key)
            return reply(message.author, `> Removed key \`${key}\``)
        }
        // Parse values
        const valuesArray = parseList(x => x, values.join(' '))
        // Set
        if (this.operation === SettingsUpdateOperation.SET) {
            await settings.setOption(key, valuesArray, { overwrite: true })
            return 'set'
        }

        // Insert
        switch (this.operation) {
            case SettingsUpdateOperation.PREPEND:
                index = 0
                break
            case SettingsUpdateOperation.APPEND:
                index = -1
        }
        switch (this.operation) {
            case SettingsUpdateOperation.INSERT:
            case SettingsUpdateOperation.PREPEND:
            case SettingsUpdateOperation.APPEND:
                await settings.setOption(key, valuesArray, { insertAt: index })
                return 'insert'
        }
        // Remove
        if (this.operation === SettingsUpdateOperation.REMOVE) {
            await settings.setOption(key, [], { removeValues: valuesArray })
            return 'remove'
        }
        return 'Not implemented'
    }

    defineArguments(_parser: ThrowingArgumentParser) {
        _parser.addArgument('key', {
            help: 'Which option to update.'
        })
        switch (this.operation) {
            case SettingsUpdateOperation.INSERT:
                _parser.addArgument('index', {
                    type: NumberRange(),
                    help: 'Where to insert the value or values'
                })
            // Fall through to values
            case SettingsUpdateOperation.SET:
            case SettingsUpdateOperation.PREPEND:
            case SettingsUpdateOperation.APPEND:
            case SettingsUpdateOperation.REMOVE:
                _parser.addArgument('values', {
                    nargs: Const.REMAINDER,
                    help: 'Value, or values'
                })
        }
    }
}

// TODO: update set, update insert, update prepend, update append, update remove, update unset