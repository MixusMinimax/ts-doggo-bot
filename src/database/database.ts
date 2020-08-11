import Mongoose = require("mongoose")
import urljoin from "url-join"

let database: Mongoose.Connection

export const connect = async () => {
    const uri: string | undefined = process.env.MONGO_URI
    console.log(`Mongo URI: {${uri}}`)
    if (!uri) {
        console.error('uri not found! make sure to define it in the environment variable "MONGO_URI"!');
        throw new ReferenceError()
    }

    if (!database) {
        await Mongoose.connect(urljoin(uri, 'main'), {
            useNewUrlParser: true,
            useFindAndModify: true,
            useUnifiedTopology: true,
            useCreateIndex: true
        })

        database = Mongoose.connection

        database.once('open', async () => {
            console.log('')
        })

        database.on('error', () => {
            console.error('Error connecting to database')
        })
    }

    return
}

export const disconnect = async (): Promise<void> => {
    if (!database) return
    return await Mongoose.disconnect()
}