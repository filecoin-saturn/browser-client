import { v4 as uuidv4 } from 'uuid'

import { SW_PATH } from '@/constants.js'

const cl = console.log

const MDN_SW_DOCS_URL = 'https://developer.mozilla.org/en-US/docs/Web' +
                        '/API/Service_Worker_API/Using_Service_Workers' +
                        '#Why_is_my_service_worker_failing_to_register'

async function installSw (clientId) {
    try {
        const path = `${SW_PATH}?clientId=${clientId}`
        await navigator.serviceWorker.register(path)
    } catch (err) {
        console.warn(
            'Failed to install Filecoin\'s Service Worker.\n\n' +
            `For installation help, see ${MDN_SW_DOCS_URL}.\n\n`,
            err.name, err.message
        )
    }
}

function getRetrievalClientId () {
    const key = 'saturnClientId'
    let clientId = localStorage.getItem(key)
    if (!clientId) {
        clientId = uuidv4()
        localStorage.setItem(key, clientId)
    }
    return clientId
}

function initWidget () {
    if (!('serviceWorker' in navigator)) {
        return
    }

    const clientId = getRetrievalClientId()
    installSw(clientId)
}

initWidget()
