import { expect } from 'chai'
import * as database from '../src/database/database'
import { LinkLists } from '../src/database/models/links'

describe('LinkLists', function () {
    before(database.connect)
    after(database.disconnect)

    describe('#findOneOrCreate()', function () {
        it('should return an existing document', async function () {
            const links = await LinkLists.findOneOrCreate('guild', 'channel')
            expect(links).not.to.be.null
            expect(links).to.have.property('guild', 'guild')
            expect(links).to.have.property('channel', 'channel')
            expect(links).to.have.property('lines')
            console.log('      Lines:')
            console.log(links.lines.map(l => `        - "${l}"`).join('\n'))
        })
    })
})