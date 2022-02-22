/**
 * Fetch API wrapper that throws on 400+ http status.
 *
 * @param {string|Request} resource
 * @param {object} opts - Fetch API options. Also accepts a 'timeout' number.
 */
export async function wfetch (resource, opts = {}) {
    if (Number.isFinite(opts.timeout)) {
        const controller = new AbortController()
        opts.signal = controller.signal
        setTimeout(() => controller.abort(), opts.timeout)
    }

    const response = await fetch(resource, opts)

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
