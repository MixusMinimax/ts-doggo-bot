import { Message } from 'discord.js'
import { GuildSettings, GuildSettingsModel } from '../database/models/settings'
import { BooleanExact } from '../tools/throwingArgparse'
import { PromiseOrNot } from '../tools/types'
import { DocumentType } from '@typegoose/typegoose'

export type NonHandlerContext = {
    settings: DocumentType<GuildSettings>
}

export abstract class NonHandler {

    readonly abstract name: string

    constructor() { }

    /**
     * Call this to execute non-commands
     *
     * @param message - Discord Message to respond to
     * @returns true if further processing should be stopped
     */
    public async execute(message: Message): Promise<boolean> {
        const settings = await GuildSettingsModel.findOneOrCreate(message.guild!)
        if (!this.isEnabled(settings)) {
            return false
        }
        return await this._execute(message, {
            settings
        })
    }

    protected settingsKey(key: string): string {
        if (this.name === 'enabled') {
            throw new Error(`Illegal name: '${this.name}'`)
        }
        return `non-commands.${this.name}.${key}`
    }

    protected isEnabled(settings: DocumentType<GuildSettings>): boolean {
        return settings.getSingleOption(this.settingsKey('enabled'), BooleanExact(), true)
    }

    protected abstract _execute(message: Message, context: NonHandlerContext): PromiseOrNot<boolean>
}