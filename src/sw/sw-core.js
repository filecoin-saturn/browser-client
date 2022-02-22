import createDebug from 'debug'
import isIPFS from 'is-ipfs'

import { fetchCID } from './interceptor'

const debug = createDebug('sw')

const IS_PROD = process.env.NODE_ENV === 'production'
if (!IS_PROD) {
    createDebug.enable('sw')
}
const cl = console.log

addEventListener('install', () => self.skipWaiting())
addEventListener('activate', () => self.clients.claim())
addEventListener('error', err => debug('sw err', err))
addEventListener('fetch', event => {
    const { url } = event.request

    if (!meetsInterceptionPreconditions(event)) {
        return
    }

    const cid = findCID(url)
    if (cid) {
        debug('cid', cid, url)
        event.respondWith(fetchCID(cid, event))
    }
})

function meetsInterceptionPreconditions (event) {
    try {
        const { request } = event
        const { url } = request
        const isNavigation = request.mode === 'navigate'

        if (isNavigation) {
            checkURLFlagsOnNavigation(url)
            return false
        }

        // https://developer.mozilla.org/en-US/docs/Web/API/Request/mode
        // "If a request is made to another origin with this mode set, the
        // result is simply an error."
        const isRequestModeSameOrigin = request.mode === 'same-origin'

        const interceptionPreconditionsMet = (
            self.ReadableStream
            && request.method === 'GET'
            && !isRequestModeSameOrigin
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
    const swDebugFlag = 'swDebug'

    if (searchParams.has(swDebugFlag)) {
        createDebug.enable('sw')
        debug(`Enabling debug. gitHash: ${process.env.COMMITHASH}`)
    }
}

// Modified from https://github.com/PinataCloud/ipfs-gateway-tools
function findCID (url) {
    const splitUrl = url.split('/')
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
