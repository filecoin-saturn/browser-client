import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { widgetConfigFromUrl } from '#src/widget/widget-config.js'

describe('widget-config', () => {
    it('should get default config from URL', () => {
        const clientKey = 'abc123'
        const url = `https://portal.saturn.tech/widget.js#integration=${clientKey}`

        const config = widgetConfigFromUrl(url)
        assert.strictEqual(config.clientKey, clientKey)
        assert.strictEqual(config.installPath, '/')
    })

    it('should get config from URL', () => {
        const clientKey = 'abc123'
        const installPath = '/test'
        const url = `https://portal.saturn.tech/widget.js#integration=${clientKey}&installPath=${installPath}`

        const config = widgetConfigFromUrl(url)
        assert.strictEqual(config.clientKey, clientKey)
        assert.strictEqual(config.installPath, installPath)
    })
})
