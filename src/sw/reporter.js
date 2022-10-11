import createDebug from 'debug'

import { wfetch } from '@/utils'

const debug = createDebug('sw')

export class Reporter {
    logs = []
    flushTimeoutId = null

    add (log) {
        this.logs.push(log)

        clearTimeout(this.flushTimeoutId)
        this.flushTimeoutId = setTimeout(() => this.report(), 3000)
    }

    async report () {
        const bandwidthLogs = this.logs.splice(0)
        if (!bandwidthLogs.length) { return }

        try {
            await wfetch(process.env.LOG_INGESTOR_URL, {
                method: 'POST',
                body: JSON.stringify({ bandwidthLogs }),
            })
        } catch (err) {
            debug(err)
        }
    }
}

export const reporter = new Reporter()
