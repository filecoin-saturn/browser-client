import { v4 as uuidv4 } from 'uuid'

import { SW_PATH } from '@src/constants.js'
import { widgetConfigFromScriptTag } from './widget-config.js'

const cl = console.log

const MDN_SW_DOCS_URL = 'https://developer.mozilla.org/en-US/docs/Web' +
                        '/API/Service_Worker_API/Using_Service_Workers' +
                        '#Why_is_my_service_worker_failing_to_register'

async function installSw (conf) {
    const { clientId, clientKey, installPath } = conf
    try {
        let path = `${SW_PATH}?clientId=${clientId}&clientKey=${clientKey}`
        if (installPath !== '/') {
            path = installPath + path
        }
        await navigator.serviceWorker.register(path)
    } catch (err) {
        console.warn(
            'Failed to install Saturn\'s Service Worker.\n\n' +
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

function addHeadElement (tag, props) {
    const selector = `${tag}#${props.id}`
    let $el = document.head.querySelector(selector)
    if ($el) { // Element could already exist due to a prerender
        return $el
    }

    $el = document.createElement(tag)
    for (const key in props) {
        $el[key] = props[key]
    }
    document.head.appendChild($el)

    return $el
}

function initWidget () {
    if (!('serviceWorker' in navigator)) {
        return
    }

    const config = widgetConfigFromScriptTag()
    config.clientId = getRetrievalClientId()

    addHeadElement('link', {
        href: process.env.L1_ORIGIN,
        crossOrigin: '',
        rel: 'preconnect',
        id: 'saturn-preconnect'
    })

    installSw(config)
}

initWidget()
