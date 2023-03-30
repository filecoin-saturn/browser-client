// Modified from https://github.com/ipld/js-car/blob/master/examples/verify-car.js

import { bytes } from 'multiformats'
import * as dagCbor from '@ipld/dag-cbor'
import * as dagPb from '@ipld/dag-pb'
import * as dagJson from '@ipld/dag-json'
import * as raw from 'multiformats/codecs/raw'
import * as json from 'multiformats/codecs/json'
import { sha256 } from 'multiformats/hashes/sha2'
import { from as hasher } from 'multiformats/hashes/hasher'
import { blake2b256 } from '@multiformats/blake2/blake2b'

const { toHex } = bytes

const codecs = {
    [dagCbor.code]: dagCbor,
    [dagPb.code]: dagPb,
    [dagJson.code]: dagJson,
    [raw.code]: raw,
    [json.code]: json
}

const hashes = {
    [sha256.code]: sha256,
    [blake2b256.code]: hasher(blake2b256)
}

export async function verifyBlock (cid, bytes) {
    // Verify step 1: is this a CID we know how to deal with?
    if (!codecs[cid.code]) {
        throw new Error(`Unexpected codec: 0x${cid.code.toString(16)}`)
    }
    if (!hashes[cid.multihash.code]) {
        throw new Error(
            `Unexpected multihash code: 0x${cid.multihash.code.toString(16)}`)
    }

    // Verify step 2: if we hash the bytes, do we get the same digest as
    // reported by the CID? Note that this step is sufficient if you just
    // want to safely verify the CAR's reported CIDs
    const hash = await hashes[cid.multihash.code].digest(bytes)
    if (toHex(hash.digest) !== toHex(cid.multihash.digest)) {
        throw new Error(
            `Mismatch: digest of bytes (${toHex(hash)}) does not match digest in CID (${toHex(cid.multihash.digest)})`)
    }
}
