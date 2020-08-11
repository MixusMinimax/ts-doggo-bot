import Links, { LinksSchema, ILinksDocument } from '../models/links.model'
import { } from 'mongoose'


const implementStatics = function implementStatics() {
    LinksSchema.statics.func = function func(name: string) {
        console.log(name)
    }

    LinksSchema.statics.findOneOrCreate = async function (guild: string, channel: string): Promise<ILinksDocument> {
        const doc = await Links.findOne({
            guild,
            channel
        })
        return doc || (() => {
            console.log('create')
            return Links.create({
                guild,
                channel,
                lines: []
            });
        })()
    }
}

const implementMethods = function implementMethods() {
    LinksSchema.methods.insert = async function (lines: string[], at: number = -1): Promise<void> {
        if (at >= this.lines.length) at = -1
        if (at < 0) {
            this.lines = this.lines.concat(lines)
        } else if (at == 0) {
            this.lines = lines.concat(this.lines)
        } else {
            this.lines = this.lines.splice(0, at).concat(lines).concat(this.lines)
        }
        await this.save()
    }
}

export default function init() {
    implementStatics()
    implementMethods()
}