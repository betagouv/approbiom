import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import pluginReact from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import markdown from '@eslint/markdown'
import { defineConfig, globalIgnores } from 'eslint/config'
import eslintConfigPrettier from 'eslint-config-prettier/flat'

const browserFiles = [
    'widgets/**/*.{js,jsx,ts,tsx}',
    'shared/**/*.{js,jsx,ts,tsx}',
]
const reactFiles = ['widgets/**/*.{jsx,tsx}', 'shared/**/*.{jsx,tsx}']

export default defineConfig([
    // Vendored from upstream.
    globalIgnores([
        'dist/',
        'shared/infrastructure/grist/types/grist-plugin-api.d.ts',
    ]),

    {
        files: ['**/*.{js,mjs,cjs,jsx}'],
        plugins: { js },
        extends: ['js/recommended'],
    },

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
            pluginReact.configs.flat['jsx-runtime'],
            reactHooks.configs.flat.recommended,
        ],
        // Pinned: 'detect' crashes eslint-plugin-react 7.37.5 on ESLint 10. Keep in sync with React.
        settings: { react: { version: '19.2' } },
        rules: {
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
