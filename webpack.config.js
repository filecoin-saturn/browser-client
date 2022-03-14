const path = require('path')

const ESLintPlugin = require('eslint-webpack-plugin')
const { GitRevisionPlugin } = require('git-revision-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const webpack = require('webpack')

const gitPlugin = new GitRevisionPlugin({
    commithashCommand: 'rev-parse --short HEAD'
})

const abspath = p => path.resolve(__dirname, p)
const cl = console.log

module.exports = (env, { mode }) => {
    // Switch to .env files once this gets unwieldy
    const IS_PROD = mode === 'production'
    const STATIC_ORIGIN = IS_PROD
        ? 'https://filecoin-saturn.s3.us-west-1.amazonaws.com'
        : 'http://localhost:8030'
    const GATEWAY_ORIGIN = IS_PROD
        ? 'https://cdn.saturn.network'
        : 'http://localhost:8031'

    return {
        // Uncomment snapshot for webpack to detect edits in node_modules/
        snapshot: {
            managedPaths: [],
        },
        entry: {
            widget: abspath('src/widget/widget.js'),
            sw: abspath('src/sw/sw.js'),
            'sw-core': abspath('src/sw/sw-core.js'),
        },
        devServer: {
            client: {
                logging: 'warn'
            },
            static: abspath('dist'),
            port: 8030,
            // hot: false,
            // liveReload: false,
            webSocketServer: false
        },
        output: {
            path: abspath('dist'),
            clean: true,
            publicPath: STATIC_ORIGIN + '/',
        },
        plugins: [
            new webpack.EnvironmentPlugin({
                COMMITHASH: JSON.stringify(gitPlugin.commithash()),
                STATIC_ORIGIN,
                GATEWAY_ORIGIN,
            }),
            new ESLintPlugin({
                emitError: false,
                emitWarning: false,
            }),
            new HtmlWebpackPlugin({
                template: abspath('placeholders/index.html'),
                chunks: ['widget']
            })
        ],
        resolve: {
            alias: {
                '@': abspath('src'),
                '@sw': abspath('src/sw'),
                '@widget': abspath('src/widget'),
            }
        }
    }
}
