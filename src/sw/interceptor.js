import { CarBlockIterator } from '@ipld/car/iterator'
import toIterable from 'browser-readablestream-to-it'
import createDebug from 'debug'
import { recursive as unixFsExporter } from 'ipfs-unixfs-exporter'

import { wfetch, sleep } from '@/utils.js'
import { IdbAsyncBlockStore } from './idb-async-blockstore.js'
import { verifyBlock } from './verify.js'

const debug = createDebug('sw')
const cl = console.log

export class Interceptor {
    constructor (cid, clientId, event) {
        this.cid = cid
        this.clientId = clientId
        this.event = event
        this.numBytesEnqueued = 0
        this.isClosed = false
    }

    get gatewayUrl () {
        const origin = process.env.GATEWAY_ORIGIN
        return `${origin}/cid/${this.cid}?clientId=${this.clientId}`
    }

    // TODO: How to handle response headers?
    // Remember svgs break without the header: 'content-type': 'image/svg+xml'
    get responseOptions () {
        return {}
    }

    async fetch () {
        const response = await wfetch(this.gatewayUrl, { timeout: 3_000 })
        return this._createResponse(response)
    }

    _createResponse (response) {
        const self = this
        const readableStream = new ReadableStream({
            start (controller) {
                self._streamFromGateway(response, controller)
                    .catch(err => {
                        self._debug('Error', err)
                        self._streamFromOrigin(controller)
                    })
            },
            cancel () {
                self._close()
            }
        })

        return new Response(readableStream, this.responseOptions)
    }

    async _streamFromGateway (response, controller) {
        const blockstore = new IdbAsyncBlockStore()
        try {
            for await (const file of this._unpackCarFile(response.body, blockstore)) {
                if (file.type === 'directory') { continue }

                // Add byte offsets here?
                const opts = {}
                for await (const chunk of file.content(opts)) {
                    this._enqueueChunk(controller, chunk)
                }
            }
            this._close(controller)
        } finally {
            blockstore.close()
        }
    }

    // Modified from https://github.com/web3-storage/ipfs-car/blob/9cd28ad5f6f320f2e1e15635e479a8c9beb7d916/src/unpack/index.ts#L26
    async * _unpackCarFile (readable, blockstore) {
        const carItr = await CarBlockIterator.fromIterable(asAsyncIterable(readable))

        ;(async () => {
            for await (const { cid, bytes } of carItr) {
                await verifyBlock(cid, bytes)
                await blockstore.put(cid, bytes)
            }
        })()

        // Shouldn't there only be 1 root?
        const roots = await carItr.getRoots()
        const rootCid = roots[0]

        this._ensureCarCidMatchesUrlCid(rootCid.toString())

        yield * unixFsExporter(rootCid, blockstore)
    }

    // TODO: Need to account for this.numBytesEnqueued with range requests.
    async _streamFromOrigin (controller) {
        this._debug('_streamFromOrigin')

        const { request } = this.event
        const originRequest = new Request(request, {
            mode: 'cors',
        })

        const res = await fetch(originRequest, {
            // https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS/Errors/CORSNotSupportingCredentials
            credentials: 'omit'
        })
        for await (const chunk of asAsyncIterable(res.body)) {
            this._enqueueChunk(controller, chunk)
        }

        this._close(controller)
    }

    // Does it make sense to check this condition?
    _ensureCarCidMatchesUrlCid (carRootCid) {
        const { destination } = this.event.request
        // CAR files for range requests won't contain the url cid..right?
        if (['video', 'audio'].includes(destination)) {
            return
        }

        if (carRootCid !== this.cid) {
            throw new Error('CAR file root cid doesnt match intercepted cid.')
        }
    }

    _enqueueChunk (controller, chunk) {
        if (this.isClosed) return

        controller.enqueue(chunk)
        this.numBytesEnqueued += chunk.length
    }

    _close (controller = null) {
        if (this.isClosed) return

        controller?.close()
        this.isClosed = true
    }

    _debug (...args) {
        debug(this.cid, ...args)
    }
}

function asAsyncIterable (readable) {
    return Symbol.asyncIterator in readable ? readable : toIterable(readable)
}
