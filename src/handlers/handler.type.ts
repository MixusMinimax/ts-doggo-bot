import argparse from 'argparse'
import { Message } from 'discord.js'
import config from '../../config/config.json'
import { nameDescription } from '../tools/string.utils'
import ThrowingArgumentParser from '../tools/throwingArgparse'
import { CommandNotFoundError, Indexable } from '../tools/types'

export class HandlerSettings implements Indexable<any> {
    mentions?: boolean
}

export interface HandlerContext {
    handlers: Indexable<Handler>,
    handle: (tokens: string[], body: string, message: Message) => Promise<string | undefined>,
    permissionLevel: { level: number, reason: string },
    commandLine: string
}

export abstract class Handler {

    prog: string
    abstract description: string

    constructor(prog: string) {
        this.prog = config.prefix + prog
    }

    abstract execute(args: any, body: string, message: Message, context: HandlerContext): Promise<void | string>

    defineArguments(_parser: ThrowingArgumentParser): void { }

    get parser() {
        const _parser = new ThrowingArgumentParser({
            prog: this.prog,
            description: this.description,
        })
        this.defineArguments(_parser)
        return _parser
    }

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

    subHandlers: Indexable<SubHandler> = {}
    defaultSubCommand?: string

    async execute(args: any, body: string, message: Message, context: HandlerContext): Promise<void | string> {
        const tokens: string[] = (args.command && args.command.length > 0 && args.command) || []
        const command: string | undefined = tokens?.shift() || this.defaultSubCommand
        if (command === undefined) {
            return `> No subcommand specified!`
        }
        const handler = this.subHandlers[command]

        if (handler) {
            const parsedArgs = handler.parser.parseKnownArgs(tokens)
            return (await handler.execute(parsedArgs[0], body, message, context)) || undefined
        } else {
            throw new CommandNotFoundError(`${this.prog} ${command}`)
        }
    }

    get parser() {
        const _parser = new ThrowingArgumentParser({
            prog: this.prog,
            description: this.description,
            usage: [
                `${this.prog} <command> [<args>]`,
                '',
                ...Object.entries(this.subHandlers).map(([name, { description }]) => {
                    return nameDescription(name, description, {
                        tab: 14,
                        prefix: '  ',
                    })
                })
            ].join('\n')
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

export abstract class IntermediateHandler extends ParentHandler implements SubHandler {
    constructor(parent: string, sub: string) {
        super(parent + ' ' + sub)
        this.prog = this.prog.replace(config.prefix, '')
    }
}