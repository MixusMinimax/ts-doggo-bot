import { ArgumentParser, ArgumentParserOptions } from 'argparse'
import { dlog } from './log'

export class ArgumentParseError extends Error { }

export default class ThrowingArgumentParser extends ArgumentParser {

    description?: string

    constructor(args: ArgumentParserOptions = {}) {
        const addHelp = args.addHelp === undefined || args.addHelp
        dlog('ARGPARSE', args)
        args.addHelp = false
        super(args)
        this.description = args.description
        if (addHelp) {
            this.addArgument(['-h', '--help'], {
                action: 'storeTrue',
                dest: 'help',
                help: 'Print help (doesn\'t execute command)'
            })
        }
    }

    error(message: string) {
        throw new ArgumentParseError(message)
    }
}