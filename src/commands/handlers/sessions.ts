import { types } from '@typegoose/typegoose'
import { Const } from 'argparse'
import { Guild, GuildMember, Message, MessageEmbed, TextChannel, User } from 'discord.js'
import { join } from 'path'
import { isIdentifier, Type, TypeOfExpression } from 'typescript'
import { GuildSettingsModel } from '../../database/models/settings'
import { findMembers, tryFindMember } from '../../tools/discord.utils'
import { dlog } from '../../tools/log'
import { arrayToString, nameDescription, padStart, pager, reply } from '../../tools/string.utils'
import ThrowingArgumentParser, { NumberRange } from '../../tools/throwingArgparse'
import { checkPermission, FilterType, Indexable, PromiseOrNot } from '../../tools/types'
import { HandlerContext, ParentHandler, SubHandler } from '../types'
import { assertPermission, PermissionHandler } from './permission'

const PATH_REQUIRED_LEVEL_TO_VIEW = 'permissions.handlers.sessions.view'
const DEFAULT_REQUIRED_LEVEL_TO_VIEW = 5

export class SessionsHandler extends ParentHandler {

    description = 'Manage running sessions'
    defaultSubCommand = 'show'

    constructor(prog: string) {
        super(prog)
        this.subHandlers = {
            show: new SessionsShowHandler(prog, 'show')
        }
    }
}

class SessionsShowHandler extends SubHandler {

    description = 'List running sessions'

    async execute(
        { page, pageLength, searchTerm }: { page: number, pageLength: number, searchTerm?: string },
        body: string, message: Message, context: HandlerContext
    ): Promise<string | void> {
        if (message.guild === null) {
            throw new Error('No guild')
        }
        const settings = await GuildSettingsModel.findOneOrCreate(message.guild!)
        const required = settings.getSingleOption(PATH_REQUIRED_LEVEL_TO_VIEW, NumberRange(0, 10), DEFAULT_REQUIRED_LEVEL_TO_VIEW)
        assertPermission(context.permissionLevel.level, required)

        let ids = [...runningSessions.keys()].map(String)

        const _pager = () => pager({
            keys: ids,
            getter: (key) => runningSessions.get(BigInt(key))!,
            page,
            pageLength,
            formatter: (
                key: { key: string, similarity?: number }, value: Session
            ) => nameDescription(`${value.name} (${key.key})`, value.description, {
                tab: 25,
                delim: ':',
                maxLength: 128,
                prefix: '  ',
                maxLines: 8
            })
        })

        let paged: ReturnType<typeof _pager>

        if (searchTerm) {
            const members = findMembers(message.guild, searchTerm, { useDisplayName: false })
            if (members.length) {
                const { member } = members[0]
                ids = [...joinedSessions.keys()]
                    .filter(e => e.endsWith(member.id))

                let x
                paged = pager({
                    keys: ids,
                    getter: (key) => runningSessions.get(joinedSessions.get(key)!)!,
                    page,
                    pageLength,
                    formatter: (
                        key: { key: string, similarity?: number }, value: Session
                    ) => nameDescription(
                        (
                            x = key.key.match(/^(?<guild>.+)\.(?<channel>.+)\..+$/),
                            `Guild: ${x?.groups?.guild!}, Channel: ${x?.groups?.channel!}`
                        ),
                        `${value.name} (${value.id})\n`,
                        {
                            tab: 4,
                            delim: ':',
                            maxLength: 128,
                            prefix: '',
                            maxLines: 8
                        }
                    )
                })

                if (!paged.lineCount) {
                    if (page === 1) {
                        return reply(message, '> No running sessions for this Guild!')
                    } else {
                        return reply(message, `> No running sessions for this Guild on page \`${page}\``)
                    }
                }

                return reply(message, paged.pagedMessage)
            }
        }

        paged = _pager()

        if (!paged.lineCount) {
            if (page === 1) {
                return reply(message, '> No running sessions for this Guild!')
            } else {
                return reply(message, `> No running sessions for this Guild on page \`${page}\``)
            }
        }

        return reply(message, paged.pagedMessage)
    }

    defineArguments(_parser: ThrowingArgumentParser) {
        _parser.addArgument(['-p', '--page'], {
            defaultValue: 1,
            type: NumberRange(1),
            help: 'What page of sessions to show.'
        })
        _parser.addArgument(['-l', '--length'], {
            defaultValue: 16,
            type: NumberRange(1, 64),
            dest: 'pageLength',
            help: 'How many sessions per page to show.'
        })
        _parser.addArgument('searchTerm', {
            nargs: Const.OPTIONAL,
            help: 'Search for names, users, or give more information for an id'
        })
    }
}

type TransitionFunctionType = (this: Session, state: string, message: Message) => Promise<string>

type SessionArgs = {
    id: BigInt,
    initialState: string,
    allowedUsers?: Set<string>,
    allowedUsersFilterType?: FilterType,
    allowedGuilds?: Set<string>,
    allowedGuildsFilterType?: FilterType,
    requiredPermissionLevel?: number,

    transition: TransitionFunctionType,
    onStart?: (this: Session, message: Message) => PromiseOrNot<void>,
    onCancel?: (this: Session, message: Message) => PromiseOrNot<void>,
    onJoin?: (this: Session, message: Message) => PromiseOrNot<void>,
    onLeave?: (this: Session, message: Message) => PromiseOrNot<void>,

    name: string,
    description: string,
}

