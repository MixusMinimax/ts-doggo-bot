
import { Message } from 'discord.js'
import ThrowingArgumentParser from '../tools/throwingArgparse'
import { Handler, HandlerContext } from './handler.type'

export class SayHandler extends Handler {

    description = 'Say a message'

    async execute(_args: any, _body: string, message: Message, _options: HandlerContext): Promise<void> {
        const sayMessage = message.content.slice(this.prog.length).trim()
        message.delete().catch(() => { })
        message.channel.send(sayMessage)
    }
}
