export interface Indexable<T> {
    [key: string]: T
}

export class PermissionLevelException extends Error {
    constructor(required: number, actual: number) {
        super(`Permission level ${required} required! (${actual})`)
    }
}

export function checkPermission(required: number, actual: number): void {
    if (required > actual)
        throw new PermissionLevelException(required, actual)
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