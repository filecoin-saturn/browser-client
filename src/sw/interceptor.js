import toIterable from 'browser-readablestream-to-it'
import createDebug from 'debug'
import * as Sentry from '@sentry/browser'

const debug = createDebug('sw')
const cl = console.log

const TRUSTED_L1_HOSTNAME = process.env.TRUSTED_L1_ORIGIN.replace(
    'https://',
    ''
)

export class Interceptor {
    static nocache = false // request/response skips L1 cache entirely
    static bypasscache = false // request skips L1 cache, response gets cached.

    constructor(cid, saturn, clientId, event) {
        this.cid = cid
        this.cidPath = getCidPathFromURL(event.request.url, cid)
        this.saturn = saturn
        this.clientId = clientId
        this.event = event
        this.numBytesEnqueued = 0
        this.isClosed = false
        this.isLogQueued = false
    }

    // TODO: How to handle response headers?
    // Remember svgs break without the header: 'content-type': 'image/svg+xml'
    get responseOptions() {
        return {}
    }

    async fetch() {
        const contentItr = await this.saturn.fetchContent(this.cidPath)
        const self = this

        const readableStream = new ReadableStream({
            async start(controller) {
                try {
                    await self._streamContent(contentItr, controller)
                } catch (err) {
                    self._debug('Error', err)
                    Sentry.captureException(err)
                    self._streamFromOrigin(controller)
                }
            },
            cancel() {
                self._close()
            },
        })

        return new Response(readableStream, this.responseOptions)
    }

    async _streamContent(contentItr, controller) {
        const start = Date.now()

        try {
            for await (const data of contentItr) {
                this._enqueueChunk(controller, data)
            }
        } finally {
            this._close(controller)

            const duration = Date.now() - start
            this._debug(`Done in ${duration}ms. Enqueued ${this.numBytesEnqueued}`)
        }
    }

    // TODO: Need to account for this.numBytesEnqueued with range requests.
    async _streamFromOrigin(controller) {
        this._debug('_streamFromOrigin')

        const { request } = this.event
        const originRequest = new Request(request, {
            mode: 'cors',
        })

        const res = await fetch(originRequest, {
            // https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS/Errors/CORSNotSupportingCredentials
            credentials: 'omit',
        })
        for await (const chunk of asAsyncIterable(res.body)) {
            this._enqueueChunk(controller, chunk)
        }

        this._close(controller)
    }

    _enqueueChunk(controller, chunk) {
        if (this.isClosed) return

        controller.enqueue(chunk)
        this.numBytesEnqueued += chunk.length
    }

    _close(controller = null) {
        if (this.isClosed) return

        controller?.close()
        this.isClosed = true
    }

    _debug(...args) {
        debug(this.event.request.url, ...args)
    }
}

function getCidPathFromURL(url, cid) {
    const { hostname, pathname } = new URL(url)
    let cidPath

    if (pathname.startsWith('/ipfs/')) {
        cidPath = pathname.replace('/ipfs/', '')
    } else if (hostname.includes(cid)) {
    // https://<cid>.ipfs.dweb.link/cat.png -> https://saturn.ms/ipfs/<cid>/cat.png
        cidPath = cid + pathname
    }

    return cidPath
}

function asAsyncIterable(readable) {
    return Symbol.asyncIterator in readable ? readable : toIterable(readable)
}
