import createDebug from 'debug'

import { findCid } from './matcher'

const debug = createDebug('sw')


addEventListener('fetch', event => {
    const result = findCid(event)
    if (result.cid) {
        // intercept
    }
})

addEventListener('error', err => {
    debug('sw err', err)
})
