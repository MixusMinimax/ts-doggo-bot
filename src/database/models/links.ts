import { DocumentType, getModelForClass, modelOptions, prop } from '@typegoose/typegoose'
import { dlog } from '../../tools/log'

export interface ILinksUpdateResult {
    links: LinkList,
    addedLines?: string[],
    removedIndices?: number[]
}

@modelOptions({
    schemaOptions: {
        collection: 'links'
    }
})
export class LinkList {
    @prop()
    guild!: string

    @prop()
    channel!: string

    @prop({ type: () => [String], default: [] })
    lines!: string[]

    async insertLines(this: DocumentType<LinkList>, lines: string[], at: number): Promise<ILinksUpdateResult> {
        if (lines.length === 0) {
            return {
                links: this,
                addedLines: []
            }
        }
        if (at >= this.lines.length) at = -1
        if (at < 0) {
            this.lines = this.lines.concat(lines)
        } else if (at === 0) {
            this.lines = lines.concat(this.lines)
        } else {
            this.lines = this.lines.splice(0, at).concat(lines).concat(this.lines)
        }
        return {
            links: await this.save(),
            addedLines: lines
        }
    }

    async removeLines(this: DocumentType<LinkList>, indices: number[]): Promise<ILinksUpdateResult> {
        // Just as an accurate presentation of how many lines were removed
        indices = indices.filter(index => index >= 0 && index < this.lines.length).sort()
        if (indices.length === 0) {
            return {
                links: this,
                removedIndices: indices
            }
        }
        this.lines = this.lines.filter((_line: string, index: number) => !indices.includes(index))
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

const LinkLists = getModelForClass(LinkList)
export default LinkLists