class Session {
    readonly id: BigInt
    readonly transition: TransitionFunctionType
    readonly onStart?: (this: Session, message: Message) => Promise<void> | void
    readonly onCancel?: (this: Session, message: Message) => Promise<void> | void
    readonly onJoin?: (this: Session, message: Message) => Promise<void> | void
    readonly onLeave?: (this: Session, message: Message) => Promise<void> | void
    private state: string
    readonly allowedUsers: Set<string>
    readonly allowedUsersFilterType: FilterType
    readonly allowedGuilds: Set<string>
    readonly allowedGuildsFilterType: FilterType
    readonly joinedUsers: Map<string, JoinIdentifier>
    readonly requiredPermissionLevel: number

    name: string
    description: string

    constructor(
        args: SessionArgs
    ) {
        this.id = args.id
        this.transition = args.transition
        this.state = args.initialState
        if (args.allowedUsers === undefined) {
            this.allowedUsers = new Set()
            this.allowedUsersFilterType = args.allowedUsersFilterType || 'blacklist'
        } else {
            this.allowedUsers = args.allowedUsers
            this.allowedUsersFilterType = args.allowedUsersFilterType || 'whitelist'
        }
        if (args.allowedGuilds === undefined) {
            this.allowedGuilds = new Set()
            this.allowedGuildsFilterType = args.allowedGuildsFilterType || 'blacklist'
        } else {
            this.allowedGuilds = args.allowedGuilds
            this.allowedGuildsFilterType = args.allowedGuildsFilterType || 'whitelist'
        }
        this.joinedUsers = new Map()
        this.onStart = args.onStart
        this.onCancel = args.onCancel
        this.onJoin = args.onJoin
        this.onLeave = args.onLeave
        this.requiredPermissionLevel = args.requiredPermissionLevel || 0

        this.name = args.name
        this.description = args.description
    }

    async handleMessage(message: Message): Promise<void> {
        const content = message.content.toLowerCase().trim()
        if (content === 'stop') {
            await this.cancel(message)
            return
        }
        if (content === 'leave') {
            leaveSession(identifierFromMessage(message), this.id)
            return
        }
        this.state = await this.transition(this.state, message)
    }

    private async stop() {
        [...this.joinedUsers.values()].forEach(identifier => {
            try {
                leaveSession(
                    (identifier = { ...identifier }, identifier.message = undefined, identifier),
                    this.id
                )
            } catch (e) {
                dlog('SESSIONS.stop', e)
            }
        })
        runningSessions.delete(this.id)
    }

    async cancel(message: Message) {
        await this.onCancel?.(message)
        await this.stop()
    }
}

/**
 * Maps id to Session
 */
const runningSessions = new Map<BigInt, Session>()
let lastId = BigInt(-1)

/**
 * Maps user to Session id
 */
const joinedSessions = new Map<string, BigInt>()

interface JoinIdentifier {
    guild: Guild,
    channel: TextChannel,
    user: User,
    message?: Message
}

export async function createSession(
    message: Message,
    args: Omit<SessionArgs, 'id'>
) {
    lastId++
    const newSession = new Session({
        ...args,
        id: lastId,
        allowedGuilds: args.allowedGuilds || new Set([message.guild!.id]),
    })
    runningSessions.set(lastId, newSession)

    await newSession.onStart?.(message)

    return newSession.id
}

export function identifierFromMessage(message: Message): JoinIdentifier {
    if (message.guild === null) {
        throw new Error('no guild')
    }
    return {
        guild: message.guild,
        channel: message.channel as TextChannel,
        user: message.author,
        message
    }
}

export function joinKeyToString(identifier: JoinIdentifier) {
    return `${identifier.guild.id}.${identifier.channel.id}.${identifier.user.id}`
}

export async function joinSession(message: Message, id: BigInt, permissionLevel: number) {
    const identifier = identifierFromMessage(message)
    if (!runningSessions.has(id)) {
        throw new Error(`Invalid ID: ${id}`)
    }
    const key = joinKeyToString(identifier)
    if (joinedSessions.has(key)) {
        throw new Error(`Already in Session ${joinedSessions.get(key)}`)
    }
    const session = runningSessions.get(id)!

    checkPermission(
        session.requiredPermissionLevel,
        permissionLevel
    )

    if (
        (session.allowedUsersFilterType === 'whitelist' &&
            !session.allowedUsers.has(identifier.user.id)) ||
        (session.allowedUsersFilterType === 'blacklist' &&
            session.allowedUsers.has(identifier.user.id))
    ) {
        throw new Error(`Not allowed to join this Session!`)
    }


    joinedSessions.set(key, id)
    if (identifier.message) {
        await session.onJoin?.(identifier.message)
    }
    session.joinedUsers.set(key, identifier)
}

export async function leaveSession(identifier: JoinIdentifier, id: BigInt) {
    if (!runningSessions.has(id)) {
        throw new Error(`Invalid ID: ${id}`)
    }
    const key = joinKeyToString(identifier)
    if (joinedSessions.get(key) !== id) {
        throw new Error(`Not Session ${id}`)
    }
    joinedSessions.delete(key)
    const session = runningSessions.get(id)!
    session.joinedUsers.delete(key)
    if (identifier.message) {
        await session.onLeave?.(identifier.message)
    }
    session.joinedUsers.delete(key)
}

/**
 * @returns true if further processing should be stopped
 */
export async function maybeHandleMessage(message: Message) {
    const identifier = identifierFromMessage(message)
    const key = joinKeyToString(identifier)
    const id = joinedSessions.get(key)
    if (id !== undefined) {
        const session = runningSessions.get(id)
        if (session !== undefined) {
            await session.handleMessage(message)
            return true
        }
    }
    return false
}