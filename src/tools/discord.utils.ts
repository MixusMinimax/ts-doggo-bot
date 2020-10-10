import { Guild, GuildMember, User } from 'discord.js'
import stringSimilarity from 'string-similarity'
import { dlog } from './log'
import { ClearTextError } from './types'

export class UserNotFoundException extends ClearTextError {

}

export function tryFindMember(guild: Guild, searchTerm: string): GuildMember | never {

    const { member, certainty } = findMember(guild, searchTerm)
    if (member === null || certainty < 1e-3) {
        throw new UserNotFoundException(`User not found: \`${searchTerm}\``)
    }
    else if (certainty < 0.5) {
        throw new UserNotFoundException(
            `I'm ${Math.floor(certainty * 100)}% sure you mean ${member.toString()}.\n` +
            'I need to be at least 50% sure to take action!'
        )
    }
    return member
}

export function findMember(guild: Guild, searchTerm: string): { member: GuildMember | null, certainty: number } {
    dlog('UTILS.discord', `Searching for: "${searchTerm}"`)
    let res
    let member
    if (res = searchTerm.match(/^<@!?(\d+)>/)) {
        searchTerm = res[1]
        dlog('UTILS.discord', 'mention, id:', searchTerm)
    }
    if (searchTerm.match(/^[0-9]+$/)) {
        dlog('UTILS.discord', 'id')
        member = guild.members.cache.find((_member, key) => key === searchTerm)
        return member ?
            { member, certainty: 1 } :
            { member: null, certainty: 0 }
    }
    if (searchTerm.match(/^\w+#\d{4}$/)) {
        dlog('UTILS.discord', 'tag')
        member = guild.members.cache.find((member) => member.user.tag === searchTerm)
        return member ?
            { member, certainty: 1 } :
            { member: null, certainty: 0 }
    }
    const match = stringSimilarity.findBestMatch(searchTerm, guild.members.cache.map(e => e.displayName)).bestMatch
    member = guild.members.cache.find(e => e.displayName === match.target) || null
    return { member, certainty: match.rating }
}