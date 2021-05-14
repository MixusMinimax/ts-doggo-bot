import { IFilter, traverseFilter } from './filter'

const filter: IFilter = {
    default: true,
    ARGPARSE: false,
    BOT: {
        default: true,
        ready: true,
        guildCreate: true,
        guildDelete: true,
        token: true,
        owner: false,
    },
    MONGO: {
        default: true,
        token: true,
        models: {
            default: true,
            links: true,
            settings: true,
        },
    },
    HANDLER: {
        default: {
            default: true,
            args: false,
        },
        links: {
            default: true,
            add: true,
            remove: true,
        },
        permission: {
            default: true,
        },
        eval: {
            default: true,
            codeBlocks: false,
            transpiled: true,
        },
        help: true,
    },
    NON_HANDLER: {
        default: true,
        execute: false,
        enabled: false,
        shouldStop: false,
    },
    UTILS: {
        default: false,
        discord: true,
    },
}

export function isEnabled(tag: string): { enabled: boolean, newTag: string } {
    const tokens = tag.split(/:|\.|\//)
    const ret = traverseFilter(filter, tokens)
    if (ret !== undefined) {
        const { enabled, path } = ret
        return {
            enabled,
            newTag: path
                .map(t => t === 'default' ? '' : t)
                .join(':')
                .replace(/:*$/, '')
        }
    }
    return {
        enabled: false, newTag: ''
    }
}

export function dformat(tag: string, message?: any, {
    tab = 28,
    repeat = '.',
    delims = [' ', '']
}: {
    tab?: number,
    repeat?: string,
    delims?: string[]
} = {}): false | string {
    const { enabled, newTag } = isEnabled(tag)
    if (enabled) {
        const offset = 2 + newTag.length + delims[0].length
        const paddingLength = tab - offset - delims[1].length
        const paddingTemplate = repeat.repeat(tab)
        const padding = delims[0] + paddingTemplate.substr(offset, paddingLength) + delims[1]
        return (`[${newTag}]${padding}`)
    }
    return false
}

export function dPrintToStream(cb: (...args: any[]) => void, tag: string, ...args: any[]) {
    const result = dformat(tag)
    if (result !== false) {
        cb(result, ...args)
    }
}

export function dlog(tag: string, ...args: any[]) {
    dPrintToStream(console.log, tag, ...args)
}

export function derror(tag: string, ...args: any[]) {
    dPrintToStream(console.error, tag, ...args)
}