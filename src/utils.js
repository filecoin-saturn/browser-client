import isIPFS from 'is-ipfs'

/**
 * Fetch API wrapper that throws on 400+ http status.
 *
 * @param {string|Request} resource
 * @param {object} opts - Fetch API options. Also accepts a 'timeout' number.
 */
export async function wfetch (resource, opts = {}) {
    let id
    if (Number.isFinite(opts.timeout)) {
        const controller = new AbortController()
        opts.signal = controller.signal
        id = setTimeout(() => controller.abort(), opts.timeout)
    }

    const response = await fetch(resource, opts)
    clearTimeout(id)

    if (response.status >= 400) {
        const error = new Error(response.statusText || response.status)
        error.response = response
        throw error
    }

    return response
}

export function sleep (ms, value = undefined) {
    return new Promise(resolve => setTimeout(() => resolve(value), ms))
}

export function promiseTimeout (promise, ms, timeoutErr) {
    let id
    const timeout = new Promise((resolve, reject) => {
        id = setTimeout(() => {
            const err = new Error('Promise timed out')
            reject(timeoutErr || err)
        }, ms)
    })

    return Promise.race([promise, timeout]).finally(() => clearTimeout(id))
}

export class Deferred {
    constructor () {
        this.promise = new Promise((resolve, reject) => {
            this.reject = reject
            this.resolve = resolve
        })
    }
}

// Modified from https://github.com/PinataCloud/ipfs-gateway-tools/blob/34533f3d5f3c0dd616327e2e5443072c27ea569d/src/index.js#L6
export function findCIDInURL (url) {
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

export function getCidPathFromURL(url, cid) {
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
