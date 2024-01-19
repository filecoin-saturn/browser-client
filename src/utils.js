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
export function findCIDPathInURL(url) {
    let urlObj
    try {
        urlObj = new URL(url)
    } catch (err) {
        return null
    }

    let cid = null
    let path = null

    const { hostname, pathname, searchParams, href } = urlObj

    const searchStrings = [
        hostname + pathname, // checks for path based or subdomain based cids.
        ...searchParams.values(), // params could contain cid URLs, e.g. ?url=ipfs.io/ipfs/<cid>
    ]

    for (const str of searchStrings) {
        const result = findCIDPathInUrlComponent(str)

        // sanity check if parsed cid appears in URL
        if (result.cid && href.includes(result.cid)) {
            ({ cid, path } = result)
            break
        }
    }

    const cidPath = path ? `${cid}/${path}` : cid

    return cidPath
}

function findCIDPathInUrlComponent(str) {
    let cid = null
    let path = null

    const splitStr = str.replace(/https?:\/\//, '').split('/')
    // Heuristic to check if the first segment is a domain.
    const isMaybeHost = splitStr[0].includes('.')

    // Assumes the rest of the segments after the cid form the file path.
    const segmentsToPath = i => splitStr.slice(i).join('/') || null

    for (let i = 0; i < splitStr.length; i++) {
        const segment = splitStr[i]
        if (isIPFS.cid(segment)) {
            cid = segment
            path = segmentsToPath(i + 1)
            break
        }

        const splitOnDot = segment.split('.')[0]
        if(isIPFS.cid(splitOnDot)) {
            cid = splitOnDot
            if (isMaybeHost) {
                path = segmentsToPath(1)
            }
            break
        }
    }

    return { cid, path }
}
