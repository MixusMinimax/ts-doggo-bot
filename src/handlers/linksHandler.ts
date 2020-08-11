import Links from '../database/models/links.model';
import { reply } from '../tools/stringTools';
import ThrowingArgumentParser from '../tools/throwingArgparse';
import { ISimpleMessage } from '../tools/types';
import { HandlerOptions, ParentHandler, SubHandler } from './handler.type';
import config from '../../config/config.json'

export class LinksHandler extends ParentHandler {

    constructor(prog: string) {
        super(prog, {
            list: new LinksListHandler(prog, 'list')
        }, {
            defaultSubCommand: 'list',
            description: 'Manage Links for Channel!',
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
            return reply(message.author, `\n> No Links for channel <#${message.channel.id}>`)
        } else {
            return ([
                `\n> Links for channel <#${message.channel.id}>:`,
                lines.map((line, index) => `\`[${index.toString().padStart(2, '0')}]\` ${line}`).join('\n')
            ].join('\n'))
        }
    }

    get parser() {
        const _parser = new ThrowingArgumentParser({
            prog: this.prog + ' ' + this.sub,
            description: 'Manage Links for Channel!'
        })

        return _parser
    }
}
