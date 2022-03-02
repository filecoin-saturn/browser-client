import { CarBlockIterator } from '@ipld/car/iterator'
import toIterable from 'browser-readablestream-to-it'
import createDebug from 'debug'
import { recursive as unixFsExporter } from 'ipfs-unixfs-exporter'
import { IdbAsyncBlockStore } from './idb-async-blockstore'

import { wfetch, sleep } from '@/utils'

const debug = createDebug('sw')
const cl = console.log

export async function fetchCID (cid, event) {
    let response = null
    const { request } = event

    try {
        const interceptor = new Interceptor(cid, event)
        response = await interceptor.fetch()

        // Always fallback to origin server.
        response = response || await fetch(request)
    } catch (err) {
        debug(`${request.url}: fetchCID err %O`, err)
        response = await fetch(request)
    }

    return response
}

export class Interceptor {
    constructor (cid, event) {
        this.cid = cid
        this.event = event
    }

    get gatewayUrl () {
        const origin = process.env.GATEWAY_ORIGIN
        return `${origin}/${this.cid}`
    }

    // TODO: How to handle response headers?
    // Remember svgs break without the header: 'content-type': 'image/svg+xml'
    get responseOptions () {
        return {}
    }

    // TODO: Use cache api to cache CAR files? They're immutable anyways.
    async fetch () {
        //const response = await wfetch(this.gatewayUrl, { timeout: 3_000 })
        const response = await wfetch(this.gatewayUrl)
        return this.createResponse(response)
    }

    createResponse (response) {
        const self = this
        const readableStream = new ReadableStream({
            start (controller) {
                self.streamResponse(response, controller)
            },
            cancel () {
                // What do here?
                self.cancel()
            }
        })

        return new Response(readableStream, this.responseOptions)
    }

    async streamResponse (response, controller) {
        const blockstore = new IdbAsyncBlockStore()
        for await (const file of this.unpackStream(response.body, { blockstore })) {
            // Skip root dir
            if (file.type === 'directory') { continue }

            const opts = {}
            for await (const chunk of file.content(opts)) {
                controller.enqueue(chunk)
            }
        }
        controller.close()
        blockstore.close()
    }

    // Modified from https://github.com/web3-storage/ipfs-car/blob/9cd28ad5f6f320f2e1e15635e479a8c9beb7d916/src/unpack/index.ts#L26
    async * unpackStream (readable, { blockstore }) {
        const carItr = await CarBlockIterator.fromIterable(asAsyncIterable(readable))

        ;(async () => {
            for await (const block of carItr) {
                await blockstore.put(block.cid, block.bytes)
            }
        })()

        // TODO: Verification not needed for v0.
        //const verifyingBlockStore = VerifyingGetOnlyBlockStore.fromBlockstore(blockstore)

        const roots = await carItr.getRoots()
        for (const root of roots) {
            yield * unixFsExporter(root, blockstore)
        }
    }

    cancel () {

    }
}

function asAsyncIterable(readable) {
    return Symbol.asyncIterator in readable ? readable : toIterable(readable)
}
