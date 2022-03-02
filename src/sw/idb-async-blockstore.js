// Modified from https://github.com/web3-storage/ipfs-car/blob/9cd28ad5f6f320f2e1e15635e479a8c9beb7d916/src/blockstore/idb.ts

import * as idb from 'idb-keyval'
import { CID } from 'multiformats'
import { BaseBlockstore } from 'blockstore-core'
import { Deferred } from '@/utils'

/**
 * Save blocks to IndexedDB in the browser via idb-keyval
 * Creates a probably unique indexed db per instance to ensure that the
 * blocks iteration method only returns blocks from this invocation,
 * and so that the caller can destroy it without affecting others.
 */
// TODO: Feels inefficient to create/delete a database on every intercepted
// request? Just use 1 database with 1 store per request?
export class IdbAsyncBlockStore extends BaseBlockstore {
    constructor () {
        super()

        this.dbName = `IdbBlockStore-${Date.now()}-${Math.random()}`
        this.store = idb.createStore(this.dbName, 'IdbBlockStore')
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
        return indexedDB.deleteDatabase(this.dbName)
    }
}
