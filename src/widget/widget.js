import { v4 as uuidv4 } from 'uuid'

import { SW_PATH } from '@/constants'

const cl = console.log

const MDN_SW_DOCS_URL = 'https://developer.mozilla.org/en-US/docs/Web' +
                        '/API/Service_Worker_API/Using_Service_Workers' +
                        '#Why_is_my_service_worker_failing_to_register'

async function installSw (rcid) {
    try {
        const path = `${SW_PATH}?rcid=${rcid}`
        await navigator.serviceWorker.register(path)
    } catch (err) {
        console.warn(
            'Failed to install Filecoin\'s Service Worker.\n\n' +
            `For installation help, see ${MDN_SW_DOCS_URL}.\n\n`,
            err.name, err.message
        )
    }
}

function ensureRetrievalClientId () {
    const key = 'rcid'
    let rcid = localStorage.getItem(key)
    if (!rcid) {
        rcid = uuidv4()
        localStorage.setItem(key, rcid)
    }
    return rcid
}

function initWidget () {
    if (!('serviceWorker' in navigator)) {
        return
    }

    const rcid = ensureRetrievalClientId()
    installSw(rcid)
}

initWidget()
