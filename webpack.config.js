const path = require('path')

const ESLintPlugin = require('eslint-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const webpack = require('webpack')

const abspath = p => path.resolve(__dirname, p)
const cl = console.log

module.exports = (env, { mode }) => {
    // Switch to .env files once this gets unwieldy
    const IS_PROD = mode === 'production'
    const STATIC_ORIGIN = IS_PROD ? '?' : 'http://localhost:8030'

    return {
        entry: {
            widget: abspath('src/widget/widget.js'),
            sw: abspath('src/sw/sw.js'),
            'sw-core': abspath('src/sw/sw-core.js'),
        },
        devServer: {
            static: abspath('dist'),
            port: 8030,
        },
        output: {
            path: abspath('dist'),
            clean: true,
            publicPath: STATIC_ORIGIN,
        },
        plugins: [
            new webpack.EnvironmentPlugin({
                STATIC_ORIGIN,
            }),
            new ESLintPlugin({
                emitError: false,
                emitWarning: false,
            }),
            new HtmlWebpackPlugin()
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
