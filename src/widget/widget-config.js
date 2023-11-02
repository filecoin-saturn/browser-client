
// Retrieves widget config based on the script tag url.

export const WIDGET_BASE_URL = `${process.env.WIDGET_ORIGIN}/widget.js`

const CLIENT_KEY_IDENTIFIER = 'integration'

export function isWidgetUrl (url) {
    const { href } = new URL(url)
    return  href.startsWith(WIDGET_BASE_URL)
}

function getConf (urlObj, conf = {}) {
    const [_, queryStr] = urlObj.href.split(/#|[?]/)
    const searchParams = new URLSearchParams(queryStr)
    conf.clientKey = searchParams.get(CLIENT_KEY_IDENTIFIER)
    return conf
}


function urlToInheritedProtocolUrl (url) {
    const { host, pathname } = new URL(url)
    const inheritedProtocolUrl = `//${host}${pathname}`
    return inheritedProtocolUrl
}

export function findWidgetScriptTag () {
    const $widgetScript = document.querySelector(`
        script[src^="${WIDGET_BASE_URL}"],
        script[src^="${urlToInheritedProtocolUrl(WIDGET_BASE_URL)}"]
    `)

    return $widgetScript
}

export function widgetConfigFromScriptTag () {
    const $widgetScript = findWidgetScriptTag()

    // widgetConfigFromUrl expects an absolute url, so any relative
    // urls need to be converted.
    let src = $widgetScript.getAttribute('src')
    if (src.startsWith('//')) {
        src = window.location.protocol + src
    } else if (src.startsWith('/')) {
        src = window.location.origin + src
    }

    return widgetConfigFromUrl(src)
}

export function widgetConfigFromUrl (url) {
    const urlObj = new URL(url)
    return getConf(urlObj, {})
}
