import * as database from './database/database'
import { LinkLists } from './database/models/links'

(async () => {
    const db = await database.connect()

    console.log('connected')

    let links1 = await LinkLists.findOneOrCreate('guild', 'channel')

    console.log(`initial: ${links1}`)

    await links1.insertLines([
        'Lineappend'
    ], -1)

    console.log(`updated: ${links1}`)

    links1 = await LinkLists.findOneOrCreate('guild', 'channel')

    console.log(`remote:  ${links1}`)

    await database.disconnect()
})()