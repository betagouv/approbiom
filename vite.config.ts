import { fileURLToPath, URL } from 'node:url'
import { readdirSync } from 'node:fs'

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
  plugins: [
    vue(),
    vueDevTools(),
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
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        ...widgetEntries,
      },
    },
  },
})
