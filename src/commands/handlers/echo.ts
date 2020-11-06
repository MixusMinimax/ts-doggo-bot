import { Message } from 'discord.js'
import { reply } from '../../tools/string.utils'
import { Handler, HandlerContext } from '../types'
import { createSession, identifierFromMessage, joinSession } from './sessions'

export class EchoHandler extends Handler {
    description = 'Start an echo session'

    execute(args: any, body: string, message: Message, _context: HandlerContext): string {
        const id = createSession(message.guild!, {
            name: 'echo',
            description: 'Echo every message',

            initialState: '1',
            async transition(_state: string, _message: Message) {
                await _message.channel.send(_message.content)
                return '1'
            },
            async onCancel(_message: Message) {
                await _message.channel.send('Echo stopped!')
            },
            async onLeave(_message: Message) {
                await this.cancel(_message)
            },
        })
        joinSession(identifierFromMessage(message), id)


        return reply(message, 'Echo session started!')
    }
}