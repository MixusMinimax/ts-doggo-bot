import { types } from '@typegoose/typegoose'
import { Message } from 'discord.js'
import { Type, TypeOfExpression } from 'typescript'
import { HandlerContext, ParentHandler, SubHandler } from '../types'

export class SessionHandler extends ParentHandler {

    description = 'Manage running sessions'
    defaultSubCommand = 'list'

    constructor(prog: string) {
        super(prog)
        this.subHandlers = {
            list: new SessionListHandler(prog, 'list')
        }
    }
}

class SessionListHandler extends SubHandler {

    description = 'List running sessions'

    execute(args: any, body: string, message: Message, context: HandlerContext): Promise<string | void> {
        throw new Error('Method not implemented.')
    }
}

const FINISHED = Symbol('finished')
type State = symbol
type TransitionFunctionType = (this: Session, message: Message) => Promise<void>

class Session {
    readonly id: string
    readonly transition: TransitionFunctionType
    private state: State

    constructor(
        args: {
            id: string,
            transition: TransitionFunctionType,
            initialState: State
        }
    ) {
        this.id = args.id
        this.transition = args.transition
        this.state = args.initialState
    }

    handleMessage(message: Message): Promise<void> {
        return this.transition(message)
    }
}

/**
 * Maps id to Session
 */
const runningSessions = new Map<string, Session>()
