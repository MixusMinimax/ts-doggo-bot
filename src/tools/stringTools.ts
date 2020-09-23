import { User } from 'discord.js'

export function tokenize(s: string | undefined): string[] {
    return (
        s?.match(/"(\\"|[^"])*"|'(\\'|[^'])*'|`.*`|(\\ |\S)+/g) || []
    ).map(token =>
        token.match(/"(\\"|[^"])*"|'(\\'|[^'])*'/)
        && eval(token)
        || token
    )
}

export function wordWrap(s: string, {
    max = 128, indent = 0, startOffset = 0, maxLines = 4
}: {
    max?: number, indent?: number, startOffset?: number, maxLines?: number
}): string {

    const words = s.match(/\w+([^\w]+|[^\w]*$)/g) || []
    let result = ''
    let offset = startOffset
    const newLine = '\n' + ' '.repeat(indent)
    let currentLine = 0

    outer: for (const word of words) {
        const remaining = max - offset
        while (true) {
            if (word.trimRight().length <= remaining) {
                result += word
                offset += word.length
                break
            } else {
                if (offset === 0) {
                    // word doesn't fit in line, must be cut
                    const iterations = Math.ceil(word.length / max)
                    for (let i = 0; i < iterations; ++i) {
                        result += word.substring(i * max, (i + 1) * max)
                        if (i < iterations - 1) {
                            ++currentLine
                            if (currentLine >= maxLines)
                                break outer
                            result += newLine
                        }
                        offset = word.length % max
                    }
                    break
                } else {
                    result = result.trimRight()
                    ++currentLine
                    if (currentLine >= maxLines)
                        break outer
                    result += newLine
                    offset = 0
                }
            }
        }
    }
    return result
}

export enum EOnLongName {
    NEXT_LINE, CUT_NAME, INDENT
}

export function nameDescription(name: string, description: string, {
    tab = 16,
    maxLength = 128,
    maxLines = 4,
    prefix = '',
    onLongName = EOnLongName.NEXT_LINE,
    keepIndentation = false,
    repeat = ' ',
    delim = ':',
    minSpace = 2
}: {
    tab?: number,
    maxLength?: number,
    maxLines?: number,
    prefix?: string,
    onLongName?: EOnLongName,
    keepIndentation?: boolean,
    repeat?: string,
    delim?: string,
    minSpace?: number
}): string {

    if (prefix.length + delim.length + minSpace > tab) {
        throw new Error('tab too small')
    }

    name = prefix + name

    // cut name if too long and onLongName is CUT_NAME
    if (onLongName === EOnLongName.CUT_NAME) {
        name = name.substring(0, tab - minSpace - delim.length)
    }

    const length = name.length + delim.length
    const padding = Math.max(minSpace, tab - length)

    let result = name + delim + repeat.repeat(length + padding).substr(length, padding)
    let offset = result.length


    // resolve too long name
    if (result.length > tab) {
        switch (onLongName) {
            case EOnLongName.NEXT_LINE:
                result = name + delim + '\n' + repeat.repeat(tab).substring(0, tab)
                offset = tab
                break
        }
    }

    // Word-Wrap description
    result += wordWrap(description, {
        max: maxLength - tab,
        indent: keepIndentation && offset || tab,
        startOffset: offset,
        maxLines
    })

    return result
}

export function reply(user: User, message: string, args: { delim?: string } = {}): string {
    return `<@${user.id}>${args.delim || '\n'}${message}`
}

export function parseList<T>(parseElement: (element: string) => T, s: string): T[] {
    let x: string = s
    x = x.match(/\(([^()]+)\)/)?.[1] || x
    x = x.match(/\[([^()]+)\]/)?.[1] || x
    x = x.trim().replace(/^,*|,*$/, '')
    const tokens = x.split(/ *, *| +/).map(e => e.trim()).filter(e => e)
    return tokens.map(parseElement)
}

export function singularPlural(amount: number, singular: string, plural?: string) {
    return amount === 1 && singular || plural || singular + 's'
}

export function onlyUnique<T>(value: T, index: number, self: T[]) {
    return self.indexOf(value) === index
}
