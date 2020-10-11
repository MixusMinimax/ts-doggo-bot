import { Const } from 'argparse'
import { Message } from 'discord.js'
import config from '../../config/config.json'
import { LinkLists } from '../database/models/links'
import { dlog } from '../tools/log'
import { parseList, reply, singularPlural } from '../tools/stringTools'
import ThrowingArgumentParser from '../tools/throwingArgparse'
import { HandlerContext, ParentHandler, SubHandler } from './handler.type'

export class LinksHandler extends ParentHandler {

    constructor(prog: string) {
        super(prog, {
            list: new LinksListHandler(prog, 'list'),
            add: new LinksAddHandler(prog, 'add'),
            remove: new LinksRemoveHandler(prog, 'remove')
        }, {
            defaultSubCommand: 'list',
            description: 'Manage Links for the current Channel!',
            usage: [
                config.prefix + 'links <command> [<args>]',
                '',
                '  list      List links of current channel.',
                '  add       Add links to current channel.',
                '  remove    Remove links from current channel.'
            ].join('\n')
        })
    }
}

class LinksListHandler extends SubHandler {

    async execute(_args: any, _body: string, message: Message, _options: HandlerContext = {}): Promise<string> {
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

    get parser() {
        const _parser = new ThrowingArgumentParser({
            prog: this.prog,
            description: 'List all Links for the current Channel!'
        })

        return _parser
    }
}

class LinksAddHandler extends SubHandler {

    async execute(args: any, body: string, message: Message, _options: HandlerContext = {}): Promise<string> {

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

    get parser() {
        const _parser = new ThrowingArgumentParser({
            prog: this.prog,
            description: 'Add Links to the current Channel!'
        })
        _parser.addArgument('index', {
            nargs: Const.OPTIONAL,
            defaultValue: -1,
            type: 'int'
        })

        return _parser
    }
}

class LinksRemoveHandler extends SubHandler {

    async execute(args: any, body: string, message: Message, _options: HandlerContext = {}): Promise<string> {

        if (!message.guild) {
            throw new Error('No Guild')
        }

        const indicesString = args.indices.join(' ')
        const indices = parseList(x => +x, indicesString)
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

    get parser() {
        const _parser = new ThrowingArgumentParser({
            prog: this.prog,
            description: 'Remove Links from the current Channel!'
        })
        _parser.addArgument('indices', {
            nargs: Const.REMAINDER,
            defaultValue: [],
        })

        return _parser
    }
}
