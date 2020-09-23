import { Indexable } from './types'

interface IFilter extends Indexable<boolean | IFilter> {
    default: boolean | IFilter
}

const filter: IFilter = {
    default: true,
    ARGPARSE: false,
    BOT: {
        default: true,
        ready: true,
        guildCreate: true,
        guildDelete: true,
        token: true
    },
    MONGO: {
        default: true,
        token: true,
        models: {
            default: true,
            links: true
        }
    },
    HANDLER: {
        default: {
            default: true,
            args: false
        },
        links: {
            default: false,
            add: true,
            remove: true,
        },
        help: true
    }
}

function isIFilter(object: any): object is IFilter {
    return object && (object as IFilter).default !== undefined
}

export function isEnabled(tag: string): false | string {

    const tokens = tag.split(/:|\.|\//)
    tag = ''

    let current: undefined | boolean | IFilter = filter

    for (let token of tokens) {
        token = token || 'default'
        const textToken = token !== 'default' && token || ''
        if (!isIFilter(current)) return false
        tag = tag && tag + ':' + textToken || textToken
        current = current[token]
    }

    while (isIFilter(current)) {
        current = current.default
    }

    return current && tag.replace(/:*$/, '') || false
}

export function dformat(tag: string, message?: any, {
    tab = 28,
    repeat = '.',
    delims = [' ', ' ']
}: {
    tab?: number,
    repeat?: string,
    delims?: string[]
} = {}): false | string {
    const newTag = isEnabled(tag)
    if (newTag !== false) {
        const offset = 2 + newTag.length + delims[0].length
        const paddingLength = tab - offset - delims[1].length
        const paddingTemplate = repeat.repeat(tab)
        const padding = delims[0] + paddingTemplate.substr(offset, paddingLength) + delims[1]
        return (`[${newTag}]${padding}${message}`)
    }
    return false
}

export function dPrintToStream(cb: (message?: any, ...optionalParams: any[]) => void, tag: string, message?: any, ...optionalParams: any[]) {
    const result = dformat(tag, message)
    if (result !== false) {
        cb(result, ...optionalParams)
    }
}

export function dlog(tag: string, message?: any, ...optionalParams: any[]) {
    dPrintToStream(console.log, tag, message, ...optionalParams)
}

export function derror(tag: string, message?: any, ...optionalParams: any[]) {
    dPrintToStream(console.error, tag, message, ...optionalParams)
}