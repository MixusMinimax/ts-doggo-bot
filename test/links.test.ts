import { mongoose } from '@typegoose/typegoose'
import { expect } from 'chai'
import * as database from '../src/database'
import { LinkLists } from '../src/database/models/links'

async function getLinksFresh() {
    delete mongoose.models.LinkLists
    delete mongoose.connection.collections.links
    return await LinkLists.findOneOrCreate('guild', 'channel')
}

describe('LinkLists', function () {
    before(database.connect)
    after(database.disconnect)

    describe('#findOneOrCreate()', function () {
        const initial = [...Array(10).keys()].map(i => `Line${i}`)
        beforeEach(async function () {
            const links = await getLinksFresh()
            links.lines = [...initial]
            await links.save()
        })

        it('should return an existing document', async function () {
            const links = await getLinksFresh()
            expect(links).not.to.be.null
            expect(links).to.have.property('guild', 'guild')
            expect(links).to.have.property('channel', 'channel')
            expect(links).to.have.property('lines')
            console.log('      Lines:')
            console.log(links.lines.map(l => `        - "${l}"`).join('\n'))
        })
    })

    describe('#insertLines', function () {
        const initial = ['Line2', 'Line3', 'Line7']
        beforeEach(async function () {
            const links = await getLinksFresh()
            links.lines = [...initial]
            await links.save()
        })

        it('should append to the end', async function () {
            let links = await getLinksFresh()
            const added: string[] = ['Line8', 'Line9']
            const result = await links.insertLines(added, -1)
            links = await getLinksFresh()
            expect(links).to.have.property('lines').which.eqls([...initial, ...added])
            expect(result).to.have.property('addedLines').which.eqls(added)
        })

        it('should prepend at the beginning', async function () {
            let links = await getLinksFresh()
            const added: string[] = ['Line0', 'Line1']
            const result = await links.insertLines(added, 0)
            links = await getLinksFresh()
            expect(links).to.have.property('lines').which.eqls([...added, ...initial])
            expect(result).to.have.property('addedLines').which.eqls(added)
        })

        it('should insert at index', async function () {
            let links = await getLinksFresh()
            const added: string[] = ['Line4', 'Line5', 'Line6']
            const at = 2
            const result = await links.insertLines(added, at)
            links = await getLinksFresh()
            const initialCopy = [...initial]
            expect(links).to.have.property('lines').which.eqls([...initialCopy.splice(0, at), ...added, ...initialCopy])
            expect(result).to.have.property('addedLines').which.eqls(added)
        })
    })

    describe('#removeLines', function () {
        const initial = [...Array(10).keys()].map(i => `Line${i}`)
        beforeEach(async function () {
            const links = await getLinksFresh()
            links.lines = [...initial]
            await links.save()
        })

        it('should remove all', async function () {
            let links = await getLinksFresh()
            const result = await links.removeLines([...initial.keys()])
            links = await getLinksFresh()
            expect(links).to.have.property('lines').which.eqls([])
            expect(result).to.have.property('removedIndices').which.eqls([...initial.keys()])
        })

        it('should remove even', async function () {
            let links = await getLinksFresh()
            const result = await links.removeLines([...initial.keys()].map(i => 2 * i)) // Purposefully more indices that are out of range
            links = await getLinksFresh()
            expect(links).to.have.property('lines').which.eqls(initial.filter((_e, i) => i & 1))
            expect(result).to.have.property('removedIndices').which.eqls([...initial.keys()].filter((_e, i) => !(i & 1)))
        })
    })
})