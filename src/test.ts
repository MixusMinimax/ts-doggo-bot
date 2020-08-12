import * as database from './database/database'
import Links from './database/models/links.model'

(async () => {
    const db = await database.connect()

    console.log("connected")

    var links1 = await Links.findOneOrCreate('guild', 'channel')

    console.log(`initial: ${links1}`)

    await links1.insertLines([
        "Lineappend"
    ], -1)

    console.log(`updated: ${links1}`)

    links1 = await Links.findOneOrCreate('guild', 'channel')

    console.log(`remote:  ${links1}`)

    await database.disconnect()
})()