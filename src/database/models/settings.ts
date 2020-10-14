import { DocumentType, getModelForClass, modelOptions, prop } from "@typegoose/typegoose"
import { Guild } from "discord.js"
import { dlog } from "../../tools/log"
import { Indexable, KeyError, ValueError } from "../../tools/types"

type PropertyType = string | number
type PropertyTypeOrArr = PropertyType | PropertyType[]

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

    @prop({ type: String, default: [] })
    moderatorRoles!: string[]

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

    getOption(this: DocumentType<GuildSettings>, key: string): PropertyTypeOrArr {
        console.log(Object.getOwnPropertyNames(this))
        if (key === 'guild' || !Object.getOwnPropertyNames(this).includes(key)) {
            throw new KeyError(key)
        }
        const ret: PropertyTypeOrArr = (this as any)[key]
        if (ret === undefined) {
            throw new KeyError(key)
        }
        return ret
    }

    async setOption(
        this: DocumentType<GuildSettings>, key: string, value?: PropertyTypeOrArr,
        { insertAt, removeIndices = [] }: { insertAt?: number, removeIndices?: number[] } = {}
    ): Promise<void | never> {
        if (key === 'guild' || !Object.getOwnPropertyNames(this).includes(key)) {
            throw new KeyError(key)
        }
        const thisArr = Array.isArray((this as any)[key])
        const paraArr = Array.isArray(value)
        if (!thisArr && paraArr) {
            throw new ValueError(value, `Can't be an array`)
        }
        if (thisArr && !paraArr) {
            value = [value as PropertyType]
        }
        if (!thisArr) {
            dlog('MONGO.settings', `Setting ${key} to ${value} for guild ${this.guild}`)
            // TODO
            return
        }
        if (removeIndices.length) {
            dlog('MONGO.settings', `Removing indices ${removeIndices} for ${key} for guild ${this.guild}`)
        }
        if (insertAt === undefined) {
            insertAt = ((this as any)[key] as PropertyType[]).length
            dlog('MONGO.settings', `Setting insertAt to ${insertAt}`)
        }
        dlog('MONGO.settings', `Inserting ${value} to ${key} at index ${insertAt} for guild ${this.guild}`)
        // TODO

        //// return await save()
    }
}

export const GuildSettingsModel = getModelForClass(GuildSettings)