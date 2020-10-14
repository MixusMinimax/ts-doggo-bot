import { Message } from 'discord.js'
import { padStart } from '../tools/stringTools'
import { Handler, HandlerContext } from './handler.type'

export class TimeHandler extends Handler {

    description = 'Print current time'

    async execute(_args: any, _body: string, message: Message, _context: HandlerContext): Promise<void> {
        const today = new Date()
        const date = padStart(2, '0')`${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`
        const time = padStart(2, '0')`${today.getHours()}:${today.getMinutes()}`
        message.channel.send(`The current time is: ${time} on ${date}`)
    }
}
