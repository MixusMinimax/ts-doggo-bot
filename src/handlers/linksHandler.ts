import Links from '../database/models/links.model';
import { reply } from '../tools/stringTools';
import ThrowingArgumentParser from '../tools/throwingArgparse';
import { ISimpleMessage } from '../tools/types';
import { HandlerOptions, ParentHandler, SubHandler } from './handler.type';
import config from '../../config/config.json'
import { Const } from 'argparse';

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
                '  remove    Remove links from current channel'
            ].join('\n')
        })
    }
}

class LinksListHandler extends SubHandler {

    async execute(_args: any, _body: string, message: ISimpleMessage, _options: HandlerOptions = {}): Promise<string> {
        if (!message.guild) {
            throw new Error('No Guild')
        }
        const lines: string[] = (await Links.findOneOrCreate(message.guild.id, message.channel.id)).lines
        if (lines.length == 0) {
            return reply(message.author, `> No Links for channel <#${message.channel.id}>`)
        } else {
            return ([
                `\n> Links for channel <#${message.channel.id}>:`,
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

    async execute(args: any, body: string, message: ISimpleMessage, _options: HandlerOptions = {}): Promise<string> {

        if (!message.guild) {
            throw new Error('No Guild')
        }

        const lines: string[] = body.split('\n').map(line => line.trim()).filter(line => line)
        
        if (lines.length > 0) {
            const links = await Links.findOneOrCreate(message.guild.id, message.channel.id)
            await links.insertLines(lines, args.index)
            console.log(links)
            return reply(message.author, '> Links successfully updated!')
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

    async execute(args: any, body: string, message: ISimpleMessage, _options: HandlerOptions = {}): Promise<string> {

        throw new Error('Not yet implemented!')
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
