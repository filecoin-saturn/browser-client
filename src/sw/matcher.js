/**
 * Example URLs with cids
 * <cid> = Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu
 *
 * https://ipfs.io/ipfs/<cid>
 * https://<cid>.ipfs.<gateway host>/<path>
 * ipfs://<CID>/<path>
 */

export function findCid (event) {
    const { url, referrer } = event.request

    const urlObj = new URL(url)
    const { host, origin, pathname } = urlObj


}
