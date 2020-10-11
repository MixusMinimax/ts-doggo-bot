import { ArgumentParser, ArgumentParserOptions } from 'argparse'
import { dlog } from './log'
import { padStart } from './stringTools'

export class ArgumentParseError extends Error { }

export class PrintHelpError extends Error { }

export default class ThrowingArgumentParser extends ArgumentParser {

    description?: string

    constructor(args: ArgumentParserOptions = {}) {
        dlog('ARGPARSE', args)
        super(args)
        this.description = args.description
    }

    error(err: string | Error) {
        if (err instanceof Error) {
            throw err
        } else {
            throw new ArgumentParseError(err)
        }
    }

    printHelp() {
        throw new PrintHelpError(this.formatHelp())
    }
}

export function NumberRange(min?: number, max?: number, allowNaN: boolean = false): (x: string) => number | never {
    return function Number(_x) {
        const x = +_x
        if (isNaN(x) && !allowNaN) {
            throw new ArgumentParseError()
        }
        if ((min !== undefined && x < min) || (max !== undefined && x > max)) {
            throw new ArgumentParseError(padStart(0, '')`Choose from [${min};${max}]`)
        }
        return x
    }
}