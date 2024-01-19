import toIterable from 'browser-readablestream-to-it'
import createDebug from 'debug'
import * as Sentry from '@sentry/browser'

const debug = createDebug('sw')
const cl = console.log

export class Interceptor {
    static nocache = false // request/response skips L1 cache entirely
    static bypasscache = false // request skips L1 cache, response gets cached.

    constructor(cidPath, saturn, clientId, event) {
        this.cidPath = cidPath
        this.saturn = saturn
        this.clientId = clientId
        this.event = event
        this.numBytesEnqueued = 0
        this.isClosed = false
    }

    // TODO: How to handle response headers?
    // Remember svgs break without the header: 'content-type': 'image/svg+xml'
    get responseOptions() {
        return {}
    }

    async fetch() {
        const self = this

        const readableStream = new ReadableStream({
            async start(controller) {
                try {
                    const opts = {
                        customerFallbackURL: self.event.request.url,
                        raceNodes: true,
                        firstHitDNS: true
                    }
                    const contentItr = await self.saturn.fetchContentWithFallback(
                        self.cidPath,
                        opts
                    )
                    await self._streamContent(contentItr, controller)
                } catch (err) {
                    self._debug('Error', err)
                    Sentry.captureException(err)
                } finally {
                    self._close(controller)
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
            const duration = Date.now() - start
            this._debug(`Done in ${duration}ms. Enqueued ${this.numBytesEnqueued}`)
        }
    }

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

function asAsyncIterable(readable) {
    return Symbol.asyncIterator in readable ? readable : toIterable(readable)
}
