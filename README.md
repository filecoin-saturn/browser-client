# Saturn Browser Client

[![](https://img.shields.io/badge/made%20by-Protocol%20Labs-blue.svg?style=flat-square)](https://protocol.ai/)
[![](https://img.shields.io/badge/project-Filecoin-blue.svg?style=flat-square)](https://filecoin.io/)

The Saturn Browser Client is a service worker that serves websites' [CID](https://docs.ipfs.io/concepts/content-addressing/) requests with [CAR files](https://ipld.io/specs/transport/car/carv1/). CAR files are verifiable, which is
a requirement when retrieving content in a trustless manner from community hosted
[Saturn Nodes](https://github.com/filecoin-project/saturn-node).

## Install

`$ npm install`

## Development

`$ npm run dev`

## Adding the Browser Client to your website

1. Add this script tag to the `<head>` tag. This will install the service worker.

```html
<script async src="https://saturn.tech/widget.js">
```

2. Host the service worker file from the root path of your website's domain. For example, if your website is https://example.com, host the service worker file at https://example.com/saturn-sw.js.

   The service worker file can be found here: https://saturn.tech/saturn-sw.js


## License

Dual-licensed under [MIT](https://github.com/filecoin-project/saturn-node/blob/main/LICENSE-MIT) + [Apache 2.0](https://github.com/filecoin-project/saturn-node/blob/main/LICENSE-APACHE)
