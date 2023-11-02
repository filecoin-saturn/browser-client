import fs from 'fs'
import { fileURLToPath } from 'url';

import path from 'path'
import { CarBlockIterator } from '@ipld/car/iterator'
import { CarReader } from '@ipld/car/reader'
import { pack } from 'ipfs-car/pack'
import { unpack, unpackStream } from 'ipfs-car/unpack'
import { packToFs } from 'ipfs-car/pack/fs'
import { FsBlockStore } from 'ipfs-car/blockstore/fs'
import { MemoryBlockStore } from 'ipfs-car/blockstore/memory' // You can also use the `level-blockstore` module

const cl = console.log
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const input = `${__dirname}/test2/QmRd1QQHxgiLefbPohzEFU8oMPXzYZg9Jc26JQsTaYMpKh`
const output = `${__dirname}/test2/QmRd1QQHxgiLefbPohzEFU8oMPXzYZg9Jc26JQsTaYMpKh.car`

// const { root, out } = await pack({
//   input: fs.createReadStream(input),
//   blockstore: new FsBlockStore()
// })

const { root, filename } = await packToFs({
    input,
    output,
    blockstore: new FsBlockStore()
  })

console.log(`root CID`, root.code)

// const carIterator = await CarReader.fromIterable(fs.createReadStream(output))
// cl(carIterator)
// for await (const block of carIterator) {
//     // if (block.cid.toString() === 'bafybeievmr6edmvyob3yimrjy7jb3c2e34xcbqchfblxmbsuzyug3q54ju') {
//     //     continue
//     // }
//     cl(block)
// }

for await (const file of unpackStream(fs.createReadStream(output))) {
    // Skip root dir
    if (file.type === 'directory') { continue }
    cl(file)
    // TODO: I guess here is where you slice the file to satisfy
    // range requests?
    const opts = {}
    for await (const chunk of file.content(opts)) {

    }
}
