// Builds every widget into dist/staging/<widget-name>/, one Vite build per widget.

import { readdirSync, rmSync, copyFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { build } from 'vite'

const projectRoot = resolve(import.meta.dirname, '../..')
const widgetsDir = resolve(projectRoot, 'widgets')
const outputDir = resolve(projectRoot, 'dist/staging')

rmSync(outputDir, { recursive: true, force: true })
mkdirSync(outputDir, { recursive: true })

const widgets = readdirSync(widgetsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)

for (const name of widgets) {
    console.log(`\n▶ Building ${name}…`)

    await build({
        configFile: resolve(projectRoot, 'vite.config.js'),

        root: resolve(widgetsDir, name),

        build: {
            outDir: resolve(outputDir, name),
            // Required because outDir sits outside root.
            emptyOutDir: true,
        },
    })
}

// Plain copy: only valid while index.html imports nothing.
copyFileSync(
    resolve(projectRoot, 'index.html'),
    resolve(outputDir, 'index.html')
)

console.log(`\n✓ Built ${widgets.length} widget(s) into dist/staging/`)
