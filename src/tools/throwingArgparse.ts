import { ArgumentParser, ArgumentParserOptions } from 'argparse'
import { dlog } from './log'
import { padStart } from './string.utils'

export class ArgumentParseError extends Error { }

export class PrintHelpError extends Error {
    prog: string | undefined

    constructor(prog: string | undefined, message: string) {
        super(message)
        this.prog = prog
    }
}

export default class ThrowingArgumentParser extends ArgumentParser {

    description?: string
    prog?: string

    constructor(args: ArgumentParserOptions = {}) {
        dlog('ARGPARSE', args)
        super(args)
        this.prog = args.prog
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
        throw new PrintHelpError(this.prog, this.formatHelp())
    }
}

export function NumberRange(min?: number, max?: number, allowNaN: boolean = false): (x: string) => number | never {
    return function Number(_x) {
        let x = +_x
        const r = _x.match(/^(\d+)%$/)
        if (r) {
            x = +(r[1]) / 100
        }
        if (isNaN(x) && !allowNaN) {
            throw new ArgumentParseError()
        }
        if ((min !== undefined && x < min) || (max !== undefined && x > max)) {
            throw new ArgumentParseError(padStart(0, '')`Choose from [${min};${max}]`)
        }
        return x
    }
}

export function BooleanExact({
    caseSensitive = false,
    trues = ['true'],
    falses = ['false']
}: {
    caseSensitive?: boolean,
    trues?: string[],
    falses?: string[]
} = {}) {
    if (trues.filter(e => falses.includes(e)).length) {
        throw new Error('trues and falses mustn\'t intersect!')
    }
    if (!caseSensitive) {
        trues = trues.map(e => e.toLowerCase())
        falses = falses.map(e => e.toLowerCase())
    }
    return function Boolean(_x: string) {
        if (!caseSensitive) {
            _x = _x.toLowerCase()
        }
        if (trues.includes(_x)) {
            return true
        }
        if (falses.includes(_x)) {
            return false
        }
        throw new ArgumentParseError(`Choose from [${[...trues, ...falses].join(', ')}]`)
    }
}