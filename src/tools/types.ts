import { ArgumentParser, Namespace } from 'argparse'
import { Channel, Guild, User } from 'discord.js'

export interface ISimpleMessage {
    content: string,
    guild: Guild | null,
    channel: Channel,
    author: User
}

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