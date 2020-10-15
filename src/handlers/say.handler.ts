import { Message } from 'discord.js'
import { GuildSettingsModel } from '../database/models/settings'
import { NumberRange } from '../tools/throwingArgparse'
import { Handler, HandlerContext } from './handler.type'
import { assertPermission } from './permission.handler'

const PATH_REQUIRED_LEVEL = 'permissions.handlers.say'
const DEFAULT_REQUIRED_LEVEL = 1

export class SayHandler extends Handler {

    description = 'Say a message'

    async execute(_args: any, _body: string, message: Message, context: HandlerContext): Promise<void> {
        const settings = await GuildSettingsModel.findOneOrCreate(message.guild!)
        const required = settings.getSingleOption(PATH_REQUIRED_LEVEL, NumberRange(0, 10), DEFAULT_REQUIRED_LEVEL)
        assertPermission(context.permissionLevel.level, required)
        const sayMessage = message.content.slice(this.prog.length).trim()
        message.delete().catch(() => { })
        message.channel.send(sayMessage)
    }
}
