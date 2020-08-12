import { } from 'mongoose'
import { dlog } from '../../tools/log'
import Links, { ILinksDocument, ILinksUpdateResult, LinksSchema } from '../models/links.model'


const implementStatics = function implementStatics() {

    LinksSchema.statics.findOneOrCreate = async function (guild: string, channel: string): Promise<ILinksDocument> {
        const doc = await Links.findOne({
            guild,
            channel
        })
        return doc || (() => {
            dlog('MONGO.models.links', 'create')
            return Links.create({
                guild,
                channel,
                lines: []
            });
        })()
    }
}

const implementMethods = function implementMethods() {

    LinksSchema.methods.insertLines = async function (lines: string[], at: number = -1): Promise<ILinksUpdateResult> {
        const self: ILinksDocument = <ILinksDocument>this
        if (at >= self.lines.length) at = -1
        if (at < 0) {
            self.lines = self.lines.concat(lines)
        } else if (at == 0) {
            self.lines = lines.concat(self.lines)
        } else {
            self.lines = self.lines.splice(0, at).concat(lines).concat(self.lines)
        }
        return {
            links: await self.save(),
            linesAdded: lines.length
        }
    }

    LinksSchema.methods.removeLines = async function (indices: number[]): Promise<ILinksUpdateResult> {
        const self: ILinksDocument = <ILinksDocument>this
        // Just as an accurate presentation of how many lines were removed
        indices = indices.filter(index => index >= 0 && index < self.lines.length)
        self.lines = self.lines.filter((_line: string, index: number) => !indices.includes(index))
        return {
            links: await self.save(),
            linesRemoved: indices.length
        }
    }
}

export default function init() {
    implementStatics()
    implementMethods()
}