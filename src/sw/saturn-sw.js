// Copyright _!_
//
// License _!_

/* eslint-env worker */

import {
    SW_CORE_PATH,
    SHARED_WORKER_PATH,
    DEDICATED_WORKER_PATH
} from '@src/constants'

const origin = process.env.STATIC_FILE_ORIGIN

if (typeof ServiceWorkerGlobalScope !== 'undefined') {
    const url = origin + SW_CORE_PATH
    importScripts(url)
} else if (typeof SharedWorkerGlobalScope !== 'undefined') {
    const url = origin + SHARED_WORKER_PATH
    importScripts(url)
} else if (typeof DedicatedWorkerGlobalScope !== 'undefined') {
    const url = origin + DEDICATED_WORKER_PATH
    importScripts(url)
}
