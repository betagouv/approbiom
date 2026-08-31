// Builds every widget into dist/staging/<widget-name>/
//
// Why one Vite build per widget instead of a single multi-page build?
// Vite's multi-page output mirrors the input folder structure, so we would
// get dist/widgets/widget-a/ and have to shuffle files afterwards. Pointing
// Vite's `root` at each widget folder produces the right tree directly, and
// gives each widget a fully self-contained bundle — which is what we want,
// since Grist loads each one in its own iframe.

import { readdirSync, rmSync, copyFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { build } from 'vite'

const projectRoot = resolve(import.meta.dirname, '..')
const widgetsDir = resolve(projectRoot, 'widgets')
const outputDir = resolve(projectRoot, 'dist/staging')

// Start clean, so a widget that was deleted from widgets/ cannot linger
// in the output from a previous build.
rmSync(outputDir, { recursive: true, force: true })
mkdirSync(outputDir, { recursive: true })

const widgets = readdirSync(widgetsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)

for (const name of widgets) {
    console.log(`\n▶ Building ${name}…`)

    await build({
        // Reuse the shared config (base, alias, React plugin) and only override
        // where this widget differs.
        configFile: resolve(projectRoot, 'vite.config.js'),

        // This widget's folder is the root: its index.html is the entry point.
        root: resolve(widgetsDir, name),

        build: {
            outDir: resolve(outputDir, name),
            // Required because outDir sits outside root — without it Vite refuses
            // to clear the folder and prints a warning.
            emptyOutDir: true,
        },
    })
}

// The launcher page is plain HTML with no imports, so a copy is enough.
// (If it ever imports a stylesheet or a script, it will need a real Vite
// build of its own instead of this copy.)
copyFileSync(
    resolve(projectRoot, 'index.html'),
    resolve(outputDir, 'index.html')
)

console.log(`\n✓ Built ${widgets.length} widget(s) into dist/staging/`)
