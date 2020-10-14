import { Message } from 'discord.js'
import { Handler, HandlerContext } from './handler.type'

export class SayHandler extends Handler {

    description = 'Say a message'

    async execute(_args: any, _body: string, message: Message, _context: HandlerContext): Promise<void> {
        const sayMessage = message.content.slice(this.prog.length).trim()
        message.delete().catch(() => { })
        message.channel.send(sayMessage)
    }
}
