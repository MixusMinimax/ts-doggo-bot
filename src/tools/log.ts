import { IFilter, traverseFilter } from './filter'

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
            links: true,
            settings: true,
        }
    },
    HANDLER: {
        default: {
            default: true,
            args: false
        },
        links: {
            default: true,
            add: true,
            remove: true,
        },
        permission: {
            default: true,
        },
        help: true
    },
    UTILS: {
        default: false,
        discord: true
    }
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
    delims = [' ', ' ']
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