import createDebug from 'debug'

import isIPFS  from 'is-ipfs'

const debug = createDebug('sw')

addEventListener('fetch', event => {
    const { url } = event.request
    const cid = findCID(url)
    if (cid) {
        debug('yes cid!', cid, url)
    } else {
        debug('no cid!')
    }
})

addEventListener('error', err => {
    debug('sw err', err)
})

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
