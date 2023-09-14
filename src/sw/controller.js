import createDebug from 'debug'
import isIPFS from 'is-ipfs'
import Saturn from 'strn'
import { v4 as uuidv4 } from 'uuid'

import { Interceptor } from './interceptor.js'

const debug = createDebug('sw')
const cl = console.log

const IS_PROD = process.env.NODE_ENV === 'production'
if (!IS_PROD) {
    createDebug.enable('sw')
}

export class Controller {
    clientId = null
    listenersAdded = false

    constructor () {
        this.clientId = getRetrievalClientId()
        this.saturn = new Saturn()
    }

    start () {
        if (this.listenersAdded) { return }
        this.listenersAdded = true

        addEventListener('install', e => e.waitUntil(self.skipWaiting()))
        addEventListener('activate', e => e.waitUntil(self.clients.claim()))
        addEventListener('error', err => debug('sw err', err))
        addEventListener('fetch', event => {
            if (!meetsInterceptionPreconditions(event)) {
                return
            }

            const { url } = event.request
            // TODO: Check for ipns too?
            const cid = findCID(url)

            if (cid) {
                debug('cid', cid, url)
                event.respondWith(fetchCID(cid, this.saturn, this.clientId, event))
            }
        })
    }
}

// clientId is added as a query param to the sw registration url
function getRetrievalClientId () {
    let clientId
    try {
        const urlObj = new URL(self.location.href)
        clientId = urlObj.searchParams.get('clientId')
    } catch {
        clientId = uuidv4()
    }
    return clientId
}

// Modified from https://github.com/PinataCloud/ipfs-gateway-tools/blob/34533f3d5f3c0dd616327e2e5443072c27ea569d/src/index.js#L6
function findCID (url) {
    const splitUrl = url.split('?')[0].split('/')
    for (const split of splitUrl) {
        if (isIPFS.cid(split)) {
            return split
        }
        const splitOnDot = split.split('.')[0]
        if(isIPFS.cid(splitOnDot)) {
            return splitOnDot
        }
    }

    return null
}

async function fetchCID (cid, saturn, clientId, event) {
    let response = null
    const { request } = event

    try {
        const interceptor = new Interceptor(cid, saturn, clientId, event)
        response = await interceptor.fetch()
    } catch (err) {
        debug(`${request.url}: fetchCID err %O`, err)
        response = await fetch(request)
    }

    return response
}

function meetsInterceptionPreconditions (event) {
    try {
        const { request } = event
        const { url, destination, mode } = request
        const isNavigation = mode === 'navigate'

        if (isNavigation) {
            checkURLFlagsOnNavigation(url)
            return false
        }

        // range requests not supported yet.
        const isStreamingMedia = ['video', 'audio'].includes(destination)
        // HLS works fine, no range requests involved.
        const isHLS = url.includes('.m3u8')

        // TODO: Add check for range header, skip if present
        if (isStreamingMedia && !isHLS) {
            return false
        }

        // https://developer.mozilla.org/en-US/docs/Web/API/Request/mode
        // "If a request is made to another origin with this mode set, the
        // result is simply an error."
        const isModeSameOrigin = mode === 'same-origin'

        const interceptionPreconditionsMet = (
            self.ReadableStream
            && request.method === 'GET'
            && !isModeSameOrigin
        )

        if (!interceptionPreconditionsMet) {
            return false
        }

        return true
    } catch (err) {
        debug('meetsInterceptionPreconditions err %O', err)
        return false
    }
}

function checkURLFlagsOnNavigation (url) {
    const { searchParams } = new URL(url)
    if (searchParams.get('swDebug') === '1') {
        createDebug.enable('sw')
        debug(`Enabling debug. gitHash: ${process.env.COMMITHASH}`)
    }

    Interceptor.nocache = searchParams.get('nocache') === '1'
    Interceptor.bypasscache = searchParams.get('cachebypass') === '1'
}
