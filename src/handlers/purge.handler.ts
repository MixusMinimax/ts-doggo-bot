
import { Const } from 'argparse'
import { Message } from 'discord.js'
import ThrowingArgumentParser from '../tools/throwingArgparse'
import { Handler, HandlerOptions } from './handler.type'

export class PurgeHandler extends Handler {

    async execute({ amount }: { amount?: number }, _body: string, message: Message, _options: HandlerOptions): Promise<void> {

        if (!amount || amount < 1 || amount > 100) {
            message.reply('Please provide a number between 1 and 100 for the number of messages to delete')
        } else {
            const fetched = await message.channel.messages.fetch({ limit: amount + 1 })
            message.channel.bulkDelete(fetched)
                .catch(error => message.reply(`Couldn't delete messages because of: ${error}`))
        }
    }

    get parser() {
        const _parser = new ThrowingArgumentParser({
            prog: this.prog,
            description: 'Bulk-delete messages'
        })
        _parser.addArgument('amount', {
            nargs: Const.OPTIONAL,
            type: Number,
            help: 'How many messages to delete, excluding the command itself'
        })
        return _parser
    }
}
