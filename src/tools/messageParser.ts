import { Message } from 'discord.js'
import config from '../../config/config.json'
import { tokenize } from './string.utils'


interface ParseReturnType {
    isCommand: boolean,
    clean: string,
    body: string,
    tokens: string[]
}

export default function parse(message: Message): ParseReturnType {

    let clean = message.content.replace('\r\n', '\n').replace('\r', '\n').replace(/^[\s\n]+|[\s\n]+$/g, '')

    const isCommand = clean.startsWith(config.prefix)

    if (isCommand) {
        clean = clean.substring(config.prefix.length).replace(/^\s*/, '')
    }

    let commandLine = clean.match(/(^[^\n]*[^\n\\])(\\\n[^\n]*[^\n\\])*/)?.[0]
    const body = clean.substring(commandLine?.length || 0).replace(/^[\s\n]+/, '')
    commandLine = commandLine?.replace(/\\\n/g, '')

    const tokens = tokenize(commandLine)

    return {
        isCommand,
        clean,
        body,
        tokens
    }
}