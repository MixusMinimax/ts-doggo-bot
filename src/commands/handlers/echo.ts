import { Message } from 'discord.js'
import { GuildSettingsModel } from '../../database/models/settings'
import { reply } from '../../tools/string.utils'
import { NumberRange } from '../../tools/throwingArgparse'
import { Handler, HandlerContext } from '../types'
import { assertPermission } from './permission'
import { createSession, joinSession } from './sessions'

const PATH_REQUIRED_LEVEL = 'permissions.handlers.echo'
const DEFAULT_REQUIRED_LEVEL = 10

export class EchoHandler extends Handler {
    description = 'Start an echo session'

    async execute(args: any, body: string, message: Message, context: HandlerContext): Promise<void> {

        const settings = await GuildSettingsModel.findOneOrCreate(message.guild!)
        const required = settings.getSingleOption(PATH_REQUIRED_LEVEL, NumberRange(0, 10), DEFAULT_REQUIRED_LEVEL)
        assertPermission(context.permissionLevel.level, required)

        const id = await createSession(message, {
            name: 'echo',
            description: 'Echo every message',

            initialState: '1',
            async transition(_state: string, _message: Message) {
                // Sends message in original channel!
                await message.channel.send(_message.content)
                return '1'
            },
            async onStart(_message: Message) {
                await _message.channel.send(reply(message, 'Echo session started!'))
            },
            async onJoin(_message: Message) {
                await _message.channel.send(`${message.author} joined!`)
            },
            async onLeave(_message: Message) {
                await _message.channel.send(`${message.author} left!`)
                await this.cancel(_message)
            },
            async onCancel(_message: Message) {
                await _message.channel.send('Echo stopped!')
            },

            allowedUsers: new Set([message.author.id]),
            allowedUsersFilterType: 'whitelist'
        })
        await joinSession(message, id, context.permissionLevel.level)
    }
}