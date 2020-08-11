import { Message, Guild, Channel } from 'discord.js'
import { tokenize } from './stringTools'
import { ISimpleMessage } from './types'
import config from '../../config/config.json'


interface parseReturnType {
    isCommand: boolean,
    clean: string,
    body: string,
    tokens: string[]
}

export default function parse(message: ISimpleMessage): parseReturnType {

    let clean = message.content.replace('\r\n', '\n').replace('\r', '\n').replace(/^[\s\n]+|[\s\n]+$/g, '')

    let isCommand = false

    if (isCommand = clean.startsWith(config.prefix)) {
        clean = clean.substring(config.prefix.length).replace(/^\s*/, '')
    }

    let commandLine = clean.match(/(^[^\n]*[^\n\\])(\\\n[^\n]*[^\n\\])*/)?.[0]
    let body = clean.substring(commandLine?.length || 0).replace(/^[\s\n]+/, '')
    commandLine = commandLine?.replace(/\\\n/g, '')

    let tokens = tokenize(commandLine)

    return {
        isCommand,
        clean,
        body,
        tokens
    }
}