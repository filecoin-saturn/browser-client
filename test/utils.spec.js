import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { findCIDInURL, getCidPathFromURL, parseRange } from '#src/utils.js'

describe('controller', () => {
    it('should find cid in the subdomain', () => {
        const cid = 'bafybeigt4657qnz5bi2pa7tdsbiobny55hkpt5vupgnueex22tzvwxfiym'
        const url = `https://${cid}.ipfs.dweb.link`

        const foundCid = findCIDInURL(url)
        assert.strictEqual(foundCid, cid)
    })

    it('should find cid in the url path', () => {
        const cid = 'QmS29VtmK7Ax6TMmMwbwqtuKSGRJTLJAmHMW83qGvBBxhV'
        const url = `https://ipfs.io/ipfs/${cid}`

        const foundCid = findCIDInURL(url)
        assert.strictEqual(foundCid, cid)
    })

    it('should find cidPath in the subdomain', () => {
        const cid = 'bafybeigt4657qnz5bi2pa7tdsbiobny55hkpt5vupgnueex22tzvwxfiym'
        const path = 'hello/world.png'
        const cidPath = `${cid}/${path}`
        const url = `https://${cid}.ipfs.dweb.link/${path}`

        const foundCidPath = getCidPathFromURL(url, cid)
        assert.strictEqual(foundCidPath, cidPath)
    })

    it('should find cidPath in the url path', () => {
        const cid = 'QmS29VtmK7Ax6TMmMwbwqtuKSGRJTLJAmHMW83qGvBBxhV'
        const path = 'hello/world.png'
        const cidPath = `${cid}/${path}`
        const url = `https://ipfs.io/ipfs/${cid}/${path}`

        const foundCidPath = getCidPathFromURL(url, cid)
        assert.strictEqual(foundCidPath, cidPath)
    })

    it('should parse ranges', () => {
        assert.strictEqual(parseRange(undefined), undefined)
        assert.strictEqual(parseRange(null), undefined)
        assert.strictEqual(parseRange(''), undefined)
        assert.strictEqual(parseRange('apples=0-1000'), undefined)
        assert.strictEqual(parseRange('bytes=0-1000,2000-3000'), undefined)
        assert.strictEqual(parseRange('bytes=cheese-crackers'), undefined)
        assert.strictEqual(parseRange('bytes=cheese'), undefined)
        assert.deepEqual(parseRange('bytes=0-1000'), {
            rangeStart: 0,
            rangeEnd: 1000
        })
        assert.deepEqual(parseRange('bytes=1000'), {
            rangeStart: 1000
        })
        assert.deepEqual(parseRange('bytes=-1000'), {
            rangeStart: -1000
        })
    })
})
