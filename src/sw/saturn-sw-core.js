import * as Sentry from '@sentry/browser'
import { Controller } from './controller.js'

Sentry.init({
    dsn: 'https://2a6fc6930efa43dd32d3e56c92c0a7d2@o4504290295349248.ingest.sentry.io/4505902296858624',
})

const ctrl = new Controller()
ctrl.start()
