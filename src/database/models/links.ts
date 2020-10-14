import { DocumentType, getModelForClass, modelOptions, prop } from '@typegoose/typegoose'
import { alterArray } from '../../tools/array.utils'
import { dlog } from '../../tools/log'
import { onlyUnique } from '../../tools/stringTools'

export interface ILinksUpdateResult {
    links: LinkList,
    addedLines?: string[],
    removedIndices?: number[]
}

@modelOptions({
    schemaOptions: {
        collection: 'links',
        versionKey: false
    }
})
export class LinkList {
    @prop()
    guild!: string

    @prop()
    channel!: string

    @prop({ type: () => [String], default: [] })
    lines!: string[]

    async insertLines(this: DocumentType<LinkList>, lines: string[], at: number = -1): Promise<ILinksUpdateResult> {
        const updateResult = alterArray(this.lines, { add: lines, at })
        this.lines = updateResult.array
        return {
            links: await this.save(),
            addedLines: lines
        }
    }

    async removeLines(this: DocumentType<LinkList>, indices: number[]): Promise<ILinksUpdateResult> {
        // Just as an accurate presentation of how many lines were removed
        const updateResult = alterArray(this.lines, { remove: indices })
        this.lines = updateResult.array
        return {
            links: await this.save(),
            removedIndices: indices
        }
    }

    static async findOneOrCreate(guild: string, channel: string): Promise<DocumentType<LinkList>> {
        const doc = await LinkLists.findOne({
            guild,
            channel
        })
        return doc || (() => {
            dlog('MONGO.models.links', 'create')
            return LinkLists.create({
                guild,
                channel,
                lines: []
            })
        })()
    }
}

export const LinkLists = getModelForClass(LinkList)