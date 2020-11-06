import { types } from '@typegoose/typegoose'
import { Const } from 'argparse'
import { Guild, GuildMember, Message, TextChannel, User } from 'discord.js'
import { isIdentifier, Type, TypeOfExpression } from 'typescript'
import { GuildSettingsModel } from '../../database/models/settings'
import { dlog } from '../../tools/log'
import { arrayToString, nameDescription, padStart, pager, reply } from '../../tools/string.utils'
import ThrowingArgumentParser, { NumberRange } from '../../tools/throwingArgparse'
import { Indexable } from '../../tools/types'
import { HandlerContext, ParentHandler, SubHandler } from '../types'
import { assertPermission } from './permission'

const PATH_REQUIRED_LEVEL_TO_VIEW = 'permissions.handlers.sessions.view'
const DEFAULT_REQUIRED_LEVEL_TO_VIEW = 5

export class SessionsHandler extends ParentHandler {

    description = 'Manage running sessions'
    defaultSubCommand = 'list'

    constructor(prog: string) {
        super(prog)
        this.subHandlers = {
            list: new SessionsListHandler(prog, 'list')
        }
    }
}

class SessionsListHandler extends SubHandler {

    description = 'List running sessions'

    async execute(
        { page, pageLength }: { page: number, pageLength: number },
        body: string, message: Message, context: HandlerContext
    ): Promise<string> {
        if (message.guild === null) {
            throw new Error('No guild')
        }
        const settings = await GuildSettingsModel.findOneOrCreate(message.guild!)
        const required = settings.getSingleOption(PATH_REQUIRED_LEVEL_TO_VIEW, NumberRange(0, 10), DEFAULT_REQUIRED_LEVEL_TO_VIEW)
        assertPermission(context.permissionLevel.level, required)

        const ids = [...runningSessions.keys()].map(String)

        const paged = pager({
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
    }
}

type TransitionFunctionType = (this: Session, state: string, message: Message) => Promise<string>

class Session {
    readonly id: BigInt
    readonly transition: TransitionFunctionType
    readonly onCancel?: (this: Session, message: Message) => Promise<void> | void
    readonly onLeave?: (this: Session, message: Message) => Promise<void> | void
    private state: string
    readonly allowedGuilds: Set<string>
    readonly allowedGuildsFilter: 'whitelist' | 'blacklist'
    readonly joinedUsers: Map<string, JoinIdentifier>

    name: string
    description: string

    constructor(
        args: {
            id: BigInt,
            transition: TransitionFunctionType,
            initialState: string,
            allowedGuilds?: Set<string>,
            allowedGuildsFilter?: 'whitelist' | 'blacklist',
            onCancel?: (this: Session, message: Message) => Promise<void> | void,
            onLeave?: (this: Session, message: Message) => Promise<void> | void,

            name: string,
            description: string,
        }
    ) {
        this.id = args.id
        this.transition = args.transition
        this.state = args.initialState
        if (args.allowedGuilds === undefined) {
            this.allowedGuilds = new Set()
            this.allowedGuildsFilter = args.allowedGuildsFilter || 'blacklist'
        } else {
            this.allowedGuilds = args.allowedGuilds
            this.allowedGuildsFilter = args.allowedGuildsFilter || 'whitelist'
        }
        this.joinedUsers = new Map()
        this.onCancel = args.onCancel
        this.onLeave = args.onLeave

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
            await this.onLeave?.(message)
            return
        }
        this.state = await this.transition(this.state, message)
    }

    private async stop() {
        [...this.joinedUsers.values()].forEach(identifer => {
            try {
                leaveSession(identifer, this.id)
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
    user: User
}

export function createSession(
    guild: Guild,
    args: {
        transition: TransitionFunctionType,
        initialState: string,
        allowedGuilds?: Set<string>,
        allowedGuildsFilter?: 'whitelist' | 'blacklist',
        onCancel?: (this: Session, message: Message) => Promise<void> | void,
        onLeave?: (this: Session, message: Message) => Promise<void> | void,

        name: string,
        description: string,
    }
) {
    lastId++
    const newSession = new Session({
        id: lastId,
        transition: args.transition,
        initialState: args.initialState,
        allowedGuilds: args.allowedGuilds || new Set(guild.id),
        allowedGuildsFilter: args.allowedGuildsFilter,
        onCancel: args.onCancel,
        onLeave: args.onLeave,

        name: args.name,
        description: args.description,
    })
    runningSessions.set(lastId, newSession)
    return newSession.id
}

export function identifierFromMessage(message: Message): JoinIdentifier {
    if (message.guild === null) {
        throw new Error('no guild')
    }
    return {
        guild: message.guild,
        channel: message.channel as TextChannel,
        user: message.author
    }
}

export function joinKeyToString(identifier: JoinIdentifier) {
    return `${identifier.guild.id}.${identifier.channel.id}.${identifier.user.id}`
}

export function joinSession(identifier: JoinIdentifier, id: BigInt) {
    if (!runningSessions.has(id)) {
        throw new Error(`Invalid ID: ${id}`)
    }
    const key = joinKeyToString(identifier)
    if (joinedSessions.has(key)) {
        throw new Error(`Already in Session ${joinedSessions.get(key)}`)
    }
    joinedSessions.set(key, id)
    const session = runningSessions.get(id)!
    session.joinedUsers.set(key, identifier)
}

export function leaveSession(identifier: JoinIdentifier, id: BigInt) {
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
}

export async function maybeHandleMessage(message: Message) {
    const identifier = identifierFromMessage(message)
    const key = joinKeyToString(identifier)
    const id = joinedSessions.get(key)
    console.log({ id, key })
    if (id !== undefined) {
        const session = runningSessions.get(id)
        if (session !== undefined) {
            await session.handleMessage(message)
        }
    }
}