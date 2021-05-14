import { Action, ArgumentParser, ArgumentParserOptions, Const, Namespace } from 'argparse'
import { Handler } from '../commands/types'
import { dlog } from './log'
import { padStart } from './string.utils'

export class ArgumentParseError extends Error { }

export class PrintHelpException extends Error {
    handler: Handler
    words: string[]
    constructor(handler: Handler, words: string[]) {
        super()
        this.handler = handler
        this.words = words
    }
}

function createPrintHelpAction(handler: Handler) {
    class PrintHelpAction extends Action {
        call(parser: ArgumentParser, namespace: Namespace, values: string[]): void {
            console.log(namespace)
            throw new PrintHelpException(handler, values)
        }
    }
    return PrintHelpAction
}

export class ThrowingArgumentParser extends ArgumentParser {

    handler!: Handler
    description?: string
    prog?: string

    private constructor(args: ArgumentParserOptions) {
        super(args)
    }

    static create(args: ArgumentParserOptions & { handler: Handler }): ThrowingArgumentParser {
        dlog('ARGPARSE', args)
        const ret = new ThrowingArgumentParser({ ...args, addHelp: false })
        ret.handler = args.handler
        if (args.addHelp !== false) {
            ret.addArgument(['-h', '--help'], {
                action: createPrintHelpAction(ret.handler),
                nargs: Const.ZERO_OR_MORE
            })
        }
        ret.prog = args.prog
        ret.description = args.description
        return ret
    }

    error(err: string | Error) {
        if (err instanceof Error) {
            throw err
        } else {
            throw new ArgumentParseError(err)
        }
    }

    printHelp() {
        throw new PrintHelpException(this.handler, [])
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