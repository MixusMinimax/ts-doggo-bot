import { Message } from 'discord.js'
import { findMembers } from '../tools/discord.utils'
import { padStart } from '../tools/stringTools'
import ThrowingArgumentParser, { NumberRange } from '../tools/throwingArgparse'
import { Handler, HandlerOptions } from './handler.type'

export class SearchMemberHandler extends Handler {

    async execute(
        { user: user, limit }: { user: string, limit: number },
        body: string, message: Message, options: HandlerOptions
    ): Promise<string> {
        const results = findMembers(message.guild!, user, {
            maxResults: limit,
            minCertainty: 0
        })
        if (results.length) {
            return `> Found \`${results.length}\` Members:\n` +
                results
                    .map(result =>
                        padStart(2, '0')`\`[${Math.round(result.certainty * 100)}%]\` ` +
                        `${result.member.toString()}`
                    )
                    .join('\n')
        } else {
            return `> No Members found!`
        }
    }

    get parser() {
        const _parser = new ThrowingArgumentParser({
            prog: this.prog,
            description: 'Search for Guild Members'
        })
        _parser.addArgument(['-l', '--limit'], {
            defaultValue: 10,
            type: NumberRange(1, 50),
            metavar: 'N',
            help: 'Limit the amount of results'
        })
        _parser.addArgument(['-c', '--min-certainty'], {
            defaultValue: 0,
            type: NumberRange(0, 1),
            metavar: 'N',
            help: 'Only show results with a certainty of at least N (0-1)'
        })
        _parser.addArgument('user', {
            type: String,
            help: 'Search term'
        })
        return _parser
    }
}