import { Const } from 'argparse'
import { Message } from 'discord.js'
import { GuildSettingsModel } from '../../database/models/settings'
import ThrowingArgumentParser, { NumberRange } from '../../tools/throwingArgparse'
import { Handler, HandlerContext } from '../types'
import { assertPermission } from './permission'

const PATH_REQUIRED_LEVEL = 'permissions.handlers.say'
const DEFAULT_REQUIRED_LEVEL = 1

export class SayHandler extends Handler {

    description = 'Say a message'

    async execute({ words }: { words: string[] }, body: string, message: Message, context: HandlerContext): Promise<void> {
        const settings = await GuildSettingsModel.findOneOrCreate(message.guild!)
        const required = settings.getSingleOption(PATH_REQUIRED_LEVEL, NumberRange(0, 10), DEFAULT_REQUIRED_LEVEL)
        assertPermission(context.permissionLevel.level, required)
        message.delete().catch(() => { })
        message.channel.send(`${words.join(' ')}\n${body}`)
    }

    defineArguments(_parser: ThrowingArgumentParser) {
        _parser.addArgument('words', {
            nargs: Const.REMAINDER,
            help: 'What to say.'
        })
    }
}
