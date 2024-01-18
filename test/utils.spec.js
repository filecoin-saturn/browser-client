import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { findCIDPathInURL } from '#src/utils.js'

describe('controller', () => {
    it('finds the cid in the subdomain', () => {
        const cid = 'bafybeigt4657qnz5bi2pa7tdsbiobny55hkpt5vupgnueex22tzvwxfiym'
        const url = `https://${cid}.ipfs.dweb.link`

        assert.strictEqual(findCIDPathInURL(url), cid)
    })

    it('finds the cidPath in the subdomain', () => {
        const cid = 'bafybeidrf56yzbkocajbloyafrebrdzsam3uj35sce2fdyo4elb6zzoily'
        const path = 'test/cat.png'
        const cidPath = `${cid}/${path}`
        const url = `https://${cid}.ipfs.dweb.link/${path}`

        assert.strictEqual(findCIDPathInURL(url), cidPath)
    })

    it('finds the subdomain cid in an encoded query param', () => {
        const cid = 'bafybeidrf56yzbkocajbloyafrebrdzsam3uj35sce2fdyo4elb6zzoily'
        const param = `${cid}.ipfs.dweb.link`
        const url = `https://proxy.com/?url=${param}`

        assert.strictEqual(findCIDPathInURL(url), cid)
    })

    it('finds the cid in the url path', () => {
        const cid = 'QmS29VtmK7Ax6TMmMwbwqtuKSGRJTLJAmHMW83qGvBBxhV'
        const url = `https://ipfs.io/ipfs/${cid}`

        assert.strictEqual(findCIDPathInURL(url), cid)
    })

    it('finds the cidPath in the url path', () => {
        const cidPath = 'QmS29VtmK7Ax6TMmMwbwqtuKSGRJTLJAmHMW83qGvBBxhV/cat.png'
        const url = `https://ipfs.io/ipfs/${cidPath}`

        assert.strictEqual(findCIDPathInURL(url), cidPath)
    })

    it('finds the cid in an encoded query param', () => {
        const cid = 'bafybeidrf56yzbkocajbloyafrebrdzsam3uj35sce2fdyo4elb6zzoily'
        const url = `https://proxy.com/?url=ipfs.io%2Fipfs%2F${cid}/`

        assert.strictEqual(findCIDPathInURL(url), cid)
    })

    it('finds the cidPath in an encoded query param', () => {
        const cidPath = 'bafybeidrf56yzbkocajbloyafrebrdzsam3uj35sce2fdyo4elb6zzoily/test/cat.png'
        const url = `https://proxy.com/?url=https%3A%2F%2Fipfs.io%2Fipfs%2F${cidPath}`

        assert.strictEqual(findCIDPathInURL(url), cidPath)
    })

    it('finds the subdomain cidPath in an encoded query param', () => {
        const cid = 'bafybeidrf56yzbkocajbloyafrebrdzsam3uj35sce2fdyo4elb6zzoily'
        const path = 'dog/cow/cat.png'
        const cidPath = `${cid}/${path}`
        const param = `${cid}.ipfs.dweb.link/${path}`
        const url = `https://proxy.com/?url=${param}`

        assert.strictEqual(findCIDPathInURL(url), cidPath)
    })

    it('finds the plain cid (no /ipfs/ prefix) in an encoded query param', () => {
        const cid = 'bafybeidrf56yzbkocajbloyafrebrdzsam3uj35sce2fdyo4elb6zzoily'
        const url = `https://proxy.com/?cid=${cid}`

        assert.strictEqual(findCIDPathInURL(url), cid)
    })

    it('finds the plain cidPath (no /ipfs/ prefix) in an encoded query param', () => {
        const cidPath = 'bafybeidrf56yzbkocajbloyafrebrdzsam3uj35sce2fdyo4elb6zzoily/test/cat.png'
        const url = `https://proxy.com/?cid=${cidPath}`

        assert.strictEqual(findCIDPathInURL(url), cidPath)
    })
})
