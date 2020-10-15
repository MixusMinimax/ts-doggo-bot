import { Const } from 'argparse'
import { Guild, GuildMember, Message, User } from 'discord.js'
import { GuildSettingsModel } from '../database/models/settings'
import { tryFindMember } from '../tools/discord.utils'
import { reply } from '../tools/string.utils'
import ThrowingArgumentParser, { NumberRange } from '../tools/throwingArgparse'
import { Handler, HandlerContext } from './handler.type'

/* Settings keys: */
const MODERATOR_ROLES = 'permissions.moderatorRoles'
const MODERATOR_LEVEL = 'permissions.moderatorLevel'
const PERMISSION_OVERRIDE = 'permissions.override'

/* Defaults: */
const DEFAULT_MODERATOR_LEVEL = 5
const DEFAULT_LEVEL = 0
const MAX_OVERRIDE = 9
const REQUIRED_LEVEL_TO_UPDATE = 10

export class PermissionError extends Error {
    constructor(public actual: number, public required: number, msg: string | undefined = 'You do not meet the required permission level!') {
        super(msg)
    }
}

export function assertPermission(actual: number, required: number, msg?: string): void | never {
    if (actual < required) {
        throw new PermissionError(actual, required, msg)
    }
}

export class PermissionHandler extends Handler {

    description = 'Handle User Permission Level'

    async execute(
        { reset, user: _user, level }: { reset: boolean, user: string | null, level: number | null, },
        body: string, message: Message, context: HandlerContext
    ): Promise<string> {
        let user = message.member!
        if (_user !== null) {
            user = tryFindMember(message.guild!, _user, 0.5)
        }

        if (level === null && !reset) {
            return reply(message.author, `> ${_user === null ? 'Your' : `${user.displayName}'s`
                } permission level is: \`${context.permissionLevel.level
                }\`, reason: \`${context.permissionLevel.reason}\``)
        }

        assertPermission(context.permissionLevel.level, REQUIRED_LEVEL_TO_UPDATE)

        const guildSettings = await GuildSettingsModel.findOneOrCreate(message.guild!)
        const overrideKey = `${PERMISSION_OVERRIDE}.${user.user.tag}`

        if (reset) {
            await guildSettings.deleteOption(overrideKey)
            return reply(message.author, `> Permission override for ${user.displayName} removed.`)
        }

        await guildSettings.updateOption(overrideKey, level)
        return reply(message.author, `> Permission override for ${user.displayName} set to: \`${level}\``)
    }

    defineArguments(_parser: ThrowingArgumentParser) {
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
            type: NumberRange(0, MAX_OVERRIDE),
            help: `Override the User\'s Permission Level. (0-${MAX_OVERRIDE})`
        })
    }

    static async calculatePermissionLevel(user: User | GuildMember, guild: Guild): Promise<{ level: number, reason: string }> {
        if (!(user instanceof GuildMember)) {
            const _user = guild.member(user)
            if (_user === null) {
                throw new Error(`User "${user.tag}" not in Guild "${guild.name}"!`)
            }
            user = _user
        }

        // Owner
        if (process.env.OWNER_TAG && user.user.tag === process.env.OWNER_TAG) {
            return { level: 10, reason: 'owner' }
        }

        // Override
        const guildSettings = await GuildSettingsModel.findOneOrCreate(guild)
        const overrideKey = `${PERMISSION_OVERRIDE}.${user.user.tag}`
        const overrideValue = guildSettings.getOption(overrideKey, NumberRange(0, MAX_OVERRIDE)) as number | null
        if (overrideValue !== null) {
            return { level: overrideValue, reason: 'override' }
        }

        // Moderator
        const modRoles = guildSettings.getOption(MODERATOR_ROLES, [String]) as string[]
        const modLevel = guildSettings.getOption(MODERATOR_LEVEL, NumberRange(0, MAX_OVERRIDE)) as number
            || DEFAULT_MODERATOR_LEVEL
        if (user.roles.cache.some(r => modRoles.includes(r.name))) {
            return { level: modLevel, reason: 'moderator' }
        }
        return { level: DEFAULT_LEVEL, reason: 'default user' }
    }
}