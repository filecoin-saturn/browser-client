import path from 'path'
import { fileURLToPath } from 'url'

import ESLintPlugin from 'eslint-webpack-plugin'
import { GitRevisionPlugin } from 'git-revision-webpack-plugin'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import webpack from 'webpack'

import { SW_NAME, SW_CORE_NAME } from './src/constants.js'

const gitPlugin = new GitRevisionPlugin({
    commithashCommand: 'rev-parse --short HEAD'
})

const __dirname = fileURLToPath(path.dirname(import.meta.url))
const abspath = p => path.resolve(__dirname, p)
const cl = console.log

const devServerPort = 8030

export default (env, { mode }) => {
    // Switch to .env files once this gets unwieldy
    const e = process.env
    const STATIC_ORIGIN = e.STATIC_ORIGIN ?? 'http://localhost:8030'
    const L1_ORIGIN = e.L1_ORIGIN ?? 'https://l1s.saturn-test.ms'
    const TRUSTED_L1_ORIGIN = e.TRUSTED_L1_ORIGIN ?? 'https://l1s.saturn-test.ms'
    const UNTRUSTED_L1_ORIGIN = e.UNTRUSTED_L1_ORIGIN ?? 'https://saturn-test.ms'
    const LOG_INGESTOR_URL = e.LOG_INGESTOR_URL ?? 'https://p6wofrb2zgwrf26mcxjpprivie0lshfx.lambda-url.us-west-2.on.aws'
    const JWT_AUTH_URL = e.JWT_AUTH_URL ?? 'https://fz3dyeyxmebszwhuiky7vggmsu0rlkoy.lambda-url.us-west-2.on.aws'
    const ORCHESTRATOR_URL = e.ORCHESTRATOR_URL ?? 'https://orchestrator.strn-test.pl/nodes'
    const WIDGET_ORIGIN = e.WIDGET_ORIGIN ?? `http://localhost:${8030}`

    return {
    // Uncomment snapshot for webpack to detect edits in node_modules/
        snapshot: {
            managedPaths: [],
        },
        entry: {
            widget: abspath('src/widget/widget.js'),
            [SW_NAME]: abspath('src/sw/saturn-sw.js'),
            [SW_CORE_NAME]: abspath('src/sw/saturn-sw-core.js'),
        },
        devServer: {
            client: {
                logging: 'warn'
            },
            static: abspath('dist'),
            port: devServerPort,
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
                L1_ORIGIN,
                TRUSTED_L1_ORIGIN,
                UNTRUSTED_L1_ORIGIN,
                LOG_INGESTOR_URL,
                JWT_AUTH_URL,
                ORCHESTRATOR_URL,
                WIDGET_ORIGIN
            }),
            new ESLintPlugin({
                emitError: false,
                emitWarning: false,
            }),
            new HtmlWebpackPlugin({
                filename: 'index.html',
                template: abspath('public/index.html'),
                // chunks = [] disables script injection, the script tag is
                // already present in the html template with an absolute url
                chunks: [],
                templateParameters: {
                    // Arc prod client key
                    CLIENT_KEY: '1205a0fe-142c-40a2-a830-8bbaf6382c3f',
                    WIDGET_ORIGIN,
                }
            })
        ],
        resolve: {
            alias: {
                '@src': abspath('src'),
                '@sw': abspath('src/sw'),
                '@widget': abspath('src/widget'),
            }
        }
    }
}
