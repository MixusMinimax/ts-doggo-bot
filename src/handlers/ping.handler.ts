
import { Message } from 'discord.js'
import ThrowingArgumentParser from '../tools/throwingArgparse'
import { Handler, HandlerContext } from './handler.type'

export class PingHandler extends Handler {

    description = 'Api latency'

    async execute(_args: any, _body: string, message: Message, _options: HandlerContext): Promise<void> {
        const m = await message.channel.send('Pinging...')
        const ping = m.createdTimestamp - message.createdTimestamp
        m.edit(`**Pong!** API latency: \`${ping}ms\``)
    }
}
