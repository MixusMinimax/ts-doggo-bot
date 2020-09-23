
import ThrowingArgumentParser from '../tools/throwingArgparse'
import { ISimpleMessage } from '../tools/types'
import { Handler, HandlerOptions } from './handler.type'

export class PingHandler extends Handler {

    async execute(_args: any, _body: string, message: ISimpleMessage, _options: HandlerOptions): Promise<void> {
        const m = await message.channel.send('Pinging...')
        const ping = m.createdTimestamp - message.createdTimestamp
        m.edit(`**Pong!** API latency: \`${ping}ms\``)
    }

    get parser() {
        const _parser = new ThrowingArgumentParser({
            prog: this.prog,
            description: 'Api latency'
        })
        return _parser
    }
}
