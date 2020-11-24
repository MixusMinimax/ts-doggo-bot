import { Message } from 'discord.js'
import { dlog } from '../tools/log'
import { RandomImage } from './handlers/randomImage'
import { Reactions } from './handlers/reactions'
import { GlobalEnableChecker } from './handlers/_globalEnable'
import { NonHandler } from './types'

const nonHandlers: NonHandler[] = [
    new GlobalEnableChecker(),
    new Reactions(),
    new RandomImage('doggo'),
    new RandomImage('python-plotter'),
]

export async function handleMessage(message: Message) {
    for (const nonHandler of nonHandlers) {
        try {
            dlog('NON_HANDLER.execute', `Executing '${nonHandler.name}'`)
            const shouldStop = await nonHandler.execute(message)
            dlog('NON_HANDLER.shouldStop', shouldStop)
            if (shouldStop) {
                break
            }
        } catch (e) {
            console.error(e)
        }
    }
}