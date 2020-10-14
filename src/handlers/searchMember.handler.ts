import { Message } from 'discord.js'
import { findMembers } from '../tools/discord.utils'
import { padStart } from '../tools/stringTools'
import ThrowingArgumentParser, { NumberRange } from '../tools/throwingArgparse'
import { Handler, HandlerContext } from './handler.type'

export class SearchMemberHandler extends Handler {

    description = 'Search for Guild Members'

    async execute(
        {
            user: user, limit, minCertainty, mentions
        }: {
            user: string, limit: number, minCertainty: number, mentions: boolean
        },
        body: string, message: Message, _context: HandlerContext
    ): Promise<string> {
        const results = findMembers(message.guild!, user, {
            maxResults: limit,
            minCertainty
        })
        if (results.length) {
            return `> Found \`${results.length}\` Members:\n` +
                results
                    .map(result =>
                        padStart(2, '0')`\`[${Math.round(result.certainty * 100)}%]\` ` +
                        `${mentions ? result.member.toString() : result.member.displayName}`
                    )
                    .join('\n')
        } else {
            return `> No Members found!`
        }
    }

    defineArguments(_parser: ThrowingArgumentParser) {
        _parser.addArgument(['-l', '--limit'], {
            defaultValue: 10,
            type: NumberRange(1, 50),
            metavar: 'N',
            help: 'Limit the amount of results'
        })
        _parser.addArgument(['-c', '--min-certainty'], {
            defaultValue: 1e-3,
            type: NumberRange(0, 1),
            metavar: 'N',
            dest: 'minCertainty',
            help: 'Only show results with a certainty of at least N (0-1)'
        })
        _parser.addArgument(['-m', '--mentions'], {
            action: 'storeTrue',
            dest: 'mentions',
            help: 'Use mentions for search results'
        })
        _parser.addArgument('user', {
            type: String,
            help: 'Search term'
        })
        return _parser
    }
}