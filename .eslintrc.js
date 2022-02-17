module.exports = {
    env: {
        browser: true,
        node: true,
        es6: true
    },
    extends: 'eslint:recommended',
    rules: {
        'comma-dangle': 0,
        indent: ['error', 4],
        'linebreak-style': [
            'error',
            'unix'
        ],
        'max-len': ['error', { code: 80, ignoreUrls: true }],
        'no-unused-vars': ['error', {
            varsIgnorePattern: '^_|cl',
            ignoreRestSiblings: true
        }],
        'prefer-const': 1,
        'quotes': ['error', 'single'],
        'semi': ['error', 'never']
    },
    parser: '@babel/eslint-parser',
    parserOptions: {
        requireConfigFile: false
    },
    globals: {
        cl: true,
        cljson: true,
    }
}
