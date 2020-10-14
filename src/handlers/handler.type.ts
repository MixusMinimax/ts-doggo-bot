import argparse from 'argparse'
import { Message } from 'discord.js'
import config from '../../config/config.json'
import ThrowingArgumentParser from '../tools/throwingArgparse'
import { Indexable } from '../tools/types'

export class HandlerSettings implements Indexable<any> {
    mentions?: boolean
}

export interface HandlerContext {
    handlers?: Indexable<Handler>,
    handle?: (tokens: string[], body: string, message: Message) => Promise<string | undefined>
}

export abstract class Handler {

    prog: string

    constructor(prog: string) {
        this.prog = config.prefix + prog
    }

    abstract execute(args: any, body: string, message: Message, options?: HandlerContext): Promise<void | string>

    abstract parser: ThrowingArgumentParser

    formatHelp(args?: any): string {
        return this.parser.formatHelp()
    }
}

export abstract class SubHandler extends Handler {

    constructor(parent: string, sub: string) {
        super(parent + ' ' + sub)
    }
}

export abstract class ParentHandler extends Handler {

    subHandlers: Indexable<SubHandler>
    description?: string
    usage?: string
    defaultSubCommand?: string

    constructor(
        prog: string, subHandlers: Indexable<SubHandler> = {},
        args: { description?: string, usage?: string, defaultSubCommand?: string } = {}
    ) {
        super(prog)
        this.subHandlers = subHandlers
        this.description = args.description
        this.usage = args.usage
        this.defaultSubCommand = args.defaultSubCommand
    }

    async execute(args: any, body: string, message: Message, _options: HandlerContext = {}): Promise<void | string> {
        if (!this.defaultSubCommand) {
            return `> No subcommand specified!`
        }
        const tokens: string[] = (args.command && args.command.length > 0 && args.command) || []
        const command: string = tokens?.shift() || this.defaultSubCommand
        const handler = this.subHandlers[command]

        if (handler) {
            const parsedArgs = handler.parser.parseKnownArgs(tokens)

            if (parsedArgs[0].help) {
                return `<@${message.author.id}>\n`
                    + `> Help for the command \`${this.prog} ${command}\`:\n`
                    + '```\n' + handler.formatHelp(parsedArgs[0]) + '\n```'
            } else {
                return (await handler.execute(parsedArgs[0], body, message)) || undefined
            }
        } else {
            return `> Command not found: \`${this.prog} ${command}\``
        }
    }

    get parser() {
        const _parser = new ThrowingArgumentParser({
            prog: this.prog,
            description: this.description,
            usage: this.usage
        })
        _parser.addArgument('command', {
            help: 'Subcommand to run',
            nargs: argparse.Const.REMAINDER,
            choices: Object.keys(this.subHandlers)
        })
        return _parser
    }

    formatHelp(args?: any): string {
        const subCommand = args?.command?.[0]
        if (subCommand) {
            const subHandler = this.subHandlers[subCommand]
            if (subHandler) {
                return subHandler.formatHelp(args)
            } else {
                return `Invalid command: ${subCommand}`
            }
        } else {
            return super.formatHelp()
        }
    }
}