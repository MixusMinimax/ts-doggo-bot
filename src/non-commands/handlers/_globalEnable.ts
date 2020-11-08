import { Message } from 'discord.js'
import { dlog } from '../../tools/log'
import { BooleanExact } from '../../tools/throwingArgparse'
import { PromiseOrNot } from '../../tools/types'
import { NonHandler, NonHandlerContext } from '../types'

export class GlobalEnableChecker extends NonHandler {

    name: string = 'globalEnableChecker'

    protected isEnabled() {
        return true
    }

    protected _execute(message: Message, { settings }: NonHandlerContext): PromiseOrNot<boolean> {
        // Check if non-commands are enabled in general
        const enabled = settings.getSingleOption('non-commands.enabled', BooleanExact(), true)
        dlog('NON_HANDLER.enabled', enabled)
        // If not enabled, return true to stop further processing
        return !enabled
    }
}