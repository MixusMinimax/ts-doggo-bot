import { Message } from 'discord.js'
import { padStart, reply } from '../../tools/string.utils'
import { Handler, HandlerContext } from '../types'

export class TimeHandler extends Handler {

    description = 'Print current time'

    async execute(_args: any, _body: string, message: Message, _context: HandlerContext): Promise<string> {
        const today = new Date()
        const date = padStart(2, '0')`${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`
        const time = padStart(2, '0')`${today.getHours()}:${today.getMinutes()}`
        return reply(message, `> The current time is: ${time} on ${date}`)
    }
}
