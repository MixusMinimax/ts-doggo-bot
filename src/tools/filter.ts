import { Indexable } from './types'

export interface IFilter extends Indexable<boolean | IFilter> { }

export function isIFilter(object: any): object is IFilter {
    return object && (object instanceof Object)
}

export function traverseFilter(filter: IFilter, tokens: string[], print = false, indentation = 0): { enabled: boolean, path: string[] } | undefined {
    const token = tokens.shift()
    if (token !== undefined) {
        if (print)
            console.log('  '.repeat(indentation) + token)
        const fil = filter[token]
        if (isIFilter(fil)) {
            const ret = traverseFilter(fil, tokens, print, indentation + 1)
            if (ret !== undefined) {
                return { enabled: ret.enabled, path: [token, ...ret.path] }
            }
        }
        else if (fil !== undefined)
            return { enabled: fil, path: [token] }
    }
    if (print)
        console.log('  '.repeat(indentation) + 'default')
    const def = filter.default
    if (isIFilter(def)) {
        const ret = traverseFilter(def, tokens, print, indentation + 1)
        if (ret !== undefined) {
            return { enabled: ret.enabled, path: ['default', ...ret.path] }
        } else {
            return undefined
        }
    } else if (def !== undefined)
        return { enabled: def, path: ['default'] }
    else
        return undefined
}