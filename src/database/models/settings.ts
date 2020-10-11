import { getModelForClass, modelOptions, prop, DocumentType } from "@typegoose/typegoose"
import { dlog } from "../../tools/log"
import { Indexable } from "../../tools/types"
import { LinkList } from "./links"

@modelOptions({
    schemaOptions: {
        collection: 'guildsettings',
        versionKey: false,
        _id: false,
        id: false
    }
})
export class GuildSettings implements Indexable<any> {
    @prop({ required: true, unique: true })
    guild!: string

    @prop({ type: String, default: [] })
    moderatorRoles!: string[]

    static async findOneOrCreate(guild: string): Promise<DocumentType<GuildSettings>> {
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
}

export const GuildSettingsModel = getModelForClass(GuildSettings)