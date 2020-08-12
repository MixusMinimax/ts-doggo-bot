import { Document, model, Schema, Model } from 'mongoose'
import initController from '../controllers/links.controller'
import { dlog } from '../../tools/log'

export interface ILinksUpdateResult {
    links: ILinksDocument,
    linesAdded?: number,
    linesRemoved?: number
}

export interface ILinksDocument extends Document {
    guild: string,
    channel: string
    lines: string[],
    insertLines: (lines: string[], at: number) => Promise<ILinksUpdateResult>,
    removeLines: (indices: number[]) => Promise<ILinksUpdateResult>
}

export const LinksSchema = new Schema({
    guild: String,
    channel: String,
    lines: [String]
})

interface ILinksModel extends Model<ILinksDocument> {
    findOneOrCreate: (guild: string, channel: string) => Promise<ILinksDocument>
}

initController()

const Links = model<ILinksDocument, ILinksModel>('Links', LinksSchema)
export default Links

dlog('MONGO.models.links', LinksSchema.methods)