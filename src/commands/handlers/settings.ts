import { Const } from 'argparse'
import { Message } from 'discord.js'
import { GuildSettingsModel } from '../../database/models/settings'
import { arrayToString, nameDescription, padStart, pager, reply } from '../../tools/string.utils'
import ThrowingArgumentParser, { NumberRange } from '../../tools/throwingArgparse'
import { HandlerContext, ParentHandler, SubHandler } from '../types'
import { assertPermission } from './permission'

const PATH_REQUIRED_LEVEL_TO_UPDATE = 'permissions.handlers.settings.update'
const DEFAULT_REQUIRED_LEVEL_TO_UPDATE = 9
const PATH_REQUIRED_LEVEL_TO_VIEW = 'permissions.handlers.settings.view'
const DEFAULT_REQUIRED_LEVEL_TO_VIEW = 5

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
        const settings = await GuildSettingsModel.findOneOrCreate(message.guild!)
        const required = settings.getSingleOption(PATH_REQUIRED_LEVEL_TO_VIEW, NumberRange(0, 10), DEFAULT_REQUIRED_LEVEL_TO_VIEW)
        assertPermission(context.permissionLevel.level, required)

        const paged = pager({
            keys: settings.getNames(),
            getter: (key: string) => settings.getOption(key, [String]) as string[],
            page,
            pageLength,
            searchTerm,
            formatter: (
                key: { key: string, similarity?: number }, value: string[]
            ) => nameDescription(key.key, arrayToString(value), {
                tab: 40,
                delim: ':',
                maxLength: 128,
                prefix: key.similarity !== undefined ? padStart(2, '0')`${Math.round(key.similarity * 100)}% ` : undefined
            })
        })

        if (!paged.lineCount) {
            if (page === 1) {
                return reply(message, '> No settings for this Guild!')
            } else {
                return reply(message, `> No settings for this Guild on page \`${page}\``)
            }
        }

        return reply(message, paged.pagedMessage)
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
        body: string, message: Message, context: HandlerContext
    ): Promise<string> {
        if (!message.guild) {
            throw new Error('No guild')
        }
        const settings = await GuildSettingsModel.findOneOrCreate(message.guild!)
        const required = settings.getSingleOption(PATH_REQUIRED_LEVEL_TO_UPDATE, NumberRange(0, 10), DEFAULT_REQUIRED_LEVEL_TO_UPDATE)
        assertPermission(context.permissionLevel.level, required)

        if (this.operation === SettingsUpdateOperation.UNSET) {
            await settings.deleteOption(key)
            return reply(message, `> Removed key \`${key}\``)
        }
        // Set
        if (this.operation === SettingsUpdateOperation.SET) {
            await settings.updateOption(key, values, { overwrite: true })
            return reply(message, `> Set \`${key}\` to \`${arrayToString(values)}\``)
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
                const result = await settings.updateOption(key, values, { insertAt: index })
                const indexText = index! >= 0 ?
                    `index \`${index}\`` :
                    'the end'
                switch (result.addedLines?.length) {
                    case 0: return reply(message, `> No values inserted!`)
                    case 1: return reply(message, `> Inserted one value to \`${key}\` at ${indexText}.`)
                    default: return reply(message, `> Inserted \`${values.length}\` values to \`${key}\` at at ${indexText}.`)
                }
        }
        // Remove
        if (this.operation === SettingsUpdateOperation.REMOVE) {
            await settings.updateOption(key, values, { remove: true })
            return reply(message, `> Removed the values \`${arrayToString(values)}\` from \`${key}\`!`)
        }

        throw new Error('Theoretically unreachable code')
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