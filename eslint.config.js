import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import pluginReact from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import markdown from '@eslint/markdown'
import { defineConfig, globalIgnores } from 'eslint/config'
// Note the `/flat` suffix here, the difference from default entry is that
// `/flat` added `name` property to the exported object to improve
// [config-inspector](https://eslint.org/blog/2024/04/eslint-config-inspector/) experience.
import eslintConfigPrettier from 'eslint-config-prettier/flat'

const browserFiles = [
    'widgets/**/*.{js,jsx,ts,tsx}',
    'shared/**/*.{js,jsx,ts,tsx}',
]
const reactFiles = ['widgets/**/*.{jsx,tsx}', 'shared/**/*.{jsx,tsx}']

export default defineConfig([
    // The Grist types are vendored from upstream, so linting them only produces
    // findings we cannot act on.
    globalIgnores([
        'dist/',
        'shared/infrastructure/grist/grist-plugin-api.d.ts',
    ]),

    {
        files: ['**/*.{js,mjs,cjs,jsx}'],
        plugins: { js },
        extends: ['js/recommended'],
    },

    // `recommendedTypeChecked` also pulls in typescript-eslint's
    // `eslint-recommended`, which switches off the core rules the compiler
    // already covers (`no-undef`, `no-unused-vars`, …) in favour of its
    // TS-aware versions. The type-checked rules need real type information,
    // hence `projectService` — slower than syntax-only linting, but it is what
    // catches the bugs that matter (floating promises, unsafe `any` flows).
    {
        files: ['**/*.{ts,mts,cts,tsx}'],
        extends: [tseslint.configs.recommendedTypeChecked],
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },

    // Widget and shared code runs in the browser (inside a Grist iframe);
    // build scripts and the Vite config run in Node.
    {
        files: browserFiles,
        languageOptions: { globals: globals.browser },
    },
    {
        files: ['scripts/**/*.{mjs,mts}', 'vite.config.{js,ts}'],
        languageOptions: { globals: globals.node },
    },

    {
        files: reactFiles,
        extends: [
            pluginReact.configs.flat.recommended,
            // Disables `react-in-jsx-scope` and `react/jsx-uses-react`: the
            // automatic JSX runtime makes importing React unnecessary.
            pluginReact.configs.flat['jsx-runtime'],
            reactHooks.configs.flat.recommended,
        ],
        // Pinned rather than 'detect': eslint-plugin-react 7.37.5 does not
        // support ESLint 10 yet, and its version-detection path crashes on the
        // removed `context.getFilename()` API. Keep in sync with the React
        // version in dependencies.
        settings: { react: { version: '19.2' } },
        rules: {
            // Props are typed in TS rather than declared with prop-types.
            'react/prop-types': 'off',
        },
    },

    {
        files: ['**/*.md'],
        plugins: { markdown },
        language: 'markdown/gfm',
        extends: ['markdown/recommended'],
    },

    // Must stay last: turns off every rule that conflicts with Prettier.
    eslintConfigPrettier,
])
