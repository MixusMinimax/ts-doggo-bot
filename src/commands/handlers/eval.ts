import { spawn } from "child_process";
import { Message } from "discord.js";
import { transpile } from "typescript";
import { GuildSettingsModel } from "../../database/models/settings";
import { takeRange } from "../../tools/array.utils";
import { dlog } from "../../tools/log";
import { combineParagraphs, extractBlocks, reply } from "../../tools/string.utils";
import { NumberRange, ThrowingArgumentParser } from "../../tools/throwingArgparse";
import { Handler, HandlerContext } from "../types";
import { assertPermission } from "./permission";

const PATH_REQUIRED_LEVEL = 'permissions.handlers.eval'
const DEFAULT_REQUIRED_LEVEL = 9

export class EvalHandler extends Handler {

    description = "Run Javascript or Typescript code.";

    async execute(args: { verbose: number, no_execution: boolean, max_console_lines: number }, body: string, message: Message, context: HandlerContext): Promise<string | undefined> {

        args.verbose |= args.no_execution ? 1 : 0

        const settings = await GuildSettingsModel.findOneOrCreate(message.guild!)
        const required = settings.getSingleOption(PATH_REQUIRED_LEVEL, NumberRange(0, 10), DEFAULT_REQUIRED_LEVEL)
        assertPermission(context.permissionLevel.level, required)

        const evalContext = {
            test: 'Hello, World!',
        }

        let codeBlocks = extractBlocks(body).map(e => ({ ...e, language: e.language === 'ts' ? 'ts' : 'js' }))
        dlog('HANDLER.eval.codeBlocks', { codeBlocks })

        let transpiled = codeBlocks.map(block => {
            let code = block.text
            if (block.language === 'ts')
                code = transpile(code)
            return code
        })
        dlog('HANDLER.eval.transpiled', { transpiled })

        let functions = transpiled.map(code => EvalHandler.scopeEval(evalContext, code))

        let debugMessage: string[] = []
        if (args.verbose >= 1)
            debugMessage = debugMessage.concat([
                reply(message),
                'Captured Code Blocks:\n',
                ...codeBlocks.map(e => '```' + `${e.language}\n${e.text.trim()}\n` + '```')
            ])
        if (args.verbose >= 2)
            debugMessage = debugMessage.concat([
                `~~${' '.repeat(64)}~~\n`,
                'Transpiled Code:\n',
                ...transpiled.map(e => '```js\n' + e + '\n```')
            ])

        for (let msg of combineParagraphs(1900, debugMessage)) {
            await message.channel.send(msg)
        }

        if (args.no_execution) return

        await Promise.all(transpiled.map(async code => {

            code = `const func = ${JSON.stringify(code)}`

            let proc = spawn('node', ['-e', code])

            let language = ''
            let consoleOut = ''
            let changed = false
            let done = false

            let depContext = {
                ...evalContext,
                console: {
                    log(...args: any[]) {
                        consoleOut += args.join(' ') + '\n'
                        changed = true
                    },
                    language(l: string) {
                        language = l
                        changed = true
                    },
                    checkTimeout() {
                        if (done) throw new Error()
                    },
                },
            }

            const msg = await message.channel.send(EvalHandler.createMessageContent(language, consoleOut, undefined, args.max_console_lines))

            let _ = (async () => {
                while (!done) {
                    await new Promise(r => setTimeout(r, 350));
                    if (changed) {
                        changed = false
                        await msg.edit(EvalHandler.createMessageContent(language, consoleOut, undefined, args.max_console_lines))
                    }
                }
                console.log('edit')
                await msg.edit(EvalHandler.createMessageContent(language, consoleOut, result, args.max_console_lines))
            })()

            let result = await new Promise((resolve, reject) => {
                (async function () {
                    resolve(await EvalHandler.scopeEval(depContext, code))
                })()
                setTimeout(() => { reject('timeout') }, 1000)
            }).catch(e => 'timeout')
            done = true
        }))

        return
    }

    static createMessageContent(language: string, consoleOut: string, returnValue?: any, maxElements: number = 16) {
        consoleOut = consoleOut.trim() || '...'
        consoleOut = takeRange(consoleOut.split('\n'), -maxElements, maxElements).join('\n')
        let ret = 'Console Output:\n```' + `${language}\n` + consoleOut + '\n```' +
            ((returnValue !== undefined) ? 'Return Value:\n```\n' + `${returnValue}` + '\n```' : '')
        return ret
    }

    static scopeEval(context: object, expr: string) {
        const evaluator = new Function(...[...Object.keys(context), 'expr', '"use strict";return eval(`(async()=>{${expr}})()`)'])
        return evaluator(...[...Object.values(context), expr])
    }

    defineArguments(_parser: ThrowingArgumentParser) {
        _parser.addArgument(['-v', '--verbose'], {
            action: 'count',
            help: 'Specify verbosity',
        })
        _parser.addArgument(['-n', '--no-execution'], {
            action: 'storeTrue',
            help: 'No code execution',
        })
        _parser.addArgument(['-l', '--max-console-lines'], {
            action: 'store',
            type: NumberRange(1, 64),
            defaultValue: 16,
            help: 'Maximum amount of console lines per script',
        })
    }
}