import * as idb from 'idb-keyval'
import { CID } from 'multiformats'
import { BaseBlockstore } from 'blockstore-core'
import { Deferred } from '@/utils'

/**
 * Save blocks to IndexedDB in the browser via idb-keyval
 * Creates a probably unique indexed db per instance to ensure that the
 * blocks iteration method only returns blocks from this invocation,
 * and so that the caller can destory it without affecting others.
 */
export class IdbAsyncBlockStore extends BaseBlockstore {
    constructor () {
        super()

        const dbName = `IdbBlockStore-${Date.now()}-${Math.random()}`
        this.store = idb.createStore(dbName, 'IdbBlockStore')
        this.deferredBlocks = {}
    }

    async * blocks () {
        const keys = await idb.keys(this.store)

        for await (const key of keys) {
            yield {
                cid: CID.parse(key.toString()),
                bytes: await idb.get(key, this.store)
            }
        }
    }

    async put (cid, bytes) {
        const cidStr = cid.toString()
        await idb.set(cidStr, bytes, this.store)

        if (cidStr in this.deferredBlocks) {
            this.deferredBlocks[cidStr].resolve(bytes)
            delete this.deferredBlocks[cidStr]
        }
    }

    async get (cid) {
        const cidStr = cid.toString()
        let bytes = await idb.get(cidStr, this.store)

        if (!bytes) {
            const deferredBlock = new Deferred()
            this.deferredBlocks[cidStr] = deferredBlock
            bytes = await deferredBlock.promise
        }
        if (!bytes) {
            throw new Error(`block with cid ${cid.toString()} no found`)
        }

        return bytes
    }

    async has (cid) {
        const bytes = await idb.get(cid.toString(), this.store)
        return Boolean(bytes)
    }

    async close () {
        return idb.clear(this.store)
    }
}
