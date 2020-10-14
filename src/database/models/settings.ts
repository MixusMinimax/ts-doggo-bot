import { DocumentType, getModelForClass, modelOptions, prop } from "@typegoose/typegoose"
import { mapOptions } from "@typegoose/typegoose/lib/internal/utils"
import { Guild } from "discord.js"
import { dlog } from "../../tools/log"
import { Indexable, KeyError, ValueError } from "../../tools/types"

type PropertyType = string | number

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
    settings!: Map<string, PropertyType[]>

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

    getOption(this: DocumentType<GuildSettings>, key: string): PropertyType[] {
        return this.settings.get(key) || []
    }

    async setOption(
        this: DocumentType<GuildSettings>, key: string, value?: PropertyType | PropertyType[],
        { insertAt, removeIndices = [] }: { insertAt?: number, removeIndices?: number[] } = {}
    ): Promise<void | never> {
        if (!Array.isArray(value)) {
            value = [value as PropertyType]
        }
        if (removeIndices.length) {
            dlog('MONGO.settings', `Removing indices ${removeIndices} for ${key} for guild ${this.guild}`)
            // TODO
        }
        if (insertAt === undefined) {
            insertAt = ((this as any)[key] as PropertyType[]).length
            dlog('MONGO.settings', `Setting insertAt to ${insertAt}`)
            // TODO
        }
        dlog('MONGO.settings', `Inserting ${value} to ${key} at index ${insertAt} for guild ${this.guild}`)
        // TODO

        //// return await save()
    }
}

export const GuildSettingsModel = getModelForClass(GuildSettings)