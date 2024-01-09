import createDebug from 'debug'
import { Saturn, indexedDbStorage } from '@filecoin-saturn/js-client'
import { v4 as uuidv4 } from 'uuid'
import * as Sentry from '@sentry/browser'

import { Interceptor } from './interceptor.js'
import { findCIDInURL } from '../utils.js'

const FILTERED_HOSTS = [
    'images.studio.metaplex.com',
]

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
        this.saturn = new Saturn({
            cdnURL: process.env.L1_ORIGIN,
            logURL: process.env.LOG_INGESTOR_URL,
            orchURL: process.env.ORCHESTRATOR_URL,
            authURL: process.env.JWT_AUTH_URL,
            experimental: true,
            clientKey: getClientKey(),
            storage: indexedDbStorage()
        })
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
            const cid = findCIDInURL(url)

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

function getClientKey() {
    const urlObj = new URL(self.location.href)
    const clientKey = urlObj.searchParams.get('clientKey')
    return clientKey
}

async function fetchCID (cid, saturn, clientId, event) {
    let response = null
    const { request } = event

    try {
        const interceptor = new Interceptor(cid, saturn, clientId, event)
        response = await interceptor.fetch()
    } catch (err) {
        debug(`${request.url}: fetchCID err %O`, err)
        Sentry.captureException(err)
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

        if (matchFilteredHosts(new URL(url).hostname)) {
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

function matchFilteredHosts(hostname) {
    return FILTERED_HOSTS.some(host => hostname === host)
}
