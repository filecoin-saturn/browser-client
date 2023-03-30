import { CarBlockIterator } from '@ipld/car/iterator'
import toIterable from 'browser-readablestream-to-it'
import createDebug from 'debug'
import { recursive } from 'ipfs-unixfs-exporter'

import { wfetch, mergeAsyncIterables, sleep } from '@/utils.js'
import { IdbAsyncBlockStore } from './idb-async-blockstore.js'
import { verifyBlock } from './verify.js'
import { reporter } from './reporter.js'

const debug = createDebug('sw')
const cl = console.log

const TRUSTED_L1_HOSTNAME = process.env.TRUSTED_L1_ORIGIN.replace('https://', '')

export class Interceptor {
    constructor (cid, clientId, event) {
        this.cid = cid
        this.clientId = clientId
        this.event = event
        this.numBytesEnqueued = 0
        this.isClosed = false
        this.saturnUrl = createSaturnUrl(event.request.url, cid, clientId)
        this.log = createLog(this.saturnUrl)
        this.isLogQueued = false
    }

    // TODO: How to handle response headers?
    // Remember svgs break without the header: 'content-type': 'image/svg+xml'
    get responseOptions () {
        return {}
    }

    async fetch () {
        let response
        try {
            response = await wfetch(this.saturnUrl, { timeout: 10_000 })
        } catch (err) {
            // TODO: Handle abort error from the 2s timeout
            if (err.response) {
                this._updateLogWithResponse(err.response)
            } else {
                this.log.ifNetworkError = err.message
            }
            this._queueLogReport()

            throw err
        }

        this._updateLogWithResponse(response)

        return this._createResponse(response)
    }

    _updateLogWithResponse (response) {
        const { headers } = response

        this.log.httpStatusCode = response.status
        this.log.nodeId = headers.get('saturn-node-id')
        this.log.cacheHit = headers.get('saturn-cache-status') === 'HIT'
        this.log.httpProtocol = headers.get('quic-status')
        this.log.requestId = headers.get('saturn-transfer-id')
    }

    _createResponse (response) {
        const self = this
        const readableStream = new ReadableStream({
            async start (controller) {
                try {
                    await self._streamFromNode(response, controller)
                } catch (err) {
                    self._debug('Error', err)
                    self._streamFromOrigin(controller)
                }
            },
            cancel () {
                self._close()
            }
        })

        return new Response(readableStream, this.responseOptions)
    }

    async _streamFromNode (response, controller) {
        const start = Date.now()
        const blockstore = new IdbAsyncBlockStore()
        const readable = response.body.pipeThrough(this._logStream())
        let blockIndex = 0

        try {
            for await (const data of this._unpackCarFile(readable, blockstore)) {
                const isCarBlock = data.cid && data.bytes
                if (isCarBlock) {
                    const { cid, bytes } = data
                    // CAR files will have the root CID as the first block.
                    if (blockIndex === 0) {
                        this._ensureBlockCidMatchesUrlCid(cid.toString())
                    }

                    await verifyBlock(cid, bytes)
                    await blockstore.put(cid, bytes)

                    blockIndex++
                } else {
                    this._enqueueChunk(controller, data)
                }
            }
        } finally {
            this._close(controller)
            blockstore.close()

            this._queueLogReport()

            const duration = Date.now() - start
            this._debug(`Done in ${duration}ms. Enqueued ${this.numBytesEnqueued}`)
        }
    }

    // Modified from https://github.com/web3-storage/ipfs-car/blob/9cd28ad5f6f320f2e1e15635e479a8c9beb7d916/src/unpack/index.ts#L26
    async * _unpackCarFile (readable, blockstore) {
        const carItr = await CarBlockIterator.fromIterable(asAsyncIterable(readable))
        const cidPath = this.saturnUrl.pathname.replace('/ipfs/', '')
        const chunkItr = this.fileChunkItr(recursive(cidPath, blockstore))

        // Merging these 2 iterators makes it easier to exit the async context
        // if a verify error - or any error - occurs. Otherwise there'll be
        // 2 separate async loops and it's harder to coordinate them.
        yield * mergeAsyncIterables(chunkItr, carItr)
    }

    async * fileChunkItr (exporter) {
        for await (const data of exporter) {
            if (data.type === 'directory') { continue }
            const opts = {}
            for await (const chunk of data.content(opts)) {
                yield chunk
            }
        }
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

    // Doesn't transform the stream, just records metrics.
    _logStream () {
        const self = this
        return new TransformStream({
            transform (chunk, controller) {
                if (self.log.ttfbMs === null) {
                    self.log.ttfbMs = new Date() - self.log.startTime
                }
                self.log.numBytesSent += chunk.length

                controller.enqueue(chunk)
            }
        })
    }

    _ensureBlockCidMatchesUrlCid (blockCid) {
        if (blockCid !== this.cid) {
            const msg = 'block cid doesnt match URL cid. ' +
                `blockCid=${blockCid} urlCid=${this.cid}`
            throw new Error(msg)
        }
    }

    _enqueueChunk (controller, chunk) {
        if (this.isClosed) return

        controller.enqueue(chunk)
        this.numBytesEnqueued += chunk.length
    }

    _queueLogReport () {
        if (this.isLogQueued) { return }
        this.isLogQueued = true

        this.log.requestDurationSec = (new Date() - this.log.startTime) / 1000

        reporter.add(this.log)
    }

    _close (controller = null) {
        if (this.isClosed) return

        controller?.close()
        this.isClosed = true
    }

    _debug (...args) {
        debug(this.event.request.url, ...args)
    }
}

function createSaturnUrl (url, cid, clientId) {
    const { hostname, pathname, search } = new URL(url)
    const L1_ORIGIN = process.env.L1_ORIGIN
    let saturnUrl

    if (pathname.startsWith('/ipfs/') || pathname.startsWith('/ipns/')) {
        saturnUrl = new URL(L1_ORIGIN + pathname + search)
    } else if (hostname.includes(cid)) {
        // https://<cid>.ipfs.dweb.link/cat.png -> https://strn.pl/ipfs/<cid>/cat.png
        const url = L1_ORIGIN + '/ipfs/' + cid + pathname + search
        saturnUrl = new URL(url)
    }

    saturnUrl.searchParams.set('clientId', clientId)
    saturnUrl.searchParams.set('format', 'car')

    return saturnUrl
}

function createLog (saturnUrl) {
    return {
        nodeId: null,
        cacheHit: false,
        url: saturnUrl,
        startTime: new Date(),
        numBytesSent: null,
        range: null,
        requestDurationSec: null,
        requestId: null,
        httpStatusCode: null,
        httpProtocol: null,
        ifNetworkError: null,
        ttfbMs: null,
    }
}

function asAsyncIterable (readable) {
    return Symbol.asyncIterator in readable ? readable : toIterable(readable)
}
