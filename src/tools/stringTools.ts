import { User } from 'discord.js'

export function tokenize(s: string | undefined): string[] {
    return (
        s?.match(/("(\\"|[^"])*?"|(\\\s|\\,|[^ ,])+)(?=\s|,|$)/g) || []
    ).map(e => e.trim().replace(/^"(.*)"$/, '$1'))
}

export function wordWrap(s: string, {
    max = 128, indent = 0, startOffset = 0, maxLines = 4
}: {
    max?: number, indent?: number, startOffset?: number, maxLines?: number
}): string {

    const words = s.match(/(?:\s+|^)(\S+|\S*$)/g) || []
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
    /** Where to start with the description */
    tab?: number,
    /** How wide the resulting string can be before wrapping */
    maxLength?: number,
    /** Maximum amount of lines for each description */
    maxLines?: number,
    /** String before name */
    prefix?: string,
    /** If the name (including @param delim) is too long, what to do with the description */
    onLongName?: EOnLongName,
    /** If the name needed to be indented, continue that indentation on wrap? */
    keepIndentation?: boolean,
    /** The string to repeat between name and description */
    repeat?: string,
    /** String right after name */
    delim?: string,
    /** Minimal space after name and @param delim, before description */
    minSpace?: number
} = {}): string {

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
        max: maxLength,
        indent: keepIndentation && offset || tab,
        startOffset: offset,
        maxLines
    })

    return result
}

export function reply(user: User, message: string, args: { delim?: string } = {}): string {
    return `<@${user.id}>${args.delim || '\n'}${message}`
}

export function singularPlural(amount: number, singular: string, plural?: string) {
    return amount === 1 && singular || plural || singular + 's'
}

export function onlyUnique<T>(value: T, index: number, self: T[]) {
    return self.indexOf(value) === index
}

export function padStart(maxLength: number, str: string) {
    return (template: TemplateStringsArray, ...vars: any[]) => {
        let ret = ''
        var arr = [...template]
        arr.forEach((a, i) => {
            ret += String(a) + ((vars[i] !== undefined) ? String(vars[i]).padStart(maxLength, str) : '')
        })
        return ret
    }
}