import createDebug from 'debug'
import { unpackStream } from 'ipfs-car/unpack'
import { IdbBlockStore } from 'ipfs-car/blockstore/idb'

import { wfetch } from '@/utils'

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
        const response = await wfetch(this.gatewayUrl, { timeout: 3_000 })
        return this.createResponse(response)
    }

    createResponse (response) {
        const self = this
        const readableStream = new ReadableStream({
            start (controller) {
                self.streamResponse(response, controller)
            },
            cancel () {
                self.cancel()
            }
        })

        return new Response(readableStream, this.responseOptions)
    }

    // There will only be one file in the CAR
    // https://ipld.io/specs/transport/car/carv1/#number-of-roots
    // "Current usage of the CAR format in Filecoin requires exactly one CID"
    //
    // Block <-> CID verification is done by ipfs-car
    // https://github.com/web3-storage/ipfs-car/blob/9cd28ad5f6f320f2e1e15635e479a8c9beb7d916/src/unpack/utils/verifying-get-only-blockstore.ts#L25
    // TODO: Handle verification errors?
    //
    // TODO: Potential bottleneck: Cannot maintain a stream from
    // gateway -> sw -> client page.
    //
    // "The blocks are unpacked from the stream in the order they appear,
    // which may not be the order needed to reassemble them into the Files
    // and Directories they represent. Once the stream is consumed, the
    // blockstore provides the random access by CID to the blocks, needed
    // to assemble the tree."
    //
    // Only after the file is assembled can it be streamed to the client.
    // So if its a 5 GB file, the entire file needs to be downloaded and
    // assembled before it's usable.
    // Potential solution is to use CarIndexedReader but that's Node.js only.
    async streamResponse (response, controller) {
        const blockstore = new IdbBlockStore()
        for await (const file of unpackStream(response.body, { blockstore })) {
            // Skip root dir
            if (file.type === 'directory') { continue }

            // TODO: I guess here is where you slice the file to satisfy
            // range requests?
            const opts = {}
            for await (const chunk of file.content(opts)) {
                controller.enqueue(chunk)
            }
        }
        // TODO: Only clears store, doesn't delete database. Databases will
        // accumulate over time.
        blockstore.close()
    }

    cancel () {

    }
}
