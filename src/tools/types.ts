export interface Indexable<T> {
    [key: string]: T
}

export class ClearTextError extends Error { }

export class CommandNotFoundError extends Error { }

export class KeyError extends Error {
    constructor(key: string, message?: string) {
        super(`Invalid key: "${key}"` + message ? `: ${message}` : '')
    }
}

export class ValueError<T> extends Error {
    constructor(key: T, message?: string) {
        super(`Invalid value: "${key}"` + message ? `: ${message}` : '')
    }
}

export type PromiseOrNot<T> = Promise<T> | T

export type FilterType = 'whitelist' | 'blacklist'