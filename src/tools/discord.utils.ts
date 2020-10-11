import { Guild, GuildMember, User } from 'discord.js'
import stringSimilarity from 'string-similarity'
import { dlog } from './log'
import { ClearTextError } from './types'

export class UserNotFoundException extends ClearTextError {

}

export function tryFindMember(guild: Guild, searchTerm: string, minCertainty: number = 0.5): GuildMember | never {

    const { member, certainty } = findMember(guild, searchTerm)
    if (member === null || certainty < 1e-3) {
        throw new UserNotFoundException(`User not found: \`${searchTerm}\``)
    }
    else if (certainty < minCertainty) {
        throw new UserNotFoundException(
            `I'm ${Math.floor(certainty * 100)}% sure you mean ${member.toString()}.\n` +
            `I need to be at least ${Math.ceil(minCertainty * 100)}% sure to take action!`
        )
    }
    return member
}

export function findMember(guild: Guild, searchTerm: string): { member: GuildMember | null, certainty: number } {
    const results = findMembers(guild, searchTerm, { maxResults: 1, minCertainty: 0 })
    if (results.length) {
        return results[0]
    } else {
        return { member: null, certainty: 0 }
    }
}

export function findMembers(
    guild: Guild, searchTerm: string,
    { maxResults = 10, minCertainty = 0.5 }: { maxResults?: number, minCertainty?: number } = {}
): { member: GuildMember, certainty: number }[] {
    dlog('UTILS.discord', `Searching for: "${searchTerm}"`)
    let res
    if (res = searchTerm.match(/^<@!?(\d+)>/)) {
        searchTerm = res[1]
        dlog('UTILS.discord', 'mention, id:', searchTerm)
    }
    if (searchTerm.match(/^[0-9]+$/)) {
        dlog('UTILS.discord', 'id')
        let member = guild.members.cache.find((_member, key) => key === searchTerm)
        if (member) {
            return [{ member, certainty: 1 }]
        } else {
            return []
        }
    }
    else if (searchTerm.match(/^\w+#\d{4}$/)) {
        dlog('UTILS.discord', 'tag')
        let member = guild.members.cache.find((member) => member.user.tag === searchTerm)
        if (member) {
            return [{ member, certainty: 1 }]
        } else {
            return []
        }
    }
    return stringSimilarity
        .findBestMatch(searchTerm, guild.members.cache.map(e => e.displayName))
        .ratings
        .slice(0, maxResults)
        .map(match => ({
            member: (guild.members.cache.find(e => e.displayName === match.target) || null)!,
            certainty: match.rating
        }))
        .filter(result => result.member && result.certainty >= minCertainty)
}