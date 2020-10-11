import { Const } from 'argparse'
import { GuildMember, Message, User } from 'discord.js'
import { tryFindMember } from '../tools/discord.utils'
import { dlog } from '../tools/log'
import ThrowingArgumentParser from '../tools/throwingArgparse'
import { ClearTextError } from '../tools/types'
import { Handler, HandlerOptions } from './handler.type'

export class PermissionHandler extends Handler {

    async execute(
        { reset, user: _user, level: _level }: { reset: boolean, user: string | null, level: string | null, },
        body: string, message: Message, options: HandlerOptions
    ): Promise<string> {
        let level = _level !== null ? +_level : null
        if (level !== null && (isNaN(level) || level < 0 || level > 10)) {
            throw new Error(`Error: argument "level": Invalid choice: ${_level} (choose from (0-10))`)
        }
        let user = message.member!
        if (_user !== null) {
            user = tryFindMember(message.guild!, _user, 0.5)
        }

        // TODO: Query Permission Override or calculate contextual permission from User Roles
        // Also, override permissions or remove override

        return user.user.toString()
    }

    get parser() {
        const _parser = new ThrowingArgumentParser({
            prog: this.prog,
            description: 'Handle User Permission Level'
        })
        _parser.addArgument(['-r', '--reset'], {
            action: 'storeTrue',
            help: 'Remove Permission Override.'
        })
        _parser.addArgument('user', {
            nargs: Const.OPTIONAL,
            type: String,
            help: 'Specify the user, defaults to you.'
        })
        _parser.addArgument('level', {
            nargs: Const.OPTIONAL,
            type: String,
            help: 'Override the User\'s Permission Level. (0-10)'
        })

        return _parser
    }
}