import { Const } from 'argparse'
import { Guild, Message } from 'discord.js'
import { GuildSettingsModel } from '../../database/models/settings'
import { arrayToString, nameDescription, pager, reply } from '../../tools/string.utils'
import ThrowingArgumentParser, { ArgumentParseError, NumberRange } from '../../tools/throwingArgparse'
import { Handler, HandlerContext } from '../handler.type'

const ALIAS_BYPASS = 'command'
const ALIAS_BLACKLIST = ['alias', ALIAS_BYPASS]
const ALIAS_PREFIX = 'aliases'

export class AliasHandler extends Handler {

    description = 'View and manage aliases.'

    async execute(
        {
            name: aliasName = '', value, page, pageLength, remove
        }: {
            name?: string, value: string[], page: number, pageLength: number, remove: boolean
        },
        body: string, message: Message, _context: HandlerContext
    ): Promise<string> {
        const settings = await GuildSettingsModel.findOneOrCreate(message.guild!)
        if (remove) {
            const key = `${ALIAS_PREFIX}.${aliasName}`
            if (!settings.getNames().includes(key)) {
                return reply(message, `> Alias does not exist: \`${aliasName}\``)
            }
            await settings.deleteOption(key)
            return reply(message, `> Alias deleted: \`${aliasName}\``)
        }
        if (value.length) {
            const key = `${ALIAS_PREFIX}.${aliasName}`
            await settings.updateOption(key, value, {
                overwrite: true,
            })
            return reply(message, `> Set alias \`${aliasName}\` to \`${arrayToString(value)}\``)
        } else {
            const paged = pager({
                keys: settings.getNames().filter(e => e.startsWith(`${ALIAS_PREFIX}.`)),
                getter: (key: string) => settings.getOption(key, [String]) as string[],
                page,
                pageLength,
                searchTerm: [`${ALIAS_PREFIX}.${aliasName}`],
                formatter: (
                    key: { key: string, similarity?: number }, _value: string[]
                ) => nameDescription(key.key.substring(ALIAS_PREFIX.length + 1), `"${_value.join(' ')}"`, {
                    tab: 40,
                    delim: ':',
                    maxLength: 128,
                })
            })
            if (!paged.lineCount) {
                if (page === 1) {
                    return reply(message, '> No aliases for this Guild!')
                } else {
                    return reply(message, `> No aliases for this Guild on page \`${page}\``)
                }
            }
            return reply(message, paged.pagedMessage)
        }
    }

    defineArguments(_parser: ThrowingArgumentParser) {
        _parser.addArgument(['-r', '--remove'], {
            action: 'storeTrue',
            help: 'Remove the alias'
        })
        _parser.addArgument(['-p', '--page'], {
            defaultValue: 1,
            type: NumberRange(1),
            help: 'What page of aliases to show.'
        })
        _parser.addArgument(['-l', '--length'], {
            defaultValue: 16,
            type: NumberRange(1, 64),
            dest: 'pageLength',
            help: 'How many aliases per page to show.'
        })
        _parser.addArgument('name', {
            nargs: Const.OPTIONAL,
            help: 'The name of the alias.',
            type: function alias(s: string): string {
                if (ALIAS_BLACKLIST.includes(s)) {
                    throw new ArgumentParseError('Not allowed!')
                }
                return s
            }
        })
        _parser.addArgument('value', {
            nargs: Const.REMAINDER,
            help: 'What to execute instead.'
        })
    }

    static async apply(tokens: string[], guild: Guild): Promise<{ tokens: string[], bypassed: boolean, replaced: boolean }> {
        if (tokens.length) {
            if (tokens[0] === ALIAS_BYPASS) {
                return {
                    tokens: tokens.slice(1),
                    bypassed: true,
                    replaced: false
                }
            } else {
                const settings = await GuildSettingsModel.findOneOrCreate(guild)
                const key = `${ALIAS_PREFIX}.${tokens[0]}`
                if (settings.getNames().includes(key)) {
                    const replacement = settings.getOption(key, [String]) as string[]
                    return {
                        tokens: [...replacement, ...tokens.slice(1)],
                        bypassed: false,
                        replaced: true
                    }
                }
            }
        }
        return {
            tokens,
            bypassed: false,
            replaced: false
        }
    }
}