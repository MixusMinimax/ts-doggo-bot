import { onlyUnique } from "./stringTools"

export type ArrayUpdate<T> = ArrayInsert<T> | ArrayRemove

interface ArrayInsert<T> {
    add: T[],
    at?: number
}

interface ArrayRemove {
    remove: number[]
}

function isArrayInsert<T>(obj: any): obj is ArrayInsert<T> {
    return Array.isArray(obj.add)
}

export interface ArrayUpdateResult<T> {
    array: T[],
    addedLines?: T[],
    removedIndices?: number[]
}

export function alterArray<T>(initial: T[], update: ArrayUpdate<T>): ArrayUpdateResult<T> {
    if (isArrayInsert<T>(update)) {
        return insertAt(initial, update.add, update.at !== undefined ? update.at : -1)
    } else {
        return removeAt(initial, update.remove)
    }
}

function insertAt<T>(initial: T[], add: T[], at: number): ArrayUpdateResult<T> {
    if (add.length === 0) {
        return {
            array: [...initial],
            addedLines: []
        }
    }
    if (at >= initial.length) at = -1
    if (at < 0) {
        return {
            array: [...initial, ...add],
            addedLines: add
        }
    } else if (at === 0) {
        return {
            array: [...add, ...initial],
            addedLines: add
        }
    } else {
        return {
            array: initial.splice(0, at).concat(add).concat(initial),
            addedLines: add
        }
    }
}

function removeAt<T>(initial: T[], indices: number[]): ArrayUpdateResult<T> {
    indices = indices
        .filter(index => index >= 0 && index < initial.length)
        .filter(onlyUnique)
        .sort((a, b) => a - b)
    if (indices.length === 0) {
        return {
            array: [...initial],
            removedIndices: indices
        }
    }
    return {
        array: initial.filter((_line: T, index: number) => !indices.includes(index)),
        removedIndices: indices
    }
}

export function arrayToString<T>(a: T[]): string {
    return `[${a
        .map(e => (typeof e === 'string') ? `"${e}"` : `${e}`)
        .join(', ')}]`
}