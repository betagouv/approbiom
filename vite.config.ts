import { fileURLToPath, URL } from 'node:url'
import { readdirSync, writeFileSync } from 'node:fs'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

const widgetsDir = fileURLToPath(new URL('./grist-widget', import.meta.url))
const widgetEntries = Object.fromEntries(
  readdirSync(widgetsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => [
      d.name,
      fileURLToPath(new URL(`./grist-widget/${d.name}/index.html`, import.meta.url)),
    ]),
)

// https://vite.dev/config/
export default defineConfig({
  base: '/approbiom/',
  plugins: [
    vue(),
    vueDevTools(),
    // GitHub Pages uses Jekyll which silently blocks files starting with '_'.
    // Vite generates _plugin-vue_export-helper.js which would be 404.
    // An empty .nojekyll file disables Jekyll so all files are served as-is.
    {
      name: 'github-pages-nojekyll',
      closeBundle() {
        writeFileSync('docs/.nojekyll', '')
      },
    },
    // Vite handles .json natively but not .geojson — this plugin bridges the gap.
    {
      name: 'geojson',
      transform(src, id) {
        if (id.endsWith('.geojson')) {
          return { code: `export default ${src}` }
        }
      },
    },
    // Injects the Grist plugin API script into every widget's <head> automatically,
    {
      name: 'inject-grist-api',
      transformIndexHtml: {
        order: 'pre',
        handler(html, ctx) {
          if (!ctx.filename.includes('grist-widget')) return html
          return {
            html,
            tags: [
              {
                tag: 'script',
                attrs: { src: 'https://docs.getgrist.com/grist-plugin-api.js' },
                injectTo: 'head',
              },
              {
                tag: 'style',
                children: 'body { margin: 0; }',
                injectTo: 'head',
              },
            ],
          }
        },
      },
    },
  ],
  resolve: {
    alias: {
      '@shared': fileURLToPath(new URL('./shared', import.meta.url)),
    },
  },
  build: {
    outDir: 'docs',
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        ...widgetEntries,
      },
    },
  },
})
