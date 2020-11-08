import { Message } from 'discord.js'
import fs from 'fs'
import path from 'path'
import { NonHandler, NonHandlerContext } from '../types'
import config from '../../../config/config.json'

const doggoPath = path.join(__dirname, '../../../', config.doggos)

export class Doggo extends NonHandler {

    name = 'doggo'

    protected async _execute(message: Message, _context: NonHandlerContext): Promise<boolean> {

        if (message.content.toLowerCase().includes('doggo')) {
            fs.readdir(doggoPath, function (err, files) {
                // handling error
                if (err) {
                    return console.error('Unable to scan directory: ' + err)
                }
                const file = files[Math.floor(Math.random() * files.length)]
                message.channel.send({ files: [path.join(doggoPath, file)] })
            })
        }

        return false
    }
}