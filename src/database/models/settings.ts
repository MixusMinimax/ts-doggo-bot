import { DocumentType, getModelForClass, modelOptions, prop } from "@typegoose/typegoose"
import { mapOptions } from "@typegoose/typegoose/lib/internal/utils"
import { Guild } from "discord.js"
import { dlog } from "../../tools/log"
import { Indexable, KeyError, ValueError } from "../../tools/types"

type PropertyType = string | number

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
export class GuildSettings implements Indexable<any> {
    @prop({ required: true, unique: true })
    guild!: string

    @prop({ default: {} })
    private settings!: Indexable<PropertyType[]>

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

    getOption(this: DocumentType<GuildSettings>, key: string): PropertyType[] {
        key = dotToMongo(key)
        return this.settings[key] || []
    }

    async deleteOption(this: DocumentType<GuildSettings>, key: string) {
        key = dotToMongo(key)
        return await this.update({ $unset: `settings.${key}` })
    }

    async setOption(
        this: DocumentType<GuildSettings>, key: string, values?: PropertyType[],
        {
            overwrite = false, insertAt = -1, removeValues = []
        }: {
            overwrite?: boolean, insertAt?: number, removeValues?: PropertyType[]
        } = {}
    ): Promise<void | never> {
        key = dotToMongo(key)
        if (overwrite) {
            dlog('MONGO.models.settings', `Overwriting ${key} with [${values}] for guild ${this.guild}`)
            if (values === undefined) {
                throw new Error('No value supplied!')
            }
            return await this.updateOne({ $set: { [`settings.${key}`]: values } })
        }
        else if (removeValues.length) {
            dlog('MONGO.models.settings', `Removing values [${removeValues}] for ${key} for guild ${this.guild}`)
            // TODO
        }
        else {
            dlog('MONGO.models.settings', `Inserting ${values} to ${key} at index ${insertAt} for guild ${this.guild}`)
            // TODO
        }
        await this.save()
    }
}

export const GuildSettingsModel = getModelForClass(GuildSettings)