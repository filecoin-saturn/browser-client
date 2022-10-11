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

// https://stackoverflow.com/a/50587599/2498782
export async function * mergeAsyncIterables (...gens) {
    // Worker function to queue up the next result
    const queueNext = async (e) => {
        e.result = null // Release previous one as soon as possible
        e.result = await e.it.next()
        return e
    }
    // Map the generators to source objects in a map, get and start their
    // first iteration
    const sources = new Map(gens.map(gen => [
        gen,
        queueNext({
            key: gen,
            it:  gen[Symbol.asyncIterator]()
        })
    ]))
    // While we still have any sources, race the current promise of
    // the sources we have left
    while (sources.size) {
        const winner = await Promise.race(sources.values())
        // Completed the sequence?
        if (winner.result.done) {
        // Yes, drop it from sources
            sources.delete(winner.key)
        } else {
        // No, grab the value to yield and queue up the next
        // Then yield the value
            const {value} = winner.result
            sources.set(winner.key, queueNext(winner))
            yield value
        }
    }
}
