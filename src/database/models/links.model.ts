import { Document, model, Schema, Model } from 'mongoose'
import initController from '../controllers/links.controller'

export interface ILinksDocument extends Document {
    guild: string,
    channel: string
    lines: string[],
    insert: (lines: string[], at: number) => Promise<void>
}

export const LinksSchema = new Schema({
    guild: String,
    channel: String,
    lines: [String]
})

interface ILinksModel extends Model<ILinksDocument> {
    func: (name: string) => void,
    findOneOrCreate: (guild: string, channel: string) => Promise<ILinksDocument>
}

initController()

const Links = model<ILinksDocument, ILinksModel>('Links', LinksSchema)
export default Links

console.log(LinksSchema.methods)