
import { Message } from 'discord.js'
import ThrowingArgumentParser from '../tools/throwingArgparse'
import { Handler, HandlerOptions } from './handler.type'

export class TimeHandler extends Handler {

    async execute(_args: any, _body: string, message: Message, _options: HandlerOptions): Promise<void> {
        const today = new Date()
        const date = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`
        const time = `${today.getHours()}:${today.getMinutes()}`
        message.channel.send(`The current time is: ${time} on ${date}`)
    }

    get parser() {
        const _parser = new ThrowingArgumentParser({
            prog: this.prog,
            description: 'Print current time'
        })
        return _parser
    }
}
