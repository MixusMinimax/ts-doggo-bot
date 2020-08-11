import { ArgumentParser, ArgumentParserOptions } from 'argparse';

export class ArgumentParseError extends Error { }

export default class ThrowingArgumentParser extends ArgumentParser {

    constructor(args: ArgumentParserOptions = { }) {
        const addHelp = args.addHelp === undefined || args.addHelp
        console.log(args)
        args.addHelp = false
        super(args)
        if (addHelp) {
            this.addArgument(['-h', '--help'], {
                action: 'storeTrue',
                dest: 'help',
                help: 'Print help and exit'
            })
        }
    }

    error(message: string) {
        throw new ArgumentParseError(message)
    }
}