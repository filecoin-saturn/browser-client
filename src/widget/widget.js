import { SW_PATH } from '@/constants'

const cl = console.log

const MDN_SW_DOCS_URL = 'https://developer.mozilla.org/en-US/docs/Web' +
                        '/API/Service_Worker_API/Using_Service_Workers' +
                        '#Why_is_my_service_worker_failing_to_register'

async function installSw () {
    try {
        const { serviceWorker } = navigator
        const registration = await serviceWorker.register(SW_PATH)
        cl(registration)
    } catch (err) {
        console.warn(
            'Failed to install Filecoin\'s Service Worker.\n\n' +
            `For installation help, see ${MDN_SW_DOCS_URL}.\n\n`,
            err.name, err.message
        )
    }
}

function initWidget () {
    if (!('serviceWorker' in navigator)) {
        return
    }

    installSw()
}

initWidget()
