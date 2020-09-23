import ThrowingArgumentParser from '../tools/throwingArgparse'
import { ISimpleMessage } from '../tools/types'
import { Handler, HandlerOptions } from './handler.type'
import config from '../../config/config.json'
import package_json from '../../package.json'
import { MessageEmbed } from 'discord.js'

export class InfoHandler extends Handler {

    async execute(args: any, body: string, message: ISimpleMessage, options: HandlerOptions): Promise<void> {
        const embed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle(config.info.name)
            .setURL(config.info.url)
            .setAuthor(config.info.author.name, config.info.author.icon, config.info.author.url)
            .setDescription(`Version ${package_json.version}`)
            .addField('Description', config.info.description)
            .setImage('https://cdn.discordapp.com/avatars/642869958635683851/780e2ba65003b8f8538c93bf7d8d431b.png?size=128')
            .setTimestamp()
        message.channel.send(embed)
    }

    get parser() {
        const _parser = new ThrowingArgumentParser({
            prog: this.prog,
            description: 'Print info'
        })
        return _parser
    }
}