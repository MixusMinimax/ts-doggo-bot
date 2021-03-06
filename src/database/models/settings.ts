import { DocumentType, getModelForClass, modelOptions, prop } from '@typegoose/typegoose'
import { Guild } from 'discord.js'
import { alterArray, ArrayUpdateResult } from '../../tools/array.utils'
import { dlog } from '../../tools/log'
import { arrayToString } from '../../tools/string.utils'
import { Indexable } from '../../tools/types'

function dotToMongo(s: string): string {
    return s.replace(/\./g, ':')
}

function mongoToDot(s: string): string {
    return s.replace(/:/g, '.')
}

@modelOptions({
    schemaOptions: {
        collection: 'guildsettings',
        versionKey: false,
        id: false,
    }
})
export class GuildSettings {
    @prop({ required: true, unique: true })
    guild!: string

    @prop({ default: {} })
    private settings!: Indexable<string[]>

    static async findOneOrCreate(guild: string | Guild): Promise<DocumentType<GuildSettings>> {
        if (typeof (guild) !== 'string') {
            guild = guild.id
        }
        const doc = await GuildSettingsModel.findOne({
            guild
        })
        return doc || await (async () => {
            dlog('MONGO.models.settings', 'create')
            return await new GuildSettingsModel({
                guild
            }).save()
        })()
    }

    getNames(this: DocumentType<GuildSettings>): string[] {
        return Object.keys(this.settings).map(mongoToDot)
    }

    getSingleOption<T>(this: DocumentType<GuildSettings>, key: string, type: ((x: string) => T),
        defaultValue: T): T {
        return this.getOption(key, type, defaultValue) as T
    }

    getOption<T>(
        this: DocumentType<GuildSettings>, key: string, type: ((x: string) => T) | [((x: string) => T)],
        defaultValue: T | T[] | null = null
    ): T | T[] | null {
        key = dotToMongo(key)
        const val = this.settings[key] || []
        if (Array.isArray(type)) {
            const nothing = Symbol('nothing')
            return val
                .map(e => {
                    try {
                        return type[0](e)
                    } catch {
                        return nothing
                    }
                })
                .filter(e => e !== nothing)
                .map(e => e as T)
        } else {
            for (const e of val) {
                try {
                    return type(e)
                } catch { }
            }
            return defaultValue
        }
    }

    async deleteOption(this: DocumentType<GuildSettings>, key: string): Promise<DocumentType<GuildSettings>> {
        key = dotToMongo(key)
        dlog('MONGO.models.settings', `Unsetting ${key} for guild ${this.guild}`)
        return await this.updateOne({ $unset: { [`settings.${key}`]: 1 } })
    }

    async updateOption<T>(
        this: DocumentType<GuildSettings>, key: string, _values?: T[] | T,
        {
            overwrite = false, insertAt = -1, remove: remove = false
        }: {
            overwrite?: boolean, insertAt?: number, remove?: boolean
        } = {}
    ): Promise<ArrayUpdateResult<string> | never> {
        let values: string[] | undefined
        if (Array.isArray(_values)) {
            values = _values.map(String)
        } else if (_values !== undefined) {
            values = [String(_values)]
        }

        key = dotToMongo(key)
        if (overwrite) {
            dlog('MONGO.models.settings', `Overwriting ${key} with [${values}] for guild ${this.guild}`)
            if (values === undefined) {
                throw new Error('No value supplied!')
            }
            await this.updateOne({ $set: { [`settings.${key}`]: values } })
            return {
                array: values,
                addedLines: values
            }
        }
        else if (values?.length && remove) {
            dlog('MONGO.models.settings', `Removing values ${arrayToString(values)} for ${key} for guild ${this.guild}`)
            const arr: string[] | undefined = this.settings[key]
            if (!arr) return { array: arr }
            const result = alterArray(arr, { remove: values.map(e => arr.indexOf(e)) })
            await this.updateOne({ $set: { [`settings.${key}`]: result.array } })
            return result
        }
        else if (values?.length) {
            dlog('MONGO.models.settings', `Inserting ${values} to ${key} at index ${insertAt} for guild ${this.guild}`)
            const arr: string[] | undefined = this.settings[key]
            if (!arr) {
                return await this.updateOne({ $set: { [`settings.${key}`]: values } })
            }
            values = values.filter(e => !arr.includes(e))
            const result = alterArray(arr, { add: values, at: insertAt })
            await this.updateOne({ $set: { [`settings.${key}`]: result.array } })
            return result
        }
        throw new Error('no values supplied')
    }
}

export const GuildSettingsModel = getModelForClass(GuildSettings)