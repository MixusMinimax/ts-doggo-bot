
import { Message } from 'discord.js'
import ThrowingArgumentParser from '../tools/throwingArgparse'
import { Handler, HandlerOptions } from './handler.type'

export class SayHandler extends Handler {

    async execute(_args: any, _body: string, message: Message, _options: HandlerOptions): Promise<void> {
        const sayMessage = message.content.slice(this.prog.length).trim()
        message.delete().catch(() => { })
        message.channel.send(sayMessage)
    }

    get parser() {
        const _parser = new ThrowingArgumentParser({
            prog: this.prog,
            description: 'Say a message'
        })
        return _parser
    }
}
