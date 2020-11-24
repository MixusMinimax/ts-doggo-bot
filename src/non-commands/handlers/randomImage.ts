import { Client } from '@rmp135/imgur'
import axios from 'axios'
import { Message } from 'discord.js'
import config from '../../../config/config.json'
import { Indexable } from '../../tools/types'
import { NonHandler, NonHandlerContext } from '../types'


export class RandomImage extends NonHandler {

    protected readonly defaultEnabled = false

    readonly name: string
    private word: string

    constructor(word: string) {
        super()
        this.name = `img.${word}`
        this.word = word
    }

    protected async _execute(message: Message, _context: NonHandlerContext): Promise<boolean> {

        if (message.content.toLowerCase().match(new RegExp('(?<=^|\\W)' + this.word + '(?=$|\\W)'))) {
            const client = new Client({
                client_id: process.env.IMGUR_CLIENT_ID,
                client_secret: process.env.IMGUR_CLIENT_SECRET
            })
            const albumId = (config.imgur as Indexable<string>)[this.word]
            if (!albumId) {
                throw new Error('No albumID')
            }
            const images = await client.Album.images(albumId)
            const index = Math.floor(Math.random() * images.data.length)

            // Download image and send to discord, instead of sending the link.
            // This way, changes on imgur's end won't be reflected in chat
            const image = await axios.get<Buffer>(images.data[index].link, { responseType: 'arraybuffer' })
            const s = image.data

            message.channel.send({ files: [s] })
            return true
        }

        return false
    }
}