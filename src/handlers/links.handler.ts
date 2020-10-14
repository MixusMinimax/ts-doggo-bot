import { Const } from 'argparse'
import { Message } from 'discord.js'
import { LinkLists } from '../database/models/links'
import { dlog } from '../tools/log'
import { reply, singularPlural } from '../tools/string.utils'
import ThrowingArgumentParser, { NumberRange } from '../tools/throwingArgparse'
import { HandlerContext, ParentHandler, SubHandler } from './handler.type'

export class LinksHandler extends ParentHandler {

    description = 'Manage Links for the current Channel!'
    defaultSubCommand = 'list'

    constructor(prog: string) {
        super(prog)
        this.subHandlers = {
            list: new LinksListHandler(prog, 'list'),
            add: new LinksAddHandler(prog, 'add'),
            remove: new LinksRemoveHandler(prog, 'remove')
        }
    }
}

class LinksListHandler extends SubHandler {

    description = 'List all Links for the current Channel.'

    async execute(_args: any, _body: string, message: Message, _context: HandlerContext = {}): Promise<string> {
        if (!message.guild) {
            throw new Error('No Guild')
        }
        const lines: string[] = (await LinkLists.findOneOrCreate(message.guild.id, message.channel.id)).lines
        dlog('HANDLER.links.list', `${lines.length} Lines for channel ${message.channel.toString()}`)
        if (lines.length === 0) {
            return reply(message.author, `> No Links for channel <#${message.channel.id}>`)
        } else {
            return reply(message.author, [
                `> Links for channel <#${message.channel.id}>:`,
                lines.map((line, index) => `\`[${index.toString().padStart(2, '0')}]\` ${line}`).join('\n')
            ].join('\n'))
        }
    }
}

class LinksAddHandler extends SubHandler {

    description = 'Add Links to the current Channel.'

    async execute(args: any, body: string, message: Message, _context: HandlerContext = {}): Promise<string> {

        if (!message.guild) {
            throw new Error('No Guild')
        }

        const lines: string[] = body.split('\n').map(line => line.trim()).filter(line => line)

        const links = await LinkLists.findOneOrCreate(message.guild.id, message.channel.id)
        const result = await links.insertLines(lines, args.index)
        dlog('HANDLER.links.add', `Added ${result.addedLines}`)

        if (result?.addedLines?.length) {
            return reply(message.author, `> Successfully added ${result.addedLines.length} ${singularPlural(result.addedLines.length, 'link')}!`)
        } else {
            return reply(message.author, '> No links supplied!')
        }
    }

    defineArguments(_parser: ThrowingArgumentParser) {
        _parser.addArgument('index', {
            nargs: Const.OPTIONAL,
            defaultValue: -1,
            type: 'int'
        })
    }
}

class LinksRemoveHandler extends SubHandler {

    description = 'Remove Links from the current Channel.'

    async execute(args: { indices: number[] }, body: string, message: Message, _context: HandlerContext = {}): Promise<string> {

        if (!message.guild) {
            throw new Error('No Guild')
        }

        const indices = args.indices
        dlog('HANDLER.links.remove', `Indices: ${indices}`)

        const links = await LinkLists.findOneOrCreate(message.guild.id, message.channel.id)
        const result = await links.removeLines(indices)

        const n = result.removedIndices?.length || 0
        if (result.removedIndices?.length) {
            return reply(message.author, `> Successfully removed ${singularPlural(n, 'link')} at ${singularPlural(n, 'index', 'indices')} \`${result.removedIndices.join(', ')}\``)
        } else {
            return reply(message.author, '> No valid indices supplied!')
        }
    }

    defineArguments(_parser: ThrowingArgumentParser) {
        _parser.addArgument('indices', {
            nargs: Const.REMAINDER,
            defaultValue: [],
            type: NumberRange()
        })
    }
}
