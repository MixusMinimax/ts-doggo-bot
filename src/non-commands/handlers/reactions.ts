import { Message } from 'discord.js'
import { NonHandler, NonHandlerContext } from '../types'

export class Reactions extends NonHandler {

    name = 'reactions'

    protected async _execute(message: Message, _context: NonHandlerContext): Promise<boolean> {

        if (message.content.toLowerCase().includes('good boi')) {
            const emoji = message.guild!.emojis.cache.find(x => x.name === 'goodboi')
            if (emoji != null)
                message.react(emoji)
            else
                console.error('Emoji "goodboi" not found!')
        }
        else if (message.content.toLowerCase().includes('bad boi')) {
            const emoji = message.guild!.emojis.cache.find(x => x.name === 'angeryboi')
            if (emoji != null)
                message.react(emoji)
            else
                console.error('Emoji "angeryboi" not found!')
        }
        else if (message.content.toLowerCase().includes('boi')) {
            const emoji = message.guild!.emojis.cache.find(x => x.name === 'boiiiiii')
            if (emoji != null)
                message.react(emoji)
            else
                console.error('Emoji "boiiiiii" not found!')
        }
        else if (message.content.toLowerCase().match(/(?:^|\W)(?:sus|amon?gus|among us|impost[oe]r)(?:$|\W)|^(?:\w+\W)?\w*sus(?:\W\w+\W?)?$/)) {
            const emoji = message.guild!.emojis.cache.find(x => x.name === 'amogus')
            if (emoji != null)
                message.react(emoji)
            else
                console.error('Emoji "amogus" not found!')
        }

        // Don't stop processing
        return false
    }
